/* 临时脚本：把原型所有 HTML 的导航统一为与正式站点一致的 7 项（首页/全馆藏/检索/人物考据/社会关系/数据统计/帮助） */
const fs = require("fs");
const path = require("path");

const ITEMS = [
  ["首页", "home", "#page-home", "./index.html"],
  ["全馆藏", "book-list", "#page-book-list", "./book-list.html"],
  ["检索", "search", "#page-search", "./search.html"],
  ["人物考据", "character", "#page-character", "./character.html"],
  ["社会关系", "relation", "#page-relation", "./relation.html"],
  ["数据统计", "stats", "#page-stats", "./stats.html"],
  ["帮助", "help", "#page-help", "./help.html"],
];

function activeKeyOf(file) {
  const s = fs.readFileSync(file, "utf8");
  const m = s.match(/data-page="([^"]+)"/);
  const p = m ? m[1] : "home";
  if (p === "index" || p === "home") return "home";
  if (p === "category") return "book-list"; // 分类页现已归并到「全馆藏」
  return p; // book-list/search/character/relation/stats/help/read(空)
}

function buildNav(style, activeKey) {
  return ITEMS.map(function (it) {
    const href = style === "hash" ? it[2] : it[3];
    const active = it[1] === activeKey ? ' class="active"' : "";
    return '        <a href="' + href + '"' + active + ">" + it[0] + "</a>";
  }).join("\n");
}

function replaceNav(html, tag, style, activeKey) {
  const re = new RegExp("(<nav class=\"" + tag + "\"[^>]*>)[\\s\\S]*?(</nav>)", "g");
  const nav = buildNav(style, activeKey);
  return html.replace(re, "$1\n" + nav + "\n      $2");
}

const files = ["prototype/prototype.html"].concat(
  fs.readdirSync("prototype/pages").filter(function (f) { return f.endsWith(".html"); })
    .map(function (f) { return "prototype/pages/" + f; })
);

files.forEach(function (file) {
  let html = fs.readFileSync(file, "utf8");
  const style = file.endsWith("prototype.html") ? "hash" : "file";
  const active = activeKeyOf(file);
  const before = html;
  html = replaceNav(html, "nav-menu", style, active);
  html = replaceNav(html, "mobile-menu", style, active);
  if (html === before) { console.log("NO CHANGE (检查 nav 结构):", file); return; }
  fs.writeFileSync(file, html, "utf8");
  console.log("updated nav ->", file, "(active:", active + ")");
});
fs.unlinkSync("_tmp_nav.cjs");
console.log("DONE");
