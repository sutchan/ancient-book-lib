/**
 * 原型核心模块 · 愉悦体验层（Delight）v2.3
 * 职责：卷首滚动进度条、页脚彩蛋（连点触发篆字飞舞 + 雅句 toast）
 * 由 core.js 之后的脚本加载，boot 阶段调用 AB.bindScrollProgress / AB.bindEasterEgg。
 */
(function (AB) {
  "use strict";

  /* 卷首进度：阅读视图时顶部朱砂细条随滚动生长；离开阅读视图自动隐藏。
     单例监听（scroll/resize，rAF 节流），视图切换后由 boot 调 AB.refreshScrollProgress() 主动刷新 */
  var spBar = null, spFill = null;
  function spUpdate() {
    var reading = !!AB.$(".reader-body");
    if (!reading) {
      if (spBar) spBar.style.display = "none";
      return;
    }
    if (!spBar) {
      spBar = document.createElement("div");
      spBar.className = "scroll-progress";
      spBar.setAttribute("aria-hidden", "true");
      spFill = document.createElement("span");
      spFill.className = "sp-fill";
      spBar.appendChild(spFill);
      document.body.appendChild(spBar);
    }
    spBar.style.display = "block";
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 40 ? Math.min(1, Math.max(0, (window.scrollY || doc.scrollTop) / max)) : 0;
    if (spFill) spFill.style.width = (p * 100).toFixed(2) + "%";
  }
  AB.refreshScrollProgress = spUpdate;
  AB.bindScrollProgress = function () {
    if (AB.__spBound) return;
    AB.__spBound = true;
    var raf = 0;
    window.addEventListener("scroll", function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; spUpdate(); });
    }, { passive: true });
    window.addEventListener("resize", spUpdate);
    spUpdate();
  };

  /* 页脚彩蛋：2 秒内连点页脚统计 5 次 → 篆字飞舞 + 雅句 toast。
     提示与动画均尊重 prefers-reduced-motion；toast 走 role=status 对读屏友好 */
  AB.bindEasterEgg = function () {
    if (AB.__eggBound) return;
    AB.__eggBound = true;
    var CHARS = ["卷", "册", "簡", "墨", "書", "紙", "硯"];
    var clicks = [];
    function toast(msg) {
      var prev = AB.$(".eg-toast");
      if (prev) prev.remove();
      var el = document.createElement("div");
      el.className = "eg-toast";
      el.setAttribute("role", "status");
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 2900);
    }
    function spawnChar() {
      var el = document.createElement("span");
      el.className = "eg-float";
      el.setAttribute("aria-hidden", "true");
      el.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
      el.style.left = (10 + Math.random() * 80) + "vw";
      el.style.fontSize = (16 + Math.random() * 14) + "px";
      el.style.setProperty("--eg-rot", (Math.random() * 60 - 30).toFixed(0) + "deg");
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 2500);
    }
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest || !t.closest(".footer-stats")) return;
      var now = Date.now();
      clicks = clicks.filter(function (c) { return now - c < 2000; });
      clicks.push(now);
      if (clicks.length < 5) {
        if (clicks.length === 3) toast("再点两下，有惊喜…");
        return;
      }
      clicks = [];
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) {
        for (var i = 0; i < 12; i++) {
          (function (n) { setTimeout(spawnChar, n * 90); })(i);
        }
      }
      toast("文脉绵延，与君共读");
    });
  };
})(window.AB = window.AB || {});
