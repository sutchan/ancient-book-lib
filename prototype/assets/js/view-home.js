/**
 * 原型首页 / 馆藏分类 / 书单视图 v2.2
 */
(function (AB) {
  "use strict";

  function renderHome(main) {
    var cats = AB.DATA.categories.map(function (c) {
      return '<div class="card category-card fade-in" onclick="AB.filterBooks(\'' + AB.esc(c.name) + '\')">' +
        '<div class="cat-icon">' + AB.esc(c.icon) + '</div>' +
        '<div class="cat-name">' + AB.esc(c.name) + '</div>' +
        '<div class="cat-desc">' + AB.esc(c.desc) + '</div>' +
        '</div>';
    }).join("");
    main.innerHTML =
      '<section>' +
        '<div class="home-hero fade-in">' +
          '<h1 class="hero-title">' + AB.toSimplified('古籍通') + '</h1>' +
          '<p class="hero-sub">' + AB.toSimplified('开源公益古籍检索阅读与考据平台 · 殆知阁 v20 全量 15,694 部古籍在线') + '</p>' +
          '<p class="hero-badge">' + AB.toSimplified('原始数据 4.9GB 托管于上游仓库 · 本仓库零复制 · 阅读时按需加载') + '</p>' +
          '<form class="search-box hero-search" id="home-search-form">' +
            '<input class="input-text" id="home-search-input" aria-label="检索关键词" placeholder="' +
              AB.toSimplified('检索古籍书名、内容、人物') + '">' +
            '<span class="search-mode-group" role="radiogroup" aria-label="检索模式">' +
              '<label class="btn-toggle"><input type="radio" name="hmode" value="full" checked> ' + AB.toSimplified('全文') + '</label>' +
              '<label class="btn-toggle"><input type="radio" name="hmode" value="title"> ' + AB.toSimplified('标题') + '</label>' +
            '</span>' +
            '<button class="btn btn-primary search-btn" id="home-search-btn" type="submit">' + AB.toSimplified('搜索') + '</button>' +
          '</form>' +
        '</div>' +
        '<h2 class="section-title">' + AB.toSimplified('十大馆藏') + '</h2>' +
        '<div class="category-grid">' + cats + '</div>' +
        '<h2 class="section-title">' + AB.toSimplified('学术工具') + '</h2>' +
        '<div class="category-grid">' +
          '<div class="card category-card fade-in" onclick="location.hash=\'#page-character\'">' +
            '<div class="cat-icon">考</div><div class="cat-name">' + AB.toSimplified('人物考据') + '</div>' +
            '<div class="cat-desc">' + AB.toSimplified('历史人物档案与史料聚合（数据待接入）') + '</div></div>' +
          '<div class="card category-card fade-in" onclick="location.hash=\'#page-relation\'">' +
            '<div class="cat-icon">系</div><div class="cat-name">' + AB.toSimplified('社会关系溯源') + '</div>' +
            '<div class="cat-desc">' + AB.toSimplified('人物多维关系与双人溯源（数据待接入）') + '</div></div>' +
          '<div class="card category-card fade-in" onclick="location.hash=\'#page-stats\'">' +
            '<div class="cat-icon">统</div><div class="cat-name">' + AB.toSimplified('数据统计') + '</div>' +
            '<div class="cat-desc">' + AB.toSimplified('馆藏规模与学术价值分析') + '</div></div>' +
        '</div>' +
      '</section>';
    var inp = AB.$("#home-search-input");
    var btn = AB.$("#home-search-btn");
    function doSearch(e) {
      if (e) e.preventDefault();
      var kw = inp ? inp.value.trim() : "";
      if (!kw) return;
      AB.state.searchKeyword = kw;
      var m = document.querySelector('input[name="hmode"]:checked');
      if (m) AB.state.searchMode = m.value;
      location.hash = "#page-search";
    }
    if (btn) btn.addEventListener("click", doSearch);
    var form = AB.$("#home-search-form");
    if (form) form.addEventListener("submit", doSearch);
    if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(e); });
  }

  /* 分类页：正式站点已将馆藏总览合并至「全馆藏」书目页，此处仅作引导跳转（与 /category 现状一致） */
  function renderCategory(main) {
    main.innerHTML =
      '<section>' +
        '<div class="breadcrumb"><a href="#page-home">' + AB.toSimplified('首页') + '</a>' +
          '<span class="sep">/</span><span>' + AB.toSimplified('全馆藏') + '</span></div>' +
        '<h2 style="margin-bottom:8px;">' + AB.toSimplified('全馆藏浏览') + '</h2>' +
        '<p style="color:var(--color-text-secondary);margin-bottom:24px;">' +
          AB.toSimplified('馆藏总览已合并至「全馆藏」书目页，可按馆藏分类浏览全部 15,694 部古籍：') + '</p>' +
        '<button class="btn btn-primary" onclick="location.hash=\'#page-book-list\'">' + AB.toSimplified('前往全馆藏书目') + '</button>' +
      '</section>';
  }

  /* 点击馆藏卡片：记录筛选并跳转书单 */
  AB.filterBooks = function (name) {
    AB.state.filterCategory = name || "全部馆藏";
    if (AB.$("#main-view")) { location.hash = "#page-book-list"; return; }
    renderBookList(AB.getMain());
  };

  function renderBookList(main) {
    var cat = AB.state.filterCategory || "全部馆藏";
    var books = AB.DATA.books.filter(function (b) { return cat === "全部馆藏" || b.category === cat; });
    var items = books.map(function (b) {
      return '<div class="book-item fade-in" onclick="AB.openBook(\'' + AB.esc(b.id) + '\')">' +
        '<div class="book-index">' + AB.esc(b.category.charAt(0)) + '</div>' +
        '<div>' +
          '<div class="book-title">' + AB.toSimplified(b.title) + '</div>' +
          '<div class="book-meta">' + AB.toSimplified(b.dynasty + ' · ' + b.author + ' · ' + b.chapters.length + ' 章节') + '</div>' +
        '</div>' +
        '</div>';
    }).join("");
    var chips = ["全部馆藏"].concat(AB.DATA.categories.map(function (c) { return c.name; })).map(function (name) {
      var on = name === cat;
      return '<button class="btn btn-sm ' + (on ? "btn-primary" : "btn-secondary") +
        ' tag-hover" data-cat="' + AB.esc(name) + '" aria-pressed="' + on + '">' + AB.esc(name) + '</button>';
    }).join("");
    main.innerHTML =
      '<section>' +
        '<div class="breadcrumb"><a href="#page-home">' + AB.toSimplified('首页') + '</a>' +
          '<span class="sep">/</span><span>' + AB.toSimplified('全馆藏') + '</span></div>' +
        '<h2 id="booklist-title" style="margin-bottom:8px;">' + AB.toSimplified('全馆藏') + '</h2>' +
        '<p id="booklist-count" style="color:var(--color-text-secondary);margin-bottom:24px;">' +
          AB.toSimplified('当前筛选共 ') + books.length + AB.toSimplified(' 部古籍，点击进入阅读') + '</p>' +
        '<div id="book-filter" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">' + chips + '</div>' +
        (items || '<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">' +
          AB.toSimplified('该馆藏暂无典籍') + '</div></div>') +
      '</section>';
    AB.$$("#book-filter [data-cat]", main).forEach(function (btn) {
      btn.addEventListener("click", function () {
        AB.state.filterCategory = btn.getAttribute("data-cat");
        renderBookList(AB.getMain());
      });
    });
  }

  AB.renderHome = renderHome;
  AB.renderCategory = renderCategory;
  AB.renderBookList = renderBookList;
})(window.AB = window.AB || {});
