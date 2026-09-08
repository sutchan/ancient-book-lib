import type { Category } from "./types";

/**
 * 十大馆藏静态元数据（UI 标签，非演示书目数据）。
 * 真实书目数据全部来自 daizhige-catalog.json（上游 garychowcmu/daizhigev20）。
 */
export const CATEGORIES: Category[] = [
  { id: "fo", name: "佛藏", desc: "佛家经典 · 般若智慧", icon: "☸" },
  { id: "ru", name: "儒藏", desc: "儒家经典 · 修齐治平", icon: "儒" },
  { id: "yi", name: "医藏", desc: "医学方书 · 济世活人", icon: "医" },
  { id: "shi", name: "史藏", desc: "史书地理 · 鉴往知来", icon: "史" },
  { id: "zi", name: "子藏", desc: "诸子百家 · 思想争鸣", icon: "子" },
  { id: "yi2", name: "易藏", desc: "易学典籍 · 穷理尽性", icon: "易" },
  { id: "art", name: "艺藏", desc: "艺术典籍 · 琴棋书画", icon: "艺" },
  { id: "shi2", name: "诗藏", desc: "诗词总集 · 吟咏性情", icon: "诗" },
  { id: "dao", name: "道藏", desc: "道家典籍 · 清静无为", icon: "道" },
  { id: "ji", name: "集藏", desc: "文集总集 · 汇录百家", icon: "集" },
];
