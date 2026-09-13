/**
 * 原型阅读视图 · 正文与释义模块 v2.3
 * 职责：章节样张正文生成（生僻字自动标注）、生僻字释义弹层
 * 说明：全文检索复用 AB.getChapterText 以保证正文口径一致；由 view-read.js 消费。
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

  AB.getChapterText = getChapterText;
  AB.bindGlossary = bindGlossary;
})(window.AB = window.AB || {});
