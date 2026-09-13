// app/people/usePeopleUrlSync.ts 1.15.8 —— 人物库 URL 与状态双向同步（从 PeopleInner 拆出）
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface UrlSyncArgs {
  surname: string;
  setSurname: (v: string) => void;
  dynasty: string;
  setDynasty: (v: string) => void;
  femaleOnly: boolean;
  setFemaleOnly: (v: boolean) => void;
  kw: string;
  setKw: (v: string) => void;
  inputKw: string;
  setInputKw: (v: string) => void;
  page: number;
  setPage: (v: number) => void;
}

/**
 * 浏览器前进/后退（URL → state）与筛选状态（state → URL）互相同步，
 * 保证分享链接可复现、且不形成更新循环。
 */
export function usePeopleUrlSync({
  surname, setSurname, dynasty, setDynasty, femaleOnly, setFemaleOnly,
  kw, setKw, inputKw, setInputKw, page, setPage,
}: UrlSyncArgs) {
  const params = useSearchParams();
  const router = useRouter();

  // 浏览器前进/后退时：URL → state 同步（与下面的 state → URL 互相幂等，不会循环）
  useEffect(() => {
    const s = params.get("surname") || "";
    const d = params.get("dynasty") || "";
    const f = params.get("female") === "1";
    const q = params.get("q") || "";
    const p = Math.max(1, Math.floor(Number(params.get("page")) || 1));
    if (s !== surname) setSurname(s);
    if (d !== dynasty) setDynasty(d);
    if (f !== femaleOnly) setFemaleOnly(f);
    if (q !== kw) {
      setInputKw(q);
      setKw(q);
    }
    if (p !== page) setPage(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // 浏览/搜索状态同步到 URL（支持分享链接与浏览器前进后退）
  useEffect(() => {
    const qs = new URLSearchParams();
    if (surname) qs.set("surname", surname);
    if (dynasty) qs.set("dynasty", dynasty);
    if (femaleOnly) qs.set("female", "1");
    if (kw) qs.set("q", kw);
    if (page > 1) qs.set("page", String(page));
    const s = qs.toString();
    router.replace(s ? `/people?${s}` : "/people", { scroll: false });
  }, [surname, dynasty, femaleOnly, kw, page, router]);
}
