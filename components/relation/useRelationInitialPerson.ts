// components/relation/useRelationInitialPerson.ts 1.15.8 —— 关系页初始人物加载（从 RelationClient 拆出）
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { findPersonById, searchPersons } from "@/lib/cbdb";

interface SuggestApi {
  setSelected: (p: { id: number; name: string } | null) => void;
  setInput: (v: string) => void;
}

/**
 * 初始人物：优先 ?id=（CBDB 权威 ID，人物详情页即由它跳转而来）。
 * 只有当 URL 没有 id 时，才回退到 ?name= 的模糊匹配——且回退时必须显式提示，
 * 避免对同名者的关系网络静默溯源。
 */
export function useRelationInitialPerson(
  suggest: SuggestApi,
  setPathMsg: (msg: string) => void
) {
  const sp = useSearchParams();
  useEffect(() => {
    const initId = Number(sp.get("id") || 0);
    if (initId) {
      findPersonById(initId)
        .then((p) => {
          if (!p) {
            setPathMsg(`未找到 CBDB ID ${initId} 对应的人物`);
            return;
          }
          suggest.setSelected({ id: p[0], name: p[1] });
          suggest.setInput(p[1]);
        })
        .catch((e) => setPathMsg(`人物加载失败：${String((e as Error)?.message || e)}`));
      return;
    }
    const init = sp.get("name");
    if (!init) return;
    searchPersons(init, 5)
      .then((r) => {
        if (!r.length) {
          setPathMsg(`未找到与「${init}」匹配的人物`);
          return;
        }
        suggest.setSelected({ id: r[0].id, name: r[0].name });
        suggest.setInput(r[0].name);
        if (r.length > 1) {
          setPathMsg(
            `按姓名「${init}」匹配到 ${r[0].name}（CBDB ID ${r[0].id}），共 ${r.length} 个同名/近似结果；若其人非本人，请改用上方输入框选择。`
          );
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
