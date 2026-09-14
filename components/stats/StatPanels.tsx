// components/stats/StatPanels.tsx v1.15.8
import Link from "next/link";
import { formatSize } from "@/lib/catalog";
import type { RelMeta, OfficesMeta } from "@/lib/cbdb";
import { DATA_SOURCE, DATA_SIZE_GB } from "@/lib/constants";

/** KPI 指标行 */
export function StatKpis({
  categoryCount,
  total,
  totalSizeBytes,
  cbdbTotal,
  relTotal,
}: {
  categoryCount: number;
  total: number;
  totalSizeBytes: number;
  cbdbTotal: number | null;
  relTotal: number | null;
}) {
  return (
    <div className="stat-kpis" id="stats-kpis">
      <div className="stat-kpi">
        <div className="kpi-num">{categoryCount}</div>
        <div className="kpi-label">馆藏分类</div>
      </div>
      <div className="stat-kpi">
        <div className="kpi-num">{total.toLocaleString()}</div>
        <div className="kpi-label">收录典籍</div>
      </div>
      <div className="stat-kpi">
        <div className="kpi-num">{formatSize(totalSizeBytes)}</div>
        <div className="kpi-label">原始数据量</div>
      </div>
      <div className="stat-kpi">
        <div className="kpi-num">{cbdbTotal !== null ? cbdbTotal.toLocaleString() : "…"}</div>
        <div className="kpi-label">人物库（CBDB）</div>
      </div>
      <div className="stat-kpi">
        <div className="kpi-num">{relTotal !== null ? relTotal.toLocaleString() : "…"}</div>
        <div className="kpi-label">关系条目</div>
      </div>
    </div>
  );
}

/** 全量数据概览面板 */
export function OverviewPanel({
  total,
  cbdbTotal,
  relTotal,
  relPersonTotal,
  officeTotal,
}: {
  total: number;
  cbdbTotal: number | null;
  relTotal: number | null;
  relPersonTotal: number | null;
  officeTotal: number | null;
}) {
  return (
    <div className="card stat-panel" style={{ marginTop: 20, padding: "16px 20px" }} id="stats-overview">
      <div className="stat-panel-title">全量数据概览（{DATA_SOURCE} + CBDB · 原始数据托管于上游）</div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 12 }}>
        <div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>{total.toLocaleString()}</span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>部古籍</span>
        </div>
        <div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>{DATA_SIZE_GB}</span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>GB 原始 TXT</span>
        </div>
        <div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>
            {cbdbTotal !== null ? cbdbTotal.toLocaleString() : "…"}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>位历代人物（CBDB）</span>
        </div>
        <div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>
            {relTotal !== null ? relTotal.toLocaleString() : "…"}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条关系（亲属+社会）</span>
        </div>
        <div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>
            {relPersonTotal !== null ? relPersonTotal.toLocaleString() : "…"}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>位涉及关系人物</span>
        </div>
        <div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>
            {officeTotal !== null ? officeTotal.toLocaleString() : "…"}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条任职记录（CBDB）</span>
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "var(--color-text-secondary)" }}>
        数据源：
        <a href="https://github.com/garychowcmu/daizhigev20" target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>
          {DATA_SOURCE} 开源古籍库
        </a>
        {" · "}
        <a href="https://cbdb.hsites.harvard.edu/" target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>
          CBDB 中国历代人物传记资料库
        </a>
        {" · 阅读时按需 fetch raw URL，不预加载全量数据"}
      </div>
    </div>
  );
}

/** 人物关系数据面板 */
export function RelPanel({ rel }: { rel: RelMeta }) {
  return (
    <div className="card stat-panel" style={{ marginTop: 16 }} id="stats-relations">
      <div className="stat-panel-title">人物关系数据（CBDB · 2026-09-05 版）</div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", padding: "12px 4px" }}>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
            {rel.stats.kinTotal.toLocaleString()}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条亲属关系</span>
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
            {rel.stats.assocTotal.toLocaleString()}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条社会关系</span>
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
            {rel.stats.textTotal.toLocaleString()}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条人物-著作关联</span>
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
            {rel.stats.kinCodeCount}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>种亲属称谓</span>
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
            {rel.stats.assocCodeCount}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>种社会关系类型</span>
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
        关系覆盖 {rel.stats.personTotal.toLocaleString()} 位人物，可在{" "}
        <Link href="/relation" style={{ color: "var(--color-primary)" }}>社会关系溯源</Link> 中按人物查看，
        支持直接关系与 2-3 级中间关系的双人溯源（每层探索宽度受限）。
      </div>
    </div>
  );
}

/** 人物任职数据面板 */
export function OfficesPanel({ offices }: { offices: OfficesMeta }) {
  return (
    <div className="card stat-panel" style={{ marginTop: 16 }} id="stats-offices">
      <div className="stat-panel-title">人物任职数据（CBDB · 2026-09-05 版）</div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", padding: "12px 4px" }}>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
            {offices.stats.officeTotal.toLocaleString()}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>条任职记录</span>
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
            {offices.stats.personTotal.toLocaleString()}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>位有任职记载的人物</span>
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
            {offices.stats.officeNameCount.toLocaleString()}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>种官职名</span>
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
            {offices.stats.apptCodeCount}
          </span>{" "}
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>种任命类型（正授/權/守/試/攝等）</span>
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
        任职记录（官职、起止年、任命类型）展示于{" "}
        <Link href="/people" style={{ color: "var(--color-primary)" }}>人物库</Link> 详情页「生平任职」区块。
      </div>
    </div>
  );
}
