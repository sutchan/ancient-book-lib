// components/PersonTimeline.tsx —— 人物生命时间轴（SVG 自绘，零依赖）
// 数据来源：CBDB 生卒年（BIOG_MAIN.c_birthyear/c_deathyear）+ 科举年份（ENTRY_DATA）+ 任职年份（POSTED_TO_OFFICE_DATA）
import { formatYear } from "@/lib/cbdb";

export interface TimelineInput {
  name: string;
  birth?: number;
  death?: number;
  entries: { entry: string; year: number }[];
  offices: { office: string; firstYear?: number; lastYear?: number }[];
}

interface MergedEvent {
  type: "birth" | "entry" | "office" | "death";
  label: string;
}

const TYPE_ORDER: Record<MergedEvent["type"], number> = { birth: 0, entry: 1, office: 2, death: 3 };
const TYPE_COLOR: Record<MergedEvent["type"], string> = {
  birth: "#52A06B",
  entry: "#C9A227",
  office: "#3E6FA8",
  death: "#B05555",
};

function shortLabel(s: string, max = 8): string {
  const clean = s.replace(/^科舉[:：]\s*/, "").replace(/^科舉制舉[:：]\s*/, "");
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export default function PersonTimeline({ name, birth, death, entries, offices }: TimelineInput) {
  // 聚合同年事件
  const byYear = new Map<number, MergedEvent[]>();
  const add = (year: number, ev: MergedEvent) => {
    if (!year || year <= 0 || year >= 2200) return; // 过滤缺失与异常
    const list = byYear.get(year) || [];
    list.push(ev);
    byYear.set(year, list);
  };
  if (birth && birth > 0 && birth < 2200) add(birth, { type: "birth", label: "生" });
  if (death && death > 0 && death < 2200) add(death, { type: "death", label: "卒" });
  for (const e of entries) add(e.year, { type: "entry", label: shortLabel(e.entry) });
  for (const o of offices) {
    add(o.firstYear || 0, { type: "office", label: shortLabel(o.office) });
  }

  const years = Array.from(byYear.keys()).sort((a, b) => a - b);
  if (years.length === 0) return null;

  const yMin = years[0];
  const yMax = years[years.length - 1];
  const pad = Math.max(2, Math.round((yMax - yMin) * 0.06) || 1);
  const from = yMin - pad;
  const to = yMax + pad;

  // SVG 几何
  const W = 900;
  const H = 190;
  const AXIS_Y = 108;
  const X0 = 24;
  const X1 = W - 24;
  const x = (year: number) => X0 + ((year - from) / (to - from || 1)) * (X1 - X0);

  // 事件渲染：同侧标签防重叠——按年份交替上下
  const events = years
    .map((year) => {
      const list = byYear.get(year)!;
      list.sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
      const main = list[0];
      const label =
        list.length > 1
          ? `${main.label}、${list[1].label}${list.length > 2 ? ` 等${list.length}项` : ""}`
          : main.label;
      return { year, type: main.type, label };
    })
    .sort((a, b) => a.year - b.year);

  const labelLines = events.map((ev, i) => {
    const up = i % 2 === 0; // 上/下交替
    return {
      ...ev,
      x: x(ev.year),
      up,
      ty: up ? AXIS_Y - 26 : AXIS_Y + 26,
    };
  });

  // 刻度：最多 7 个
  const tickCount = Math.min(7, Math.max(2, Math.floor((to - from) / 25) + 1));
  const ticks: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    ticks.push(Math.round(from + ((to - from) * i) / (tickCount - 1)));
  }

  return (
    <div className="card" style={{ padding: 16, marginBottom: 20, overflowX: "auto" }}>
      <h4 style={{ margin: "0 0 4px" }}>生命时间轴</h4>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>
        {name} 生卒年与科举/任职关键节点（年份为 CBDB 原始数据；同年事件合并显示）
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", minWidth: 560, display: "block" }} role="img" aria-label={`${name}生命时间轴`}>
        {/* 时间轴主线 */}
        <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} stroke="#c9c9c9" strokeWidth={2} />
        {/* 刻度 */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} y1={AXIS_Y - 5} x2={x(t)} y2={AXIS_Y + 5} stroke="#b5b5b5" strokeWidth={1} />
            <text x={x(t)} y={AXIS_Y + 20} textAnchor="middle" fontSize={11} fill="#777">
              {formatYear(t)}
            </text>
          </g>
        ))}
        {/* 事件 */}
        {labelLines.map((ev, i) => (
          <g key={`${ev.year}-${i}`}>
            <line x1={ev.x} y1={AXIS_Y - (ev.up ? 4 : 0)} x2={ev.x} y2={AXIS_Y + (ev.up ? 0 : 4)} stroke={TYPE_COLOR[ev.type]} strokeWidth={1.4} />
            <circle cx={ev.x} cy={AXIS_Y} r={5} fill={TYPE_COLOR[ev.type]} stroke="#fff" strokeWidth={1.5} />
            <text
              x={ev.x}
              y={ev.ty}
              textAnchor="middle"
              fontSize={12}
              fontWeight={ev.type === "birth" || ev.type === "death" ? 600 : 400}
              fill="#333"
            >
              {ev.label}
            </text>
            <text x={ev.x} y={ev.up ? ev.ty + 13 : ev.ty - 9} textAnchor="middle" fontSize={10.5} fill="#888">
              {formatYear(ev.year)}
            </text>
          </g>
        ))}
        {/* 图例 */}
        <g transform={`translate(${X0}, ${H - 22})`}>
          {(
            [
              ["birth", "生年"],
              ["entry", "科举"],
              ["office", "任职"],
              ["death", "卒年"],
            ] as const
          ).map(([type, label], i) => (
            <g key={type} transform={`translate(${i * 130}, 0)`}>
              <circle cx={5} cy={-4} r={4.5} fill={TYPE_COLOR[type]} />
              <text x={14} y={0} fontSize={11} fill="#666">
                {label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
