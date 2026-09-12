/**
 * 原型人物库视图 v1.0
 * 职责：历代人物浏览（demo 数据；正式站接入 CBDB 全量 661,350 人）
 * 与 view-character.js（人物考据）共享数据 AB.DATA.characters，但定位为「按姓氏/朝代浏览」的库
 */
(function (AB) {
  "use strict";

  /* 仅渲染有值的字段，避免派生数据缺失时显示 undefined / 空行 */
  function personRows(p) {
    var rows = "";
    function row(label, value) {
      if (!value) return;
      rows += '<div class="info-row"><label>' + AB.toSimplified(label) + '</label>' + AB.toSimplified(value) + '</div>';
    }
    row("朝代", p.dynasty);
    row("籍贯", p.native);
    row("生卒", (p.birth || p.death) ? (p.birth || "?") + " — " + (p.death || "?") : "");
    row("官职", p.office);
    if (p.tags && p.tags.length) {
      rows += '<div class="info-row">' + p.tags.map(function (t) {
        return '<span class="tag tag-hover">' + AB.toSimplified(t) + '</span>';
      }).join("") + '</div>';
    }
    row("简介", p.desc);
    if (p.books && p.books.length) row("关联著作", p.books.join("、"));
    return rows;
  }

  function renderPeople(main) {
    var kw = AB.state.searchKeyword || "";
    var list = AB.DATA.characters.filter(function (p) {
      return !kw || p.name.indexOf(kw) > -1 || (p.zi && p.zi.indexOf(kw) > -1) || (p.alias && p.alias.indexOf(kw) > -1);
    });
    var cards = list.map(function (p) {
      var sub = (p.zi ? "字" + p.zi : "") + (p.alias ? " · " + p.alias : "");
      return '<div class="character-card fade-in" style="margin-bottom:16px;">' +
        '<div class="char-name">' + AB.toSimplified(p.name) +
          (sub ? '<span class="char-zi">' + AB.toSimplified(sub) + '</span>' : '') + '</div>' +
        personRows(p) +
        '</div>';
    }).join("");

    main.innerHTML =
      '<section>' +
        '<div class="breadcrumb"><a href="#page-home">' + AB.toSimplified('首页') + '</a><span class="sep">/</span><span>' +
          AB.toSimplified('人物库') + '</span></div>' +
        '<h2 style="margin-bottom:8px;">' + AB.toSimplified('历代人物库') + '</h2>' +
        '<p style="color:var(--color-text-secondary);margin-bottom:24px;">' +
          AB.toSimplified('CBDB 中国历代人物传记资料库 · 按姓名/字号检索浏览（demo 展示样例人物，正式站接入全量 661,350 人）') + '</p>' +
        '<div class="search-box" style="max-width:560px;margin-bottom:24px;">' +
          '<input class="input-text" id="char-input" aria-label="人物姓名或字号" placeholder="' +
            AB.toSimplified('检索人物姓名/字号') + '" value="' + AB.esc(kw) + '">' +
          '<button class="btn btn-primary search-btn" id="char-btn">' + AB.toSimplified('检索') + '</button>' +
        '</div>' +
        (cards || '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">' +
          AB.toSimplified('未找到匹配人物') + '</div><div>' + AB.toSimplified('请尝试更换关键词') + '</div></div>') +
      '</section>';

    var inp = AB.$("#char-input"), btn = AB.$("#char-btn");
    function doSearch() {
      AB.state.searchKeyword = inp ? inp.value.trim() : "";
      renderPeople(AB.getMain());
    }
    if (btn) btn.addEventListener("click", doSearch);
    if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(); });
    AB.bindFadeIn(main);
  }

  AB.renderPeople = renderPeople;
})(window.AB = window.AB || {});
