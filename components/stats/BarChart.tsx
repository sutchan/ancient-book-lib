// components/stats/BarChart.tsx v1.15.8

export const PALETTE = ["#8C3130", "#B8754E", "#C9A227", "#4E7A5A", "#5B7A9D", "#7A5B9D", "#9D5B6E", "#3E7A78", "#8A6D3B", "#5A6B8C"];

/** 横向条形图（统计页通用） */
export function BarChart({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="card stat-panel" id="stats-bar-chart">
      <div className="stat-panel-title">{title}</div>
      <div className="stat-bars">
        {rows.map((r, i) => (
          <div className="stat-bar-row" key={r.name}>
            <div className="stat-bar-label">{r.name}</div>
            <div className="stat-bar-track">
              <span
                className="stat-bar-fill"
                style={{
                  width: `${(r.count / max) * 100}%`,
                  background: PALETTE[i % PALETTE.length],
                }}
              />
            </div>
            <div className="stat-bar-value">{r.count.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
