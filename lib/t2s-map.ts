// lib/t2s-map.ts 1.15.8 —— 繁简映射表合并入口（由分段文件合并，单一导出 T2S_MAP）
import { T2S_MAP_A } from "./t2s-map-a";
import { T2S_MAP_B } from "./t2s-map-b";
import { T2S_MAP_C } from "./t2s-map-c";
import { T2S_MAP_D } from "./t2s-map-d";
import { T2S_MAP_E } from "./t2s-map-e";

export const T2S_MAP: Record<string, string> = {
  ...T2S_MAP_A,
  ...T2S_MAP_B,
  ...T2S_MAP_C,
  ...T2S_MAP_D,
  ...T2S_MAP_E,
};
