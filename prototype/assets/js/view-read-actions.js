/**
 * 原型阅读视图 · 收藏与阅读位置书签模块 v2.3
 * 职责：书籍收藏切换、当前位置保存、阅读书签面板渲染 / 跳转 / 删除
 * 键名对齐正式站 components/RemoteReader.tsx（v1.15.8）：
 *   收藏存 localStorage「ab-bookmarks」，阅读位置书签存「ab-pos-<id>」
 * 由 view-read.js 在渲染完成后调用 AB.bindReaderActions 绑定。
 */
(function (AB) {
  "use strict";

  function readList(key) {
    try { return JSON.parse(AB.lsGet(key, "[]")) || []; } catch (e) { return []; }
  }

  /* 供渲染层读取收藏 / 位置数量，决定按钮初始文案与计数 */
  AB.readerBookmarkState = function (book) {
    return {
      bookmarked: readList("ab-bookmarks").some(function (x) { return x.id === book.id; }),
      posCount: readList("ab-pos-" + book.id).length
    };
  };

  /**
   * 绑定收藏与阅读位置书签交互。
   * @param {Object} o
   * @param {HTMLElement} o.main 阅读视图容器
   * @param {Object} o.book 当前书籍
   * @param {number} o.chapterIdx 当前章索引
   * @param {string} o.chapterTitle 当前章标题
   * @param {Function} o.rerender 跳转后重渲染阅读视图
   */
  AB.bindReaderActions = function (o) {
    var main = o.main, book = o.book, idx = o.chapterIdx, chapterTitle = o.chapterTitle, rerender = o.rerender;
    var bmKey = "ab-bookmarks", posKey = "ab-pos-" + book.id;
    function getBm() { return readList(bmKey); }
    function getPos() { return readList(posKey); }

    function syncPosToggle() {
      var pt = AB.$("#reader-pos-toggle", main);
      if (pt) pt.textContent = AB.toSimplified('阅读书签') + (getPos().length ? ' (' + getPos().length + ')' : '');
    }

    /* 阅读位置书签面板渲染 */
    function renderPosPanel() {
      var panel = AB.$("#read-pos-panel", main);
      if (!panel) return;
      var pos = getPos();
      if (!pos.length) {
        panel.innerHTML = '<div class="card" style="padding:12px;font-size:13px;color:var(--color-text-secondary);">' +
          AB.toSimplified('暂无保存的阅读位置，点击「保存当前位置」记录本章。') + '</div>';
        return;
      }
      panel.innerHTML = '<div class="card" style="padding:12px;margin-top:4px;">' +
        '<strong>' + AB.toSimplified('阅读位置书签') + '</strong>' +
        pos.map(function (p, k) {
          return '<div style="display:flex;gap:8px;align-items:center;margin-top:8px;font-size:14px;">' +
            '<button class="btn btn-primary" style="font-size:12px;padding:4px 10px;" data-go="' + k + '">' + AB.toSimplified('跳转') + '</button>' +
            '<span style="flex:1;">' + AB.esc(p.label || '') + '</span>' +
            '<button class="btn btn-secondary" style="font-size:12px;padding:2px 8px;" data-del="' + k + '">' + AB.toSimplified('删除') + '</button>' +
            '</div>';
        }).join("") + '</div>';
      AB.$$("[data-go]", panel).forEach(function (b) {
        b.addEventListener("click", function () {
          var p = getPos()[parseInt(b.getAttribute("data-go"), 10)];
          if (!p) return;
          AB.state.chapterIdx = p.chapterIdx || 0;
          AB.lsSet("ab-chapter", AB.state.chapterIdx);
          rerender();
        });
      });
      AB.$$("[data-del]", panel).forEach(function (b) {
        b.addEventListener("click", function () {
          var arr = getPos();
          arr.splice(parseInt(b.getAttribute("data-del"), 10), 1);
          AB.lsSet(posKey, JSON.stringify(arr));
          renderPosPanel();
          syncPosToggle();
        });
      });
    }

    /* 收藏切换（对齐 Navbar「书签」第 7 项 / RemoteReader #reader-bookmark-toggle） */
    var bmBtn = AB.$("#reader-bm-toggle", main);
    if (bmBtn) bmBtn.addEventListener("click", function () {
      var list = getBm();
      var hit = -1;
      for (var bi = 0; bi < list.length; bi++) { if (list[bi].id === book.id) { hit = bi; break; } }
      if (hit >= 0) list.splice(hit, 1);
      else list.push({ id: book.id, title: book.title, category: book.category });
      AB.lsSet(bmKey, JSON.stringify(list));
      var on = list.some(function (x) { return x.id === book.id; });
      bmBtn.setAttribute("aria-pressed", String(on));
      bmBtn.textContent = on ? '★ ' + AB.toSimplified('已收藏') : '☆ ' + AB.toSimplified('收藏');
    });

    /* 保存当前阅读位置 */
    var savePosBtn = AB.$("#reader-save-pos", main);
    if (savePosBtn) savePosBtn.addEventListener("click", function () {
      var pos = getPos();
      var label = chapterTitle ? (chapterTitle + ' · 第 1 页') : ('第 ' + (idx + 1) + ' 章');
      pos.push({ chapterIdx: idx, pageIdx: 0, label: label, createdAt: Date.now() });
      AB.lsSet(posKey, JSON.stringify(pos));
      renderPosPanel();
      syncPosToggle();
    });

    /* 阅读书签面板开关 */
    var posToggle = AB.$("#reader-pos-toggle", main);
    if (posToggle) posToggle.addEventListener("click", function () {
      var panel = AB.$("#read-pos-panel", main);
      if (!panel) return;
      var show = panel.style.display === "none";
      panel.style.display = show ? "block" : "none";
      if (show) renderPosPanel();
    });
  };
})(window.AB = window.AB || {});
