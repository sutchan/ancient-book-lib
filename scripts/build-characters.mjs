/**
 * 从 CBDB（中國歷代人物傳記資料庫）导入人物考据数据。
 *
 * 数据源：CBDB REST API（https://cbdb.fas.harvard.edu/cbdbapi/person），
 *         授权 CC BY-NC-SA 4.0（非商用、署名、相同方式分享）。
 * 说明：CBDB 姓名检索（?name=）返回不稳定（候选排序非确定），故本脚本
 *       一律以「已校验的 CBDB 人物 ID」为种子，按 ?id= 精确拉取，并对
 *       返回 PersonId 二次核验，避免误导入他人。
 * 产出：public/index/characters.json（Character[]，供 /character 页面消费）
 *
 * 用法：node scripts/build-characters.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public/index/characters.json");
const API = "https://cbdb.fas.harvard.edu/cbdbapi/person";

/**
 * 种子：{ id: CBDB 人物 ID, name?: 展示名（覆盖 CBDB ChName，便于检索） }
 * name 留空则使用 CBDB 原始 ChName。扩展数据只需在此追加条目。
 */
const SEED = [
  { id: 148844, name: "司馬遷" },
  { id: 135114, name: "班固" },
  { id: 212634, name: "王維" },
  { id: 3915, name: "杜甫" },
  { id: 32227, name: "白居易" },
  { id: 3332, name: "韓愈" },
  { id: 3605, name: "柳宗元" },
  { id: 1384, name: "歐陽修" },
  { id: 1762, name: "王安石" },
  { id: 3767, name: "蘇軾" },
  { id: 19713, name: "李清照" },
  { id: 30359, name: "辛棄疾" },
  { id: 3640, name: "陸游" },
  { id: 3257, name: "朱熹" },
  { id: 30257, name: "曹操" },
  { id: 25403, name: "諸葛亮" },
  { id: 1488, name: "司馬光" },
  { id: 690980, name: "羅貫中" },
  { id: 511354, name: "施耐庵" },
  { id: 65615, name: "蒲松齡" },
  { id: 15887, name: "孔子" },
  { id: 339621, name: "老子" },
  { id: 134984, name: "孟子" },
  { id: 30374, name: "王陽明" },
  { id: 65905, name: "曹雪芹" },
  { id: 3835, name: "陶淵明" },
  { id: 17364, name: "管仲" },
  { id: 32540, name: "李白" },
];

const toArr = (x) => (!x ? [] : Array.isArray(x) ? x : [x]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPerson(id) {
  const r = await fetch(API + "?id=" + id + "&mode=json");
  if (!r.ok) throw new Error("HTTP " + r.status);
  const d = await r.json();
  return d?.Package?.PersonAuthority?.PersonInfo?.Person;
}

function mapPerson(p, seed) {
  const bi = p.BasicInfo || {};
  const aliases = toArr(p.PersonAliases?.Alias);
  const zi = aliases.filter((a) => a.AliasType === "字").map((a) => a.AliasName).join("、");
  const alias = aliases
    .filter((a) => /號|別號|室名/.test(a.AliasType || ""))
    .map((a) => a.AliasName)
    .join("、");

  const nativeArr = toArr(p.PersonAddresses?.Address).filter((a) =>
    /籍貫/.test(a.AddrType || "")
  );
  const native = nativeArr.length ? nativeArr[0].AddrName : "";

  const office = toArr(p.PersonPostings?.Posting)
    .map((o) => o.OfficeName)
    .filter(Boolean);

  const texts = toArr(p.PersonTexts?.Text);
  // 著述：仅取「作者/编者/注疏」类角色，排除「傳主/被贈詩」等被动关联
  const books = [
    ...new Set(
      texts
        .filter((t) => /撰|著|編|輯|注|箋|疏|述/.test(t.Role || ""))
        .map((t) => t.TextName)
        .filter(Boolean)
    ),
  ];

  const tags = [];
  if (bi.Dynasty) tags.push(bi.Dynasty);
  if (office.length) tags.push("官員");
  if (texts.length) tags.push("文人");

  const bio = [];
  if (bi.Dynasty) bio.push(bi.Dynasty + "代");
  if (native) bio.push(native + "人");
  if (zi) bio.push("字" + zi);
  if (alias) bio.push("號" + alias);
  if (office.length) bio.push("官至" + office.join("、"));

  return {
    id: "cbdb-" + bi.PersonId,
    name: seed.name || bi.ChName || "",
    zi,
    alias,
    dynasty: bi.Dynasty || "",
    native,
    birth: bi.YearBirth || "",
    death: bi.YearDeath || "",
    office: office.join("、"),
    tags,
    desc: bio.length ? bio.join("，") + "。" : "",
    books,
  };
}

async function main() {
  const out = [];
  let ok = 0;
  let skip = 0;
  for (const s of SEED) {
    try {
      const p = await fetchPerson(s.id);
      if (!p || !p.BasicInfo) {
        console.warn("跳过 " + (s.name || s.id) + "：无数据");
        skip++;
        continue;
      }
      // 二次核验：API 返回的人物 ID 必须等于请求 ID
      if (String(p.BasicInfo.PersonId) !== String(s.id)) {
        console.warn(
          "跳过 " + (s.name || s.id) + "：返回 PersonId=" + p.BasicInfo.PersonId + " 与种子不符"
        );
        skip++;
        continue;
      }
      out.push(mapPerson(p, s));
      ok++;
      console.log("OK   " + (s.name || p.BasicInfo.ChName) + " (CBDB " + s.id + ")");
    } catch (e) {
      console.warn("失败 " + (s.name || s.id) + "：" + e.message);
      skip++;
    }
    await sleep(120); // 礼貌性限速
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(
    "\n生成 " + OUT + "\n成功 " + ok + " 条，跳过 " + skip + " 条，合计 " + out.length + " 条"
  );
  console.log("数据来源：CBDB（中國歷代人物傳記資料庫），CC BY-NC-SA 4.0");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
