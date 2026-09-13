// components/relation/PersonInput.tsx v1.15.8
"use client";

/** 人名联想输入框（输入 + 下拉联想），A/B 共用，从 RelationClient.tsx 拆出 */
import type { SelectedPerson } from "./types";

export function SuggestInput({
  value,
  suggestions,
  placeholder,
  ariaLabel,
  onInput,
  onPick,
}: {
  value: string;
  suggestions: SelectedPerson[];
  placeholder: string;
  ariaLabel: string;
  onInput: (v: string) => void;
  onPick: (p: SelectedPerson) => void;
}) {
  return (
    <>
      <input
        className="input-text"
        value={value}
        onChange={(e) => onInput(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%" }}
        aria-label={ariaLabel}
      />
      {suggestions.length > 0 && (
        <div className="rel-suggest">
          {suggestions.map((s) => (
            <button key={s.id} className="rel-suggest-item" onClick={() => onPick(s)}>
              {s.name} <span style={{ opacity: 0.6, fontSize: 12 }}>CBDB {s.id}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
