/* 临时冒烟测试：最小 DOM 桩加载原型模块，验证渲染函数与新增交互不抛异常 */
const fs = require("fs");
const vm = require("vm");

function makeEl() {
  const el = {
    innerHTML: "", textContent: "", value: "", parentNode: null, firstChild: null,
    style: { setProperty: function () {}, display: "", left: "", top: "" },
    classList: { add: function () {}, remove: function () {}, toggle: function () { return false; }, contains: function () { return false; } },
    setAttribute: function () {}, getAttribute: function () { return null; }, removeAttribute: function () {},
    addEventListener: function () {}, appendChild: function () {}, insertBefore: function () { return el; },
    querySelector: function () { return makeEl(); }, querySelectorAll: function () { return []; },
    getBoundingClientRect: function () { return { left: 0, top: 0, bottom: 0, width: 0, height: 0 }; }
  };
  return el;
}
const mainEl = makeEl();
mainEl.id = "main-view";
const bodyEl = makeEl();
const document = {
  readyState: "complete", body: bodyEl,
  createElement: function () { return makeEl(); },
  addEventListener: function () {},
  querySelector: function (sel) { return sel === "#main-view" ? mainEl : makeEl(); },
  querySelectorAll: function () { return []; }
};
const store = {};
const sandbox = {
  console: console, document: document,
  localStorage: {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); }
  },
  location: { hash: "" },
  IntersectionObserver: function () { this.observe = function () {}; this.unobserve = function () {}; },
  setTimeout: setTimeout
};
sandbox.window = sandbox;
sandbox.window.addEventListener = function () {};
sandbox.window.scrollTo = function () {};
sandbox.window.scrollX = 0;
sandbox.window.scrollY = 0;
sandbox.window.innerWidth = 1200;
vm.createContext(sandbox);

["prototype/data/app-data.js"].concat(
  ["t2s-map", "core", "view-home", "view-read", "view-search", "view-character", "view-relation", "view-help", "view-stats", "boot"]
    .map(function (n) { return "prototype/assets/js/" + n + ".js"; })
).forEach(function (f) { vm.runInContext(fs.readFileSync(f, "utf8"), sandbox, { filename: f }); });

const AB = sandbox.window.AB;
AB.renderPrototypeNotice();
console.log("prototype notice ok");
["renderHome", "renderCategory", "renderBookList", "renderSearch", "renderCharacter", "renderRelation", "renderHelp", "renderStats"].forEach(function (fn) {
  AB[fn](mainEl);
  if (!mainEl.innerHTML.length) throw new Error(fn + " 输出为空");
  if (mainEl.innerHTML.indexOf("undefined") > -1) throw new Error(fn + " 输出包含 undefined");
  console.log(fn, "ok", mainEl.innerHTML.length);
});
AB.renderReader(mainEl, "ru-lunyu");
console.log("renderReader(论语) 含样张提示:", mainEl.innerHTML.indexOf("sample-tip") > -1 ? "否（正确，真实样张）" : "？");
const other = AB.DATA.books.filter(function (b) { return ["论语", "心经"].indexOf(b.title) < 0; })[0];
AB.renderReader(mainEl, other.id);
console.log("renderReader(" + other.title + ") 含样张提示:", mainEl.innerHTML.indexOf("sample-tip") > -1 ? "是（正确）" : "否（缺失）");
AB.lsSet("ab-chapter", 3);
console.log("lsSet/lsGet roundtrip:", AB.lsGet("ab-chapter", "0"));
console.log("SMOKE OK");
