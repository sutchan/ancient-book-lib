/**
 * CBDB 人物索引构建的纯逻辑部分（自 scripts/build-cbdb-index.mjs 拆出）
 *
 * 只负责「清洗 / 分片 / 搜索索引 / meta 组装」等无 I/O 的纯函数，
 * 由 scripts/build-cbdb-index.mjs 负责 SQLite 读取与写盘编排，便于复用与单测。
 */

// 数据源信息（真实，来自 CBDB 官方发布）
export const SOURCE = {
  name: "CBDB 中国历代人物传记资料库",
  url: "https://cbdb.hsites.harvard.edu/",
  sqlite_repo: "https://github.com/cbdb-project/cbdb_sqlite",
  release_file: "cbdb_20260905.sqlite3",
  release_date: "2026-09-05",
  sha256: "437a253a8e49cb24d2d5209234781d03fcbcc04476aafc3cf9d68453cea7e980",
  license: "CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享）",
};

// 占位籍贯（无实际地理信息，视为缺失）
const PLACE_BLACKLIST = ["[信息缺乏]", "[未詳]", "[Unknown]", "[Missing Data]"];

/** 大姓氏单独成片的人数阈值，低于该值合并进 _others.json */
export const SURNAME_THRESHOLD = 50;

/**
 * 清洗 SQL 查询结果 → 紧凑数组。
 * 字段顺序: [id, 姓名, 拼音, 生年, 卒年, 指数年, 性别(1女), 朝代, 籍贯]
 */
export function extractPersons(rows) {
  return rows
    .map((r) => {
      const name = (r.name || "").trim();
      if (!name) return null;
      const place = PLACE_BLACKLIST.includes((r.place || "").trim())
        ? ""
        : (r.place || "").trim();
      return [
        r.id,
        name,
        r.pinyin || "",
        r.birth || 0,
        r.death || 0,
        r.indexYear || 0,
        r.female ? 1 : 0,
        r.dynasty || "",
        place,
      ];
    })
    .filter(Boolean);
}

/** 按「姓名首字」分片，返回姓氏→条目映射与姓氏清单（人数降序）。 */
export function shardBySurname(persons) {
  const bySurname = new Map();
  for (const p of persons) {
    const surname = p[1].charAt(0);
    if (!bySurname.has(surname)) bySurname.set(surname, []);
    bySurname.get(surname).push(p);
  }
  const surnameList = [...bySurname.entries()]
    .map(([surname, list]) => ({ surname, count: list.length }))
    .sort((a, b) => b.count - a.count);
  return { bySurname, surnameList };
}

/** 姓名搜索索引（按姓名排序，前端可二分 / 前缀匹配）。 */
export function buildSearchIndex(persons) {
  return persons
    .map((p) => [p[1], p[0]])
    .sort((a, b) => a[0].localeCompare(b[0], "zh"));
}

/** 朝代分布统计（人数降序）。 */
export function buildDynastyList(persons) {
  const dynastyCount = {};
  for (const p of persons) {
    const d = p[7] || "未詳";
    dynastyCount[d] = (dynastyCount[d] || 0) + 1;
  }
  return Object.entries(dynastyCount)
    .map(([dynasty, count]) => ({ dynasty, count }))
    .sort((a, b) => b.count - a.count);
}

/** 组装 meta.json（含全量姓氏列表，供前端定位分片）。 */
export function buildMeta({ persons, surnameMeta, surnameList, searchIndexSize }) {
  return {
    total: persons.length,
    female: persons.filter((p) => p[6] === 1).length,
    source: SOURCE,
    generatedAt: new Date().toISOString().slice(0, 10),
    dynasty: buildDynastyList(persons),
    // 必须收录**全部**姓氏条目：分片循环对所有 count ≥ SURNAME_THRESHOLD 的姓氏都写了独立文件，
    // 一旦在此截断，落在阈值之后、人数却 ≥ 阈值的姓氏就会「分片存在但 meta 查不到」，
    // 前端只能回退 _others.json，而这些人并不在那里 → 人物不可达（详情页报「未找到」）。
    // 曾用 slice(0, 200)，实测造成 281 个姓氏 / 39,850 位人物丢失（约占全库 6%）。
    surnames: surnameMeta,
    surnameTotal: surnameList.length,
    searchIndexSize,
    note: "人物数据字段: [id, 姓名, 拼音, 生年, 卒年, 指数年, 性别(1女), 朝代, 籍贯]",
  };
}
