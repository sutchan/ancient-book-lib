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

export interface SearchDemoResult {
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
    results: SearchDemoResult[];
  };
  glossary: Glossary[];
}
