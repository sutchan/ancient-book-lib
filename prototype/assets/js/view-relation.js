/**
 * 原型社会关系视图 v2.2
 * 职责：关系列表、关系类型筛选、双人关系查询（页面内展示结果，不再用 alert）
 */
(function (AB) {
  "use strict";

  function relationCard(r) {
    return '<div class="relation-item fade-in">' +
      '<div><span class="rel-a">' + AB.toSimplified(r.a) + '</span><span class="rel-type">' +
        AB.toSimplified(r.type) + '</span><span class="rel-a" style="margin-left:10px;">' + AB.toSimplified(r.b) + '</span></div>' +
      '<div class="info-row" style="margin-top:8px;color:var(--color-text);">' + AB.toSimplified(r.detail) + '</div>' +
      '<div class="rel-source">📖 ' + AB.toSimplified('史料出处：') + AB.esc(r.source) + '</div>' +
      '</div>';
  }

  function renderRelation(main) {
    var type = AB.state.relType || "";
    var list = AB.DATA.relations.filter(function (r) { return !type || r.type === type; });
    var types = [];
    AB.DATA.relations.forEach(function (r) { if (types.indexOf(r.type) < 0) types.push(r.type); });

    main.innerHTML =
      '<section>' +
        '<div class="breadcrumb"><a href="#page-home">' + AB.toSimplified('首页') + '</a><span class="sep">/</span><span>' +
          AB.toSimplified('社会关系溯源') + '</span></div>' +
        '<h2 id="relation-title" style="margin-bottom:8px;">' + AB.toSimplified('社会关系溯源') + '</h2>' +
        '<p style="color:var(--color-text-secondary);margin-bottom:24px;">' +
          AB.toSimplified('师生 · 同僚 · 交游 · 亲族 · 思想传承，支持双人关系查询') + '</p>' +
        '<div class="relation-form">' +
          '<input class="input-text" id="rel-a" aria-label="人物A" placeholder="' + AB.toSimplified('人物A（如：孔子）') + '">' +
          '<input class="input-text" id="rel-b" aria-label="人物B" placeholder="' + AB.toSimplified('人物B（如：颜回）') + '">' +
          '<button class="btn btn-primary" id="rel-btn">' + AB.toSimplified('查询关系') + '</button>' +
        '</div>' +
        '<div id="relation-query-result" aria-live="polite"></div>' +
        '<div class="relation-type" id="relation-type-filter">' +
          types.map(function (t) {
            return '<span class="tag tag-hover' + (t === type ? " on" : "") + '" data-rtype="' + AB.esc(t) +
              '" style="cursor:pointer;">' + AB.toSimplified(t) + '</span>';
          }).join("") +
        '</div>' +
        (list.map(relationCard).join("") || '<div class="empty-state"><div class="empty-icon">🕸</div>' +
          '<div class="empty-title">' + AB.toSimplified('暂无该类型关系') + '</div></div>') +
      '</section>';

    var box = AB.$("#relation-query-result", main);
    function query() {
      var a = (AB.$("#rel-a").value || "").trim();
      var b = (AB.$("#rel-b").value || "").trim();
      if (!a && !b) return;
      var found = AB.DATA.relations.filter(function (r) {
        return (!a || r.a === a || r.b === a) && (!b || r.a === b || r.b === b);
      });
      box.innerHTML = found.length
        ? '<div class="relation-item">' + found.map(relationCard).join("") + '</div>'
        : '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">' +
            AB.toSimplified('暂未检索到相关关系记录') + '</div><div>' +
            AB.toSimplified('可尝试仅输入一位人物，或改用关系类型筛选') + '</div></div>';
    }
    AB.$("#rel-btn").addEventListener("click", query);
    ["#rel-a", "#rel-b"].forEach(function (sel) {
      AB.$(sel).addEventListener("keydown", function (e) { if (e.key === "Enter") query(); });
    });
    AB.$$("#relation-type-filter [data-rtype]", main).forEach(function (tag) {
      tag.addEventListener("click", function () {
        var t = tag.getAttribute("data-rtype");
        AB.state.relType = AB.state.relType === t ? "" : t;
        renderRelation(AB.getMain());
      });
    });
    AB.bindFadeIn(main);
  }

  AB.renderRelation = renderRelation;
})(window.AB = window.AB || {});
