/**
 * 原型数据统计视图 v2.2
 * 职责：馆藏/朝代/身份/关系统计图表与数据洞察，全部由数据源实时计算
 */
(function (AB) {
  "use strict";

  function barRow(label, value, max, color) {
    var pct = max > 0 ? Math.round(value / max * 100) : 0;
    return '<div class="stat-bar-row">' +
      '<span class="stat-bar-label">' + AB.esc(label) + '</span>' +
      '<span class="stat-bar-track"><span class="stat-bar-fill" style="width:' + pct + '%;background:' +
        (color || 'var(--color-primary)') + ';"></span></span>' +
      '<span class="stat-bar-value">' + value + '</span>' +
      '</div>';
  }
  function bars(arr, emptyText) {
    if (!arr.length) return '<div class="info-row" style="color:var(--color-text-secondary);">' + AB.toSimplified(emptyText) + '</div>';
    var max = arr[0].count || 1;
    return arr.map(function (x) { return barRow(x.name, x.count, max); }).join("");
  }
  function countBy(list, pick) {
    var map = {};
    list.forEach(function (item) {
      (pick(item) || []).forEach(function (k) { map[k] = (map[k] || 0) + 1; });
    });
    return Object.keys(map).map(function (k) { return { name: k, count: map[k] }; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  function renderStats(main) {
    var D = AB.DATA;
    var books = D.books, chars = D.characters, rels = D.relations, cats = D.categories;
    var totalChapters = books.reduce(function (s, b) { return s + (b.chapters ? b.chapters.length : 0); }, 0);
    var catCounts = cats.map(function (c) {
      return { name: c.name, count: books.filter(function (b) { return b.category === c.name; }).length };
    });
    var dynArr = countBy(books, function (b) { return [b.dynasty || "未知"]; });
    var tagArr = countBy(chars, function (c) { return c.tags || []; }).slice(0, 8);
    var rtArr = countBy(rels, function (r) { return [r.type]; });
    var mappingCount = AB.mappingCount();

    main.innerHTML =
      '<section>' +
        '<div class="breadcrumb"><a href="#page-home">' + AB.toSimplified('首页') + '</a><span class="sep">/</span><span>' +
          AB.toSimplified('数据统计') + '</span></div>' +
        '<h2 id="stats-title" style="margin-bottom:8px;">' + AB.toSimplified('平台数据统计与洞察') + '</h2>' +
        '<p style="color:var(--color-text-secondary);margin-bottom:24px;">' +
          AB.toSimplified('基于馆藏、典籍、人物、关系四类数据实时计算，展示古籍通资源全貌与学术价值') + '</p>' +
        '<div class="stat-kpis">' +
          '<div class="stat-kpi fade-in"><div class="kpi-num">' + cats.length + '</div><div class="kpi-label">' +
            AB.toSimplified('馆藏大类') + '</div></div>' +
          '<div class="stat-kpi fade-in"><div class="kpi-num">' + books.length + '</div><div class="kpi-label">' +
            AB.toSimplified('收录典籍') + '</div></div>' +
          '<div class="stat-kpi fade-in"><div class="kpi-num">' + totalChapters + '</div><div class="kpi-label">' +
            AB.toSimplified('章节/卷次') + '</div></div>' +
          '<div class="stat-kpi fade-in"><div class="kpi-num">' + chars.length + '</div><div class="kpi-label">' +
            AB.toSimplified('考据人物') + '</div></div>' +
          '<div class="stat-kpi fade-in"><div class="kpi-num">' + rels.length + '</div><div class="kpi-label">' +
            AB.toSimplified('社会关系') + '</div></div>' +
          '<div class="stat-kpi fade-in"><div class="kpi-num">' + mappingCount + '</div><div class="kpi-label">' +
            AB.toSimplified('繁简映射字') + '</div></div>' +
        '</div>' +
        '<div class="stat-grid">' +
          '<div class="character-card stat-panel fade-in"><div class="stat-panel-title">' +
            AB.toSimplified('十大馆藏典籍分布') + '</div><div class="stat-bars">' +
            bars(catCounts, '暂无馆藏数据') + '</div></div>' +
          '<div class="character-card stat-panel fade-in"><div class="stat-panel-title">' +
            AB.toSimplified('典籍朝代分布（Top）') + '</div><div class="stat-bars">' +
            bars(dynArr, '暂无朝代数据') + '</div></div>' +
          '<div class="character-card stat-panel fade-in"><div class="stat-panel-title">' +
            AB.toSimplified('人物身份标签（Top8）') + '</div><div class="stat-bars">' +
            bars(tagArr, '人物身份标签待接入') + '</div></div>' +
          '<div class="character-card stat-panel fade-in"><div class="stat-panel-title">' +
            AB.toSimplified('社会关系类型分布') + '</div><div class="stat-bars">' +
            bars(rtArr, '暂无关系数据') + '</div></div>' +
        '</div>' +
        '<h2 class="section-title">' + AB.toSimplified('数据洞察') + '</h2>' +
        '<div class="character-card fade-in" style="margin-bottom:16px;">' +
          '<div class="info-row">· ' + AB.toSimplified('资源密度：十大馆藏合计 ' + books.length + ' 部、' + totalChapters +
            ' 个章节卷次，构成完整古籍研读骨架') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('时间纵深：典籍跨越西周至清代，' +
            (dynArr[0] ? dynArr[0].name : '—') + '、' + (dynArr[1] ? dynArr[1].name : '—') +
            ' 著述较丰，折射不同时期的思想与文化繁荣') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('学术价值：' + chars.length +
            ' 位考据人物均由馆藏典籍作者自动派生，以人物为轴串联经典与著述') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('关系密度：' + rels.length +
            ' 条社会关系以「思想传承」为核心脉络，支撑双人溯源与谱系考据') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('检索基建：内置 ' + mappingCount +
            ' 条古籍常用字繁简映射，覆盖经文、史传、诗词高频古字') + '</div>' +
        '</div>' +
      '</section>';
    AB.bindFadeIn(main);
  }

  AB.renderStats = renderStats;
})(window.AB = window.AB || {});
