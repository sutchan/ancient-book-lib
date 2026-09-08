/**
 * 原型人物考据视图 v2.2
 * 职责：人物检索（字段缺失留空不虚构）与作废 ID 查询
 */
(function (AB) {
  "use strict";

  var OBSOLETE_IDS = [
    { id: "CBDB-562723", reason: "该 ID 因重名合并已停用，正式档案移至 CBDB-562724 孔子（鲁国）", valid: "是" },
    { id: "CBDB-000001", reason: "旧版测试条目，正式数据以 2024 版数据集为准", valid: "是" }
  ];

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

  function modeToggle(active) {
    return '<div class="search-mode-group" id="char-mode" style="margin-bottom:16px;">' +
      '<button class="btn-toggle' + (active === "normal" ? " on" : "") + '" data-cmode="normal" aria-pressed="' + (active === "normal") + '">' +
        AB.toSimplified('人物检索') + '</button>' +
      '<button class="btn-toggle' + (active === "obsolete" ? " on" : "") + '" data-cmode="obsolete" aria-pressed="' + (active === "obsolete") + '">' +
        AB.toSimplified('作废 ID 查询') + '</button>' +
      '</div>';
  }

  function bindCharControls(main, isObsolete) {
    var inp = AB.$("#char-input"), btn = AB.$("#char-btn");
    function doSearch() {
      AB.state.searchKeyword = inp ? inp.value.trim() : "";
      renderCharacter(AB.getMain());
    }
    if (btn) btn.addEventListener("click", doSearch);
    if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(); });
    AB.$$("#char-mode .btn-toggle").forEach(function (bt) {
      bt.addEventListener("click", function () {
        AB.state.charMode = bt.getAttribute("data-cmode");
        renderCharacter(AB.getMain());
      });
    });
    AB.bindFadeIn(main);
  }

  function renderCharacter(main) {
    var kw = AB.state.searchKeyword || "";
    if (AB.state.charMode === "obsolete") {
      var rows = OBSOLETE_IDS.filter(function (o) { return !kw || o.id.indexOf(kw) > -1; }).map(function (o) {
        return '<div class="relation-item fade-in" style="border-left-color:var(--color-text-secondary);">' +
          '<div><span class="rel-a" style="font-family:monospace;font-size:14px;">' + AB.esc(o.id) + '</span>' +
            '<span class="rel-type">' + AB.toSimplified('已作废') + '</span></div>' +
          '<div class="info-row" style="margin-top:8px;">' + AB.toSimplified(o.reason) + '</div>' +
          '<div class="rel-source">' + AB.toSimplified('是否仍有正式档案：') +
            (o.valid === "是" ? AB.toSimplified('是，已迁移') : AB.toSimplified('否')) + '</div>' +
          '</div>';
      }).join("");
      main.innerHTML =
        '<section>' +
          '<div class="breadcrumb"><a href="#page-home">' + AB.toSimplified('首页') + '</a><span class="sep">/</span><span>' +
            AB.toSimplified('人物考据') + '</span></div>' +
          '<h2 style="margin-bottom:8px;">' + AB.toSimplified('历史人物考据') + '</h2>' +
          '<p style="color:var(--color-text-secondary);margin-bottom:24px;">' +
            AB.toSimplified('作废 ID 统一公示，避免检索到已合并或失效的历史人物档案') + '</p>' +
          modeToggle("obsolete") +
          '<div class="search-box" style="max-width:560px;margin-bottom:16px;">' +
            '<input class="input-text" id="char-input" aria-label="已作废 CBDB ID" placeholder="' +
              AB.toSimplified('输入已作废 CBDB ID，如：562723') + '" value="' + AB.esc(kw) + '">' +
            '<button class="btn btn-primary search-btn" id="char-btn">' + AB.toSimplified('查询') + '</button>' +
          '</div>' +
          '<div class="info-row" style="color:var(--color-text-secondary);font-size:13px;margin-bottom:16px;">' +
            AB.toSimplified('学术严谨性保障：历史人物 ID 合并、迁移后统一公示') + '</div>' +
          (rows || '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">' +
            AB.toSimplified('未找到该作废 ID') + '</div><div>' + AB.toSimplified('该 ID 可能从未建立或已完全移除') + '</div></div>') +
        '</section>';
      bindCharControls(main, true);
      return;
    }

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
          AB.toSimplified('人物考据') + '</span></div>' +
        '<h2 id="character-title" style="margin-bottom:8px;">' + AB.toSimplified('历史人物考据') + '</h2>' +
        '<p id="character-desc" style="color:var(--color-text-secondary);margin-bottom:24px;">' +
          AB.toSimplified('人物由馆藏典籍作者字段自动派生，缺失字段留空不虚构；后续接入 CBDB 等公开数据集') + '</p>' +
        modeToggle("normal") +
        '<div class="search-box" style="max-width:560px;margin-bottom:24px;">' +
          '<input class="input-text" id="char-input" aria-label="人物姓名或字号" placeholder="' +
            AB.toSimplified('检索人物姓名/字号') + '" value="' + AB.esc(kw) + '">' +
          '<button class="btn btn-primary search-btn" id="char-btn">' + AB.toSimplified('检索') + '</button>' +
        '</div>' +
        (cards || '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">' +
          AB.toSimplified('未找到匹配人物') + '</div><div>' + AB.toSimplified('请尝试更换关键词') + '</div></div>') +
      '</section>';
    bindCharControls(main, false);
  }

  AB.renderCharacter = renderCharacter;
})(window.AB = window.AB || {});
