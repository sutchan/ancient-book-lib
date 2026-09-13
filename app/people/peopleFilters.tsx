// app/people/peopleFilters.tsx v1.15.8
"use client";

/** 人物库筛选区：搜索框 / 朝代 / 性别 / 姓氏，从 PeopleInner.tsx 拆出 */
import type { CbdbMeta } from "@/lib/cbdb";

export function PeopleSearchBox({
  value,
  active,
  onChange,
  onClear,
}: {
  value: string;
  active: boolean;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap" }} id="people-search-box">
      <input
        className="input-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索人名，如：苏轼、李白、朱熹"
        style={{ maxWidth: 360 }}
      />
      {active && (
        <button className="btn btn-secondary" onClick={onClear}>
          清除
        </button>
      )}
    </div>
  );
}

export function DynastyFilter({
  dynasties,
  value,
  totalCount,
  active,
  onSelect,
}: {
  dynasties: { dynasty: string; count: number }[];
  value: string;
  totalCount: number;
  active: boolean;
  onSelect: (d: string) => void;
}) {
  return (
    <div style={{ marginBottom: 20 }} id="people-dynasty-filter">
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 8 }}>
        {active
          ? "搜索结果不支持朝代筛选（结果来自人名索引，不含朝代字段）；清除关键词后可按朝代浏览"
          : `按朝代筛选（前 12 个朝代 · 共 ${totalCount} 个）`}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, opacity: active ? 0.5 : 1 }}>
        <button
          className={`btn ${!value ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: 13, padding: "4px 10px" }}
          disabled={active}
          onClick={() => onSelect("")}
        >全部</button>
        {dynasties.map((d) => (
          <button
            key={d.dynasty}
            className={`btn ${value === d.dynasty ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 13, padding: "4px 10px" }}
            disabled={active}
            onClick={() => onSelect(d.dynasty)}
          >
            {d.dynasty}（{d.count.toLocaleString()}）
          </button>
        ))}
      </div>
    </div>
  );
}

export function GenderFilter({
  checked,
  onChange,
  femaleTotal,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  femaleTotal: number;
}) {
  return (
    <div style={{ marginBottom: 16 }} id="people-gender-filter">
      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        仅看女性人物
      </label>
      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginLeft: 12 }}>
        CBDB 共收录女性 {femaleTotal.toLocaleString()} 位
      </span>
    </div>
  );
}

export function SurnameFilter({
  meta,
  surname,
  onSurname,
  surnameKw,
  onSurnameKw,
  showAll,
  onToggleShowAll,
}: {
  meta: CbdbMeta;
  surname: string;
  onSurname: (s: string) => void;
  surnameKw: string;
  onSurnameKw: (v: string) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const filtered = surnameKw ? meta.surnames.filter((s) => s.surname.startsWith(surnameKw)).slice(0, 80) : showAll ? meta.surnames : meta.surnames.slice(0, 60);
  return (
    <div style={{ marginBottom: 20 }} id="people-surname-filter">
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 8 }}>
        按姓氏浏览{showAll ? `（全部 ${meta.surnameTotal} 个）` : `（前 60 个 · 共 ${meta.surnameTotal} 个）`}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          className="input-text"
          value={surnameKw}
          onChange={(e) => onSurnameKw(e.target.value)}
          placeholder="输入姓氏精确筛选，如：欧阳、司马、慕容"
          style={{ maxWidth: 260 }}
        />
        <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => onSurnameKw("")}>
          清除
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {filtered.map((s) => (
          <button
            key={s.surname}
            className={`btn ${surname === s.surname ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 13, padding: "4px 10px" }}
            onClick={() => onSurname(s.surname)}
          >
            {s.surname}（{s.count.toLocaleString()}）
          </button>
        ))}
        {surnameKw && meta.surnames.filter((s) => s.surname.startsWith(surnameKw)).length === 0 && (
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            姓氏库中无「{surnameKw}」开头的姓氏；小姓人物可通过上方搜索框按姓名查找
          </span>
        )}
      </div>
      {!surnameKw && (
        <button
          className="btn btn-secondary"
          style={{ fontSize: 13, marginTop: 8 }}
          onClick={onToggleShowAll}
        >
          {showAll ? "收起（回到前 60）" : `展开全部姓氏（${meta.surnameTotal} 个）`}
        </button>
      )}
    </div>
  );
}
