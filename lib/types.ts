/**
 * 古籍通 AncientBook 数据类型定义
 */

export interface Category {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export interface Book {
  id: string;
  title: string;
  category: string;
  dynasty: string;
  author: string;
  desc: string;
  chapters: string[];
}

export interface Character {
  id: string;
  name: string;
  zi: string;
  alias: string;
  dynasty: string;
  native: string;
  birth: string;
  death: string;
  office: string;
  tags: string[];
  desc: string;
  books: string[];
}

export interface Relation {
  a: string;
  b: string;
  type: string;
  source: string;
  detail: string;
  dynasty: string;
}

export interface Glossary {
  char: string;
  pinyin: string;
  meaning: string;
  usage: string;
}

/** 殆知阁 v20 全量书目索引条目（远程 raw 引用，不复制 TXT） */
export interface CatalogEntry {
  id: string;
  title: string;
  category: string;       // 一级馆藏：佛藏/儒藏/...
  subcategories: string[]; // 中间层级（如 ["乾隆藏","大乘五大部外重译经"]）
  path: string;           // 上游仓库相对路径
  size: number;           // 字节数
  rawUrl: string;         // raw.githubusercontent.com 主直链
  mirrors: string[];      // CDN 镜像列表（jsDelivr 等），用于降级
}

export interface DaizhigeCatalog {
  source: string;
  branch: string;
  generatedAt: string;
  total: number;
  totalSizeBytes: number;
  stats: Record<string, number>;
  books: CatalogEntry[];
}

export interface SearchTitleResult {
  book: string;
  chapter: string;
  path: string;
  snippet: string;
  score: number;
}

export interface AppData {
  version: string;
  categories: Category[];
  books: Book[];
  characters: Character[];
  relations: Relation[];
  searchDemo: {
    keyword: string;
    results: SearchTitleResult[];
  };
  glossary: Glossary[];
}
