/**
 * 原型检索视图 v2.2
 * 职责：标题/全文双模式检索、馆藏与朝代筛选、命中高亮、每页条数
 */
(function (AB) {
  "use strict";

  function highlight(snippet, kw) {
    var out = AB.esc(snippet);
    var key = AB.esc(kw);
    if (!key) return out;
    return out.split(key).join("<mark>" + key + "</mark>");
  }

  function dynastyOptions() {
    var seen = [];
    AB.DATA.books.forEach(function (b) {
      if (b.dynasty && seen.indexOf(b.dynasty) < 0) seen.push(b.dynasty);
    });
    return seen;
  }

  function renderSearch(main) {
    var kw = AB.state.searchKeyword || "不亦说乎";
    var mode = AB.state.searchMode || "full";
    var limit = AB.state.searchLimit || 20;
    var cat = AB.state.filterCategory || "全部馆藏";
    var dyn = AB.state.filterDynasty || "全部朝代";

    var results = [];
    AB.DATA.books.forEach(function (b) {
      if (cat !== "全部馆藏" && b.category !== cat) return;
      if (dyn !== "全部朝代" && b.dynasty !== dyn) return;
      var titleHit = b.title.indexOf(kw) > -1;
      var chapterHit = (b.chapters || []).some(function (c) { return c.indexOf(kw) > -1; });
      var bodyHit = AB.getChapterText(b, 0).indexOf(kw) > -1 || (b.desc && b.desc.indexOf(kw) > -1);
      var hit = mode === "title" ? (titleHit || chapterHit) : (titleHit || chapterHit || bodyHit);
      if (!hit) return;
      results.push({
        id: b.id,
        book: b.title,
        chapter: (b.chapters || ["正文"])[0],
        path: "首页 > " + b.category + " > " + b.title,
        snippet: "「" + (b.chapters || ["正文"])[0] + "」：" +
          AB.getChapterText(b, 0).replace(/<[^>]+>/g, "").substring(0, 60) + "…",
        score: titleHit ? 98 : (chapterHit ? 92 : 80)
      });
    });

    AB.DATA.characters.forEach(function (p) {
      if (!kw) return;
      if (p.name.indexOf(kw) > -1 || (p.zi && p.zi.indexOf(kw) > -1)) {
        results.push({ id: "", book: p.name, chapter: "人物档案", path: "考据 > " + (p.dynasty || "待考"), snippet: p.desc || "暂无人物小传", score: 90 });
      }
    });

    // 零命中时展示常见检索样例，并明确标注为示例，避免误认为真实命中
    var fallback = false;
    if (!results.length && AB.DATA.searchDemo && AB.DATA.searchDemo.results) {
      fallback = true;
      results = AB.DATA.searchDemo.results.map(function (r) {
        return { id: "", book: r.book, chapter: r.chapter, path: r.path, snippet: r.snippet, score: r.score };
      });
    }

    var shown = results.slice(0, limit);
    var listHtml = shown.map(function (r) {
      var click = r.id ? 'onclick="AB.openBook(\'' + AB.esc(r.id) + '\')"' : "";
      return '<div class="search-result-item fade-in" ' + click + '>' +
        '<div class="result-title">' + AB.toSimplified(r.book) + ' · ' + AB.toSimplified(r.chapter) + '</div>' +
        '<div class="path-info"><span>' + AB.toSimplified(r.path) + '</span><span class="score-badge">' + r.score + '</span></div>' +
        '<div class="snippet">' + AB.toSimplified(highlight(r.snippet, kw)) + '</div>' +
        '</div>';
    }).join("");
    var more = results.length > limit
      ? '<div class="search-more">' + AB.toSimplified('已显示前 ') + limit + AB.toSimplified(' 条，共命中 ') + results.length + AB.toSimplified(' 条') + '</div>'
      : '';

    main.innerHTML =
      '<section>' +
        '<div class="breadcrumb"><a href="#page-home">' + AB.toSimplified('首页') + '</a><span class="sep">/</span><span>' +
          AB.toSimplified('检索') + '</span></div>' +
        '<div class="search-box" style="max-width:700px;margin-bottom:24px;">' +
          '<input class="input-text" id="search-input" aria-label="检索关键词" value="' + AB.esc(kw) +
            '" placeholder="' + AB.toSimplified('输入关键词，如：论语、仁义、孔子') + '">' +
          '<button class="btn btn-primary search-btn" id="search-btn">' + AB.toSimplified('搜索') + '</button>' +
        '</div>' +
        '<div class="filter-panel">' +
          '<div class="search-mode-group" id="search-mode" role="radiogroup" aria-label="' + AB.toSimplified('检索模式') + '">' +
            '<button class="btn-toggle ' + (mode === "title" ? "on" : "") + '" data-smode="title" aria-pressed="' + (mode === "title") + '">' +
              AB.toSimplified('标题检索') + '</button>' +
            '<button class="btn-toggle ' + (mode === "full" ? "on" : "") + '" data-smode="full" aria-pressed="' + (mode === "full") + '">' +
              AB.toSimplified('全文检索') + '</button>' +
          '</div>' +
          '<select id="filter-cat" aria-label="' + AB.toSimplified('馆藏筛选') + '"><option value="全部馆藏">' +
            AB.toSimplified('全部馆藏') + '</option>' +
            AB.DATA.categories.map(function (c) {
              return '<option value="' + AB.esc(c.name) + '"' + (c.name === cat ? " selected" : "") + '>' + AB.esc(c.name) + '</option>';
            }).join("") + '</select>' +
          '<select id="filter-dynasty" aria-label="' + AB.toSimplified('朝代筛选') + '"><option value="全部朝代">' +
            AB.toSimplified('全部朝代') + '</option>' +
            dynastyOptions().map(function (d) {
              return '<option value="' + AB.esc(d) + '"' + (d === dyn ? " selected" : "") + '>' + AB.esc(d) + '</option>';
            }).join("") + '</select>' +
          '<select id="filter-limit" aria-label="' + AB.toSimplified('每页条数') + '">' +
            [10, 20, 50].map(function (n) {
              return '<option value="' + n + '"' + (n === limit ? " selected" : "") + '>' + AB.toSimplified('每页') + n + AB.toSimplified('条') + '</option>';
            }).join("") +
          '</select>' +
        '</div>' +
        '<div class="search-stat">' + AB.toSimplified('关键词「') + AB.esc(kw) + '」· ' +
          (mode === "title" ? AB.toSimplified('标题模式') : AB.toSimplified('全文模式')) +
          (fallback ? AB.toSimplified(' · 未命中，以下为常见检索样例') : AB.toSimplified(' 共命中 ') + results.length + AB.toSimplified(' 条结果')) + '</div>' +
        (listHtml || '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">' +
          AB.toSimplified('未找到相关内容') + '</div><div>' + AB.toSimplified('请尝试更换关键词或减少筛选条件') + '</div></div>') +
        more +
      '</section>';

    var inp = AB.$("#search-input");
    var btn = AB.$("#search-btn");
    function doSearch() {
      if (inp && inp.value.trim()) {
        AB.state.searchKeyword = inp.value.trim();
        renderSearch(AB.getMain());
      }
    }
    if (btn) btn.addEventListener("click", doSearch);
    if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(); });
    var catSel = AB.$("#filter-cat");
    if (catSel) catSel.addEventListener("change", function () { AB.state.filterCategory = this.value; renderSearch(AB.getMain()); });
    var dynSel = AB.$("#filter-dynasty");
    if (dynSel) dynSel.addEventListener("change", function () { AB.state.filterDynasty = this.value; renderSearch(AB.getMain()); });
    var limSel = AB.$("#filter-limit");
    if (limSel) limSel.addEventListener("change", function () {
      AB.state.searchLimit = parseInt(this.value, 10);
      AB.lsSet("ab-slimit", AB.state.searchLimit);
      renderSearch(AB.getMain());
    });
    AB.$$("#search-mode .btn-toggle").forEach(function (bt) {
      bt.addEventListener("click", function () {
        AB.state.searchMode = bt.getAttribute("data-smode");
        AB.lsSet("ab-smode", AB.state.searchMode);
        renderSearch(AB.getMain());
      });
    });
    AB.bindFadeIn(main);
  }

  AB.renderSearch = renderSearch;
})(window.AB = window.AB || {});
