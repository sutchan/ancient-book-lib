/**
 * 原型启动与路由模块 v2.2
 * 职责：全局控件（主题/繁简/设备/汉堡菜单）、导航高亮、哈希路由与独立页初始化
 */
(function (AB) {
  "use strict";

  var PAGE_RENDERERS = {
    home: function (m) { AB.renderHome(m); },
    category: function (m) { AB.renderCategory(m); },
    "book-list": function (m) { AB.renderBookList(m); },
    search: function (m) { AB.renderSearch(m); },
    character: function (m) { AB.renderCharacter(m); },
    relation: function (m) { AB.renderRelation(m); },
    help: function (m) { AB.renderHelp(m); },
    stats: function (m) { AB.renderStats(m); },
    read: function (m) { AB.renderReader(m, AB.state.currentBookId); }
  };
  AB.PAGE_RENDERERS = PAGE_RENDERERS;

  var THEME_LABEL = { light: "日间", paper: "护眼", dark: "深色" };

  /* 当前页面标识：综合页取哈希，独立页取 body[data-page] */
  function currentKey() {
    if (AB.$("#main-view")) {
      var h = location.hash || "#page-home";
      if (h.indexOf("#read/") === 0) return "book-list";
      return h.replace("#page-", "") || "home";
    }
    return document.body.getAttribute("data-page") || "home";
  }

  /* 导航高亮 + aria-current，兼顾哈希综合页与独立页两种链接形态 */
  function highlightNav() {
    var cur = currentKey();
    var isHash = !!AB.$("#main-view");
    var needle = isHash ? "#page-" + cur : (cur === "home" ? "index.html" : cur + ".html");
    AB.$$(".nav-menu a, .mobile-menu a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var on = href.indexOf(needle) > -1;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }
  AB.highlightNav = highlightNav;

  function initGlobal() {
    var body = document.body;
    body.setAttribute("data-theme", AB.state.theme);
    body.setAttribute("data-device", AB.state.device);
    AB.syncBrandLogo();

    var btnTheme = AB.$("#btn-theme");
    if (btnTheme) {
      btnTheme.textContent = THEME_LABEL[AB.state.theme] || "日间";
      btnTheme.setAttribute("aria-label", "切换阅读主题（当前" + (THEME_LABEL[AB.state.theme] || "日间") + "）");
      btnTheme.addEventListener("click", function () {
        var list = ["light", "paper", "dark"];
        AB.state.theme = list[(list.indexOf(AB.state.theme) + 1) % list.length];
        body.setAttribute("data-theme", AB.state.theme);
        btnTheme.textContent = THEME_LABEL[AB.state.theme];
        AB.syncBrandLogo();
        AB.save();
      });
    }

    var btnSimp = AB.$("#btn-toggle-simplified");
    if (btnSimp) {
      function sync() {
        btnSimp.textContent = AB.state.simplified ? "简体" : "繁体";
        btnSimp.classList.toggle("on", !AB.state.simplified);
        btnSimp.setAttribute("aria-pressed", String(AB.state.simplified));
      }
      sync();
      btnSimp.addEventListener("click", function () {
        AB.state.simplified = !AB.state.simplified;
        sync();
        AB.save();
        reRender();
      });
    }

    var ham = AB.$("#hamburger");
    var menu = AB.$("#mobile-menu");
    if (ham && menu) {
      ham.setAttribute("aria-label", "展开导航菜单");
      ham.setAttribute("aria-controls", "mobile-menu");
      ham.setAttribute("aria-expanded", "false");
      ham.addEventListener("click", function () {
        var open = menu.classList.toggle("open");
        ham.setAttribute("aria-expanded", String(open));
      });
      AB.$$(".mobile-menu a").forEach(function (a) {
        a.addEventListener("click", function () {
          menu.classList.remove("open");
          ham.setAttribute("aria-expanded", "false");
        });
      });
    }

    AB.$$(".device-btn").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-device") === AB.state.device));
      btn.classList.toggle("active", btn.getAttribute("data-device") === AB.state.device);
      btn.addEventListener("click", function () {
        AB.state.device = btn.getAttribute("data-device");
        body.setAttribute("data-device", AB.state.device);
        AB.$$(".device-btn").forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("active", on);
          b.setAttribute("aria-pressed", String(on));
        });
        AB.save();
      });
    });
  }

  function renderRoute(main) {
    var hash = location.hash || "#page-home";
    var readMatch = hash.match(/^#read\/([\w-]+)/);
    if (readMatch) {
      AB.state.currentBookId = readMatch[1];
      AB.renderReader(main, readMatch[1]);
    } else {
      var key = hash.replace("#page-", "") || "home";
      (PAGE_RENDERERS[key] || PAGE_RENDERERS.home)(main);
    }
    AB.bindFadeIn(main);
    highlightNav();
    window.scrollTo(0, 0);
  }

  function reRender() {
    var main = AB.getMain();
    if (!main) return;
    if (main.id === "main-view") return renderRoute(main);
    var page = window.__currentPage;
    if (page && PAGE_RENDERERS[page]) PAGE_RENDERERS[page](main);
  }
  AB.reRender = reRender;

  /* pages/*.html 独立页面：body[data-page] 指定渲染器，输出到 #page-body */
  function initStandalone() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;
    window.__currentPage = page;
    var container = AB.$("#page-body");
    if (!container || !PAGE_RENDERERS[page]) return;
    PAGE_RENDERERS[page](container);
    AB.bindFadeIn(container);
  }

  function boot() {
    initGlobal();
    AB.renderFooterStats();
    var main = AB.$("#main-view");
    if (main) {
      window.addEventListener("hashchange", function () { renderRoute(main); });
      renderRoute(main);
    }
    initStandalone();
    highlightNav();
  }

  document.addEventListener("DOMContentLoaded", boot);
  if (document.readyState === "complete" || document.readyState === "interactive") boot();
})(window.AB = window.AB || {});
