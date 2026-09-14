// lib/i18n.ts v1.19.0
export type Lang = "zh" | "en" | "ja" | "ko";

export const DICT = {
  zh: {
    home: "首页",
    catalog: "全馆藏",
    search: "检索",
    people: "人物库",
    relation: "社会关系",
    bookmarks: "书架",
    help: "帮助",
    langName: "中文",
  },
  en: {
    home: "Home",
    catalog: "Catalog",
    search: "Search",
    people: "Biographies",
    relation: "Relations",
    bookmarks: "Bookmarks",
    help: "Help",
    langName: "English",
  },
  ja: {
    home: "ホーム",
    catalog: "蔵書一覧",
    search: "検索",
    people: "人物録",
    relation: "社会関係",
    bookmarks: "ブックマーク",
    help: "ヘルプ",
    langName: "日本語",
  },
  ko: {
    home: "홈",
    catalog: "소장 목록",
    search: "검색",
    people: "인물 사전",
    relation: "사회 관계",
    bookmarks: "책갈피",
    help: "도움말",
    langName: "한국어",
  },
};

export function t(lang: Lang, key: keyof typeof DICT.zh): string {
  return DICT[lang]?.[key] || DICT.zh[key] || key;
}
