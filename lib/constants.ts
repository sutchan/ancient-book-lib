// 站点与数据源常量（单一来源，发版时同步更新）
// 版本号由 package.json 注入（见 components/Footer.tsx），此处不重复定义。

export const BRAND = "古籍通";
export const BRAND_FULL = "古籍通 AncientBook";

// 馆藏规模
export const BOOK_COUNT = 15694; // 殆知阁 v20 全量古籍部数
export const PERSON_COUNT = 661350; // CBDB 全量人物数
export const DATA_SOURCE = "殆知阁 v20"; // 书目原文数据源
export const DATA_SIZE_GB = "4.9"; // 原始数据体量（GB）

// 关系数据（CBDB）
export const REL_KIN_COUNT = "56.1 万"; // 亲属关系条数
export const REL_SOC_COUNT = "19 万"; // 社会关系条数

// 千分位展示（保持现有「15,694 / 661,350」格式）
export const BOOK_COUNT_LABEL = BOOK_COUNT.toLocaleString("en-US");
export const PERSON_COUNT_LABEL = PERSON_COUNT.toLocaleString("en-US");

// 统一搜索框占位文案（首页 / 全馆藏 / 检索页三处共用）
export const SEARCH_PLACEHOLDER = "搜索书名或关键词，如：论语、史记、孔子";

// 统一「无结果」空状态文案（全馆藏筛选无结果 / 检索无结果共用）
export const EMPTY_RESULT_TITLE = "未找到相关古籍";
export const EMPTY_RESULT_HINT = "换个关键词，或减少筛选条件再试试";
