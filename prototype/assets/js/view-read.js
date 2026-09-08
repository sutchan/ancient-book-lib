/**
 * 原型阅读视图 v2.2
 * 职责：章节正文渲染、生僻字释义弹层、字号/行距/章节/影像对照控制
 */
(function (AB) {
  "use strict";

  /* 仅这两部有贴合原书的样张，其余书目复用通用样本 —— 需显式提示，避免被误认为真实原文 */
  var REAL_SAMPLE_TITLES = ["论语", "心经"];
  AB.isSampleText = function (book) { return REAL_SAMPLE_TITLES.indexOf(book.title) < 0; };

  /* 章节文本（模拟真实内容 + 生僻字标注），全文检索复用同一函数保证口径一致 */
  function getChapterText(book, idx) {
    var sample = {
      "论语": ['子曰：「學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？」', '有子曰：「其為人也孝弟，而好犯上者，鮮矣；不好犯上，而好作亂者，未之有也。君子務本，本立而道生。孝弟也者，其為仁之本與！」', '子曰：「巧言令色，鮮矣仁！」', '曾子曰：「吾日三省吾身：為人謀而不忠乎？與朋友交而不信乎？傳不習乎？」', '子曰：「道千乘之國，敬事而信，節用而愛人，使民以時。」', '子曰：「弟子入則孝，出則弟，謹而信，汎愛眾，而親仁。行有餘力，則以學文。」'],
      "心经": ['觀自在菩薩，行深般若波羅蜜多時，照見五蘊皆空，度一切苦厄。', '舍利子，色不異空，空不異色，色即是空，空即是色，受想行識，亦復如是。', '舍利子，是諸法空相，不生不滅，不垢不淨，不增不減。', '是故空中無色，無受想行識，無眼耳鼻舌身意，無色聲香味觸法。', '無眼界，乃至無意識界，無無明，亦無無明盡，乃至無老死，亦無老死盡。', '無苦集滅道，無智亦無得。以無所得故，菩提薩埵，依般若波羅蜜多故，心無罣礙。']
    }[book.title] || [
      '古之學者必有師。師者，所以傳道、受業、解惑也。人非生而知之者，孰能無惑？惑而不從師，其為惑也，終不解矣。',
      '生乎吾前，其聞道也固先乎吾，吾從而師之；生乎吾後，其聞道也亦先乎吾，吾從而師之。',
      '吾師道也，夫庸知其年之先後生於吾乎？是故無貴無賤，無長無少，道之所存，師之所存也。'
    ];
    return sample.map(function (p) {
      var out = AB.esc(p);
      AB.DATA.glossary.forEach(function (g) {
        if (out.indexOf(g.char) > -1) {
          out = out.split(g.char).join('<span class="guji-char" tabindex="0" role="button" aria-label="' +
            AB.esc(g.char + ' 释义') + '" data-char="' + AB.esc(g.char) + '" title="' + AB.esc(g.meaning) + '">' + g.char + '</span>');
        }
      });
      return '<p>' + out + '</p>';
    }).join("");
  }

  /* 划词 / 生僻字释义弹层 */
  function bindGlossary(main) {
    AB.$$(".guji-char", main).forEach(function (el) {
      function open() {
        var g = AB.DATA.glossary.filter(function (x) { return x.char === el.getAttribute("data-char"); })[0];
        if (!g) return;
        var pop = AB.$("#glossary-pop");
        if (!pop) {
          pop = document.createElement("div");
          pop.id = "glossary-pop";
          pop.className = "glossary-pop";
          document.body.appendChild(pop);
        }
        pop.innerHTML = '<div class="gp-char">' + AB.esc(g.char) + '</div>' +
          '<div class="gp-pinyin">' + AB.toSimplified(g.pinyin) + '</div>' +
          '<div>' + AB.toSimplified(g.meaning) + '</div>' +
          '<div class="gp-usage">' + AB.toSimplified('例句：') + AB.esc(g.usage) + '</div>';
        var r = el.getBoundingClientRect();
        pop.style.display = "block";
        var left = r.left + window.scrollX;
        var top = r.bottom + window.scrollY + 8;
        if (left + 300 > window.innerWidth) left = Math.max(0, window.innerWidth - 310);
        pop.style.left = left + "px";
        pop.style.top = top + "px";
      }
      el.addEventListener("click", function (e) { e.stopPropagation(); open(); });
      el.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); open(); } });
    });
    document.addEventListener("click", function (e) {
      var pop = AB.$("#glossary-pop");
      if (pop && !e.target.closest(".guji-char") && !e.target.closest("#glossary-pop")) pop.style.display = "none";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var pop = AB.$("#glossary-pop");
      if (pop) pop.style.display = "none";
    });
  }

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
    var bodyStyle = 'style="--reader-fs:' + AB.state.fontSize + 'px;--reader-lh:' + AB.state.lineHeight + ';"';
    var text = getChapterText(book, idx);
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
    bindGlossary(main);
  }

  AB.getChapterText = getChapterText;
  AB.renderReader = renderReader;
})(window.AB = window.AB || {});
