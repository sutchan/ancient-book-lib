// components/RelationGraph.tsx —— 人物关系网络图（确定性放射状布局，SVG 自绘，零依赖）
// 中心 = 当前人物；第一环 = 亲属（青）+ 社会关系（橙）节点；点击节点跳转详情
import Link from "next/link";

export interface GraphNode {
  id: number;
  name: string;
  rel: string;
  kind: "kin" | "assoc";
}

const MAX_NODES = 12; // 单侧各取前 N，避免节点重叠
const COLORS = { kin: "#3E8FA8", assoc: "#C97B3E" };
const KIN_LABEL = "亲属";
const ASSOC_LABEL = "社会关系";

export default function RelationGraph({ personName, kin, assoc }: { personName: string; kin: GraphNode[]; assoc: GraphNode[] }) {
  const nodes: GraphNode[] = [...kin.slice(0, MAX_NODES), ...assoc.slice(0, MAX_NODES)];
  if (nodes.length === 0) return null;
  const totalHidden = kin.length + assoc.length - nodes.length;

  const W = 440;
  const H = 440;
  const CX = W / 2;
  const CY = H / 2;
  const R = 168; // 节点环半径
  const n = nodes.length;
  const startAngle = -Math.PI / 2; // 从顶部开始
  const pos = nodes.map((node, i) => {
    const angle = startAngle + (i / Math.max(1, n)) * Math.PI * 2;
    return { node, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
  });

  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }}>
      <h4 style={{ margin: "0 0 4px" }}>关系网络（以 {personName} 为中心）</h4>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>
        亲属 {kin.length} 位 · 社会关系 {assoc.length} 位
        {totalHidden > 0 ? ` · 图中展示前 ${nodes.length} 位` : ""}；点击节点查看该人物
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, height: "auto", display: "block", margin: "0 auto" }} role="img" aria-label={`${personName}关系网络图`}>
        {/* 连线 */}
        {pos.map(({ node, x, y }) => (
          <line key={`l-${node.id}`} x1={CX} y1={CY} x2={x} y2={y} stroke={COLORS[node.kind]} strokeWidth={1.2} opacity={0.45} />
        ))}
        {/* 中心节点 */}
        <circle cx={CX} cy={CY} r={26} fill="#3E3E46" />
        <text x={CX} y={CY + 3} textAnchor="middle" fontSize={13} fontWeight={600} fill="#fff">
          {personName.length > 5 ? `${personName.slice(0, 5)}…` : personName}
        </text>
        {/* 外围节点（Link 包裹，点击跳转） */}
        {pos.map(({ node, x, y }) => (
          <g key={`n-${node.id}`}>
            <a href={`/people/detail?id=${node.id}`} aria-label={`${node.name}（${node.rel}）`}>
              <circle cx={x} cy={y} r={15} fill={COLORS[node.kind]} opacity={0.92} stroke="#fff" strokeWidth={1.5} />
              <text x={x} y={y + 3} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={500}>
                {node.name.length > 4 ? `${node.name.slice(0, 4)}…` : node.name}
              </text>
              <title>{`${node.name} · ${node.rel}`}</title>
            </a>
          </g>
        ))}
        {/* 图例 */}
        <g transform={`translate(${W - 118}, 18)`}>
          <rect x={0} y={0} width={108} height={52} rx={8} fill="rgba(255,255,255,0.92)" stroke="#e4e4e4" />
          <circle cx={16} cy={18} r={6} fill={COLORS.kin} />
          <text x={28} y={22} fontSize={12} fill="#444">{KIN_LABEL}</text>
          <circle cx={16} cy={38} r={6} fill={COLORS.assoc} />
          <text x={28} y={42} fontSize={12} fill="#444">{ASSOC_LABEL}</text>
        </g>
      </svg>
    </div>
  );
}
