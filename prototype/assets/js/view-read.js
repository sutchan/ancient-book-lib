/**
 * 原型阅读视图 v2.3 —— 渲染编排层
 * 职责：阅读视图整体渲染（章节正文 / 影像对照 / 工具栏 / 章节导航）与字号、行距、章节、影像开关绑定
 * 拆出模块：view-read-content.js（样张正文 + 释义弹层）、view-read-actions.js（收藏与阅读位置书签）
 * 键名对齐正式站 components/RemoteReader.tsx（v1.15.8）：收藏 ab-bookmarks，位置 ab-pos-<id>
 */
(function (AB) {
  "use strict";

  function renderReader(main, bookId) {
    var book = AB.DATA.books.filter(function (b) { return b.id === bookId; })[0] || AB.DATA.books[0];
    if (!book) {
      main.innerHTML = '<section><div class="empty-state"><div class="empty-icon">📖</div>' +
        '<div class="empty-title">' + AB.toSimplified('暂无可阅读典籍') + '</div></div></section>';
      return;
    }
    var chapters = book.chapters || [];
    var idx = Math.min(Math.max(AB.state.chapterIdx, 0), Math.max(chapters.length - 1, 0));
    var chapterTitle = chapters[idx] || "正文";
    var showImage = AB.state.showImage === true;
    var bmState = AB.readerBookmarkState(book);
    var bodyStyle = 'style="--reader-fs:' + AB.state.fontSize + 'px;--reader-lh:' + AB.state.lineHeight + ';"';
    var text = AB.getChapterText(book, idx);
    var bodyHtml = '<div class="reader-body" id="reader-body" ' + bodyStyle + '>' + text + '</div>';
    var imagePanel = showImage
      ? '<div class="image-compare fade-in">' +
          '<div class="ic-left">' +
            '<div class="ic-title">' + AB.toSimplified('原书影像') + '</div>' +
            '<div class="ic-img" style="background:linear-gradient(135deg,#f5f0e6 0%,#efe6d4 60%,#e8dcc4 100%);border:1px solid #d8c9a8;">' +
              '<div style="font-size:12px;color:#8a7350;padding:28px 16px;text-align:center;line-height:1.9;">' +
                AB.toSimplified('刻本影像示意图') + '<br>' + AB.toSimplified('（上线版接入 GitHub 原文影像深链）') +
              '</div>' +
            '</div>' +
            '<div class="ic-meta">' + AB.toSimplified('底本：') + AB.esc(book.dynasty) + ' ' +
              AB.toSimplified('刻本 · ') + AB.esc(book.title) + '</div>' +
          '</div>' +
          '<div class="ic-right">' +
            '<div class="ic-title">' + AB.toSimplified('整理文本') + '</div>' + bodyHtml +
          '</div>' +
        '</div>'
      : bodyHtml;

    main.innerHTML =
      '<section>' +
        '<div class="breadcrumb"><a href="#page-home">' + AB.toSimplified('首页') + '</a><span class="sep">/</span>' +
          '<a href="#page-book-list">' + AB.toSimplified(book.category) + '</a><span class="sep">/</span>' +
          '<a href="#page-book-list">' + AB.toSimplified(book.title) + '</a><span class="sep">/</span>' +
          '<span>' + AB.toSimplified(chapterTitle) + '</span></div>' +
        (AB.isSampleText(book)
          ? '<div class="sample-tip" role="note">本章为原型演示样张，非正式原文；正式站点按需加载上游全本。</div>'
          : '') +
        '<div class="reader-wrap">' +
          '<div class="reader-title">' + AB.toSimplified(book.title) + ' · ' + AB.toSimplified(chapterTitle) + '</div>' +
          '<div class="reader-sub">' + AB.toSimplified(book.dynasty + ' · ' + book.author) + '</div>' +
          '<div class="reader-toolbar">' +
            '<div class="ctrl">' + AB.toSimplified('字号') +
              '<button id="fs-minus" aria-label="缩小字号">A-</button><button id="fs-plus" aria-label="放大字号">A+</button></div>' +
            '<div class="ctrl">' + AB.toSimplified('行距') +
              '<button id="lh-minus" aria-label="行距变疏">疏</button><button id="lh-plus" aria-label="行距变密">密</button></div>' +
            '<div class="ctrl">' + AB.toSimplified('章节') +
              '<button id="ch-prev" aria-label="上一章">‹</button><button id="ch-next" aria-label="下一章">›</button></div>' +
            '<div class="ctrl">' + AB.toSimplified('进度') + ' <span id="progress-text">' + (idx + 1) + '/' + chapters.length + '</span></div>' +
            '<div class="ctrl"><button class="btn-toggle ' + (showImage ? "on" : "") + '" id="img-toggle" aria-pressed="' + showImage + '">' +
              AB.toSimplified('影像对照') + '</button></div>' +
          '</div>' +
          '<div class="reader-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0;">' +
            '<button class="btn btn-secondary" id="reader-bm-toggle" aria-pressed="' + bmState.bookmarked + '">' +
              (bmState.bookmarked ? '★ ' + AB.toSimplified('已收藏') : '☆ ' + AB.toSimplified('收藏')) + '</button>' +
            '<button class="btn btn-secondary" id="reader-save-pos">' + AB.toSimplified('保存当前位置') + '</button>' +
            '<button class="btn btn-secondary" id="reader-pos-toggle">' + AB.toSimplified('阅读书签') +
              (bmState.posCount ? ' (' + bmState.posCount + ')' : '') + '</button>' +
          '</div>' +
          '<div id="read-pos-panel" style="display:none;"></div>' +
          imagePanel +
          '<div class="reader-nav">' +
            '<button class="btn btn-secondary" id="nav-prev">‹ ' + AB.toSimplified('上一章') + '</button>' +
            '<button class="btn btn-primary" id="nav-next">' + AB.toSimplified('下一章') + ' ›</button>' +
          '</div>' +
          '<div class="reader-progress">' + AB.toSimplified('阅读进度已自动保存，下次打开将继续') + '</div>' +
        '</div>' +
      '</section>';

    function applyFs() {
      var b = AB.$("#reader-body", main);
      if (b) b.style.setProperty("--reader-fs", AB.state.fontSize + "px");
    }
    function applyLh() {
      var b = AB.$("#reader-body", main);
      if (b) b.style.setProperty("--reader-lh", String(AB.state.lineHeight));
    }
    function stepChapter(delta) {
      var len = chapters.length;
      AB.state.chapterIdx = Math.min(Math.max(len - 1, 0), Math.max(0, AB.state.chapterIdx + delta));
      AB.lsSet("ab-chapter", AB.state.chapterIdx);
      renderReader(AB.getMain(), AB.state.currentBookId);
    }
    var fsMinus = AB.$("#fs-minus", main), fsPlus = AB.$("#fs-plus", main);
    if (fsMinus) fsMinus.addEventListener("click", function () {
      AB.state.fontSize = Math.min(22, Math.max(14, AB.state.fontSize - 2)); applyFs(); AB.save();
    });
    if (fsPlus) fsPlus.addEventListener("click", function () {
      AB.state.fontSize = Math.min(22, Math.max(14, AB.state.fontSize + 2)); applyFs(); AB.save();
    });
    var lhMinus = AB.$("#lh-minus", main), lhPlus = AB.$("#lh-plus", main);
    if (lhMinus) lhMinus.addEventListener("click", function () {
      AB.state.lineHeight = Math.min(2.2, Math.max(1.5, +(AB.state.lineHeight - 0.2).toFixed(1))); applyLh(); AB.save();
    });
    if (lhPlus) lhPlus.addEventListener("click", function () {
      AB.state.lineHeight = Math.min(2.2, Math.max(1.5, +(AB.state.lineHeight + 0.2).toFixed(1))); applyLh(); AB.save();
    });
    ["#ch-prev", "#nav-prev"].forEach(function (sel) {
      var el = AB.$(sel, main);
      if (el) el.addEventListener("click", function () { stepChapter(-1); });
    });
    ["#ch-next", "#nav-next"].forEach(function (sel) {
      var el = AB.$(sel, main);
      if (el) el.addEventListener("click", function () { stepChapter(1); });
    });
    var imgBtn = AB.$("#img-toggle", main);
    if (imgBtn) imgBtn.addEventListener("click", function () {
      AB.state.showImage = !AB.state.showImage;
      renderReader(AB.getMain(), AB.state.currentBookId);
    });

    /* 收藏与阅读位置书签交互（见 view-read-actions.js） */
    AB.bindReaderActions({
      main: main, book: book, chapterIdx: idx, chapterTitle: chapterTitle,
      rerender: function () { renderReader(AB.getMain(), AB.state.currentBookId); }
    });

    AB.bindGlossary(main);
  }

  AB.renderReader = renderReader;
})(window.AB = window.AB || {});
