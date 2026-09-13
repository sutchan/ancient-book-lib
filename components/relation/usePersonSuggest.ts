// components/relation/usePersonSuggest.ts v1.15.8
"use client";

/** 人名搜索联想（防抖 250ms），A/B 两个输入框共用，消重复 effect */
import { useEffect, useState } from "react";
import { searchPersons } from "@/lib/cbdb";
import type { SelectedPerson } from "./types";

export function usePersonSuggest(initial = "") {
  const [input, setInput] = useState(initial);
  const [suggestions, setSuggestions] = useState<SelectedPerson[]>([]);
  const [selected, setSelected] = useState<SelectedPerson | null>(null);

  useEffect(() => {
    const q = input.trim();
    if (!q || selected?.name === q) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      searchPersons(q, 8)
        .then((r) => setSuggestions(r))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [input, selected]);

  // 从联想中选中某人
  const pick = (p: SelectedPerson) => {
    setSelected(p);
    setInput(p.name);
    setSuggestions([]);
  };

  return { input, setInput, suggestions, selected, setSelected, pick };
}
