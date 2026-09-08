/**
 * 原型核心模块 v2.2
 * 职责：全局状态、DOM/文本工具、主题与品牌联动、页脚统计、入场动效
 */
(function (AB) {
  "use strict";

  AB.DATA = window.APP_DATA || { categories: [], books: [], characters: [], relations: [], glossary: [] };

  /* localStorage 在 file:// 直开或隐私模式下可能抛错，统一兜底 */
  function lsGet(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) { /* 忽略：存储不可用时功能降级 */ }
  }
  AB.lsGet = lsGet;
  AB.lsSet = lsSet;

  AB.state = {
    theme: lsGet("ab-theme", "light"),
    simplified: lsGet("ab-simple", "0") === "1",
    device: lsGet("ab-device", "desktop"),
    fontSize: parseInt(lsGet("ab-fs", "16"), 10),
    lineHeight: parseFloat(lsGet("ab-lh", "1.8")),
    chapterIdx: parseInt(lsGet("ab-chapter", "0"), 10),
    currentBookId: lsGet("ab-book", "ru-lunyu"),
    searchKeyword: "",
    filterCategory: "全部馆藏",
    filterDynasty: "全部朝代",
    searchMode: lsGet("ab-smode", "full"),
    charMode: "normal",
    relType: "",
    searchLimit: parseInt(lsGet("ab-slimit", "20"), 10),
    showImage: false
  };

  /* ---------------- 通用工具 ---------------- */
  AB.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  AB.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  AB.esc = function (s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  AB.toSimplified = function (text) {
    if (!AB.state.simplified) return text;
    var map = AB.T2S_MAP || {};
    return String(text).split("").map(function (c) { return map[c] || c; }).join("");
  };
  AB.save = function () {
    var s = AB.state;
    lsSet("ab-theme", s.theme);
    lsSet("ab-simple", s.simplified ? "1" : "0");
    lsSet("ab-device", s.device);
    lsSet("ab-fs", s.fontSize);
    lsSet("ab-lh", s.lineHeight);
  };
  AB.mappingCount = function () { return Object.keys(AB.T2S_MAP || {}).length; };

  /* 兼容综合页（#main-view）与独立页（#page-body）两种容器，避免独立页二次渲染拿到 null */
  AB.getMain = function () { return AB.$("#main-view") || AB.$("#page-body"); };

  /* ---------------- 品牌 logo 主题联动 ---------------- */
  AB.syncBrandLogo = function () {
    AB.$$(".brand-logo").forEach(function (img) {
      var light = img.getAttribute("data-logo-light");
      var dark = img.getAttribute("data-logo-dark");
      if (AB.state.theme === "dark" && dark) img.setAttribute("src", dark);
      else if (light) img.setAttribute("src", light);
    });
  };

  /* ---------------- 页脚统计（与线上 Footer 口径一致） ---------------- */
  AB.renderFooterStats = function () {
    var el = AB.$("#footer-stats");
    if (!el) return;
    el.textContent =
      "馆藏 " + AB.DATA.categories.length + " 类" +
      " · 精选典籍 " + AB.DATA.books.length + " 部" +
      " · 全馆藏 15,694 部（殆知阁 v20）" +
      " · 人物 " + AB.DATA.characters.length + " 位" +
      " · 考据关系 " + AB.DATA.relations.length + " 条";
  };

  /* ---------------- 卡片入场动效 ---------------- */
  AB.bindFadeIn = function (container) {
    var items = AB.$$(".fade-in", container);
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("visible"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.05 });
    items.forEach(function (i) { obs.observe(i); });
  };

  /* ---------------- 原型演示提示条 ---------------- */
  /* 原型数据（45 部演示书目 / 派生人物 / 样张正文）与正式站点不同源，顶部常驻提示避免误读 */
  AB.renderPrototypeNotice = function () {
    if (AB.$("#prototype-notice")) return;
    var bar = document.createElement("div");
    bar.id = "prototype-notice";
    bar.className = "prototype-notice";
    bar.setAttribute("role", "note");
    bar.innerHTML = '<span class="pn-badge">原型</span>' +
      '<span>本页为交互原型，书目/人物/正文均为演示数据；正式站点直连殆知阁 v20 全量 15,694 部原文。</span>';
    var anchor = AB.$(".device-bar");
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(bar, anchor);
    else document.body.insertBefore(bar, document.body.firstChild);
  };

  /* ---------------- 打开书籍 ---------------- */
  /* 综合页走哈希路由；独立页（pages/*.html）无哈希路由，直接重渲染 #page-body */
  AB.openBook = function (id) {
    AB.state.currentBookId = id;
    AB.state.chapterIdx = 0;
    lsSet("ab-book", id);
    lsSet("ab-chapter", "0");
    if (AB.$("#main-view")) { location.hash = "#read/" + id; return; }
    var main = AB.$("#page-body");
    if (main && AB.renderReader) AB.renderReader(main, id);
  };
})(window.AB = window.AB || {});
