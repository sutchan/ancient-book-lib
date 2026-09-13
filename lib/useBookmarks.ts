// lib/useBookmarks.ts v1.14.3
"use client";
import { useEffect, useState } from "react";
import { subscribe, getBookmarks, type Bookmark } from "./bookmarks";

/** 书签状态 hook：监听本标签页 pub/sub 与其他标签页 storage 事件，保持实时同步 */
export function useBookmarks(): Bookmark[] {
  const [list, setList] = useState<Bookmark[]>([]);
  useEffect(() => {
    const sync = () => setList(getBookmarks());
    sync();
    const unsub = subscribe(sync);
    window.addEventListener("storage", sync);
    return () => {
      unsub();
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}
