interface Props {
  rows: any[];
  xColumn: string;
  yColumn: string;
  /** The aggregation already applied on the backend (sum | avg/mean | count | max | min).
   *  Needed so MetricCards doesn't blindly re-aggregate already-aggregated rows —
   *  e.g. summing 6 already-averaged department rows produces a meaningless number. */
  aggregation?: string;
}

const ACCENT_COLORS = ["#3b82f6", "#a855f7", "#10b981"];

// Clean up values for display:
// - ISO timestamps → date only (2025-10-11T00:00:00 → 2025-10-11)
// - Long strings   → truncate with ellipsis
const formatDisplayValue = (val: string): string => {
  if (!val) return val;
  if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return val.split("T")[0];
  if (val.length > 18) return val.slice(0, 16) + "\u2026";
  return val;
};

const isAlreadyAveraged = (aggregation?: string) =>
  aggregation === "avg" || aggregation === "average" || aggregation === "mean";

export default function MetricCards({ rows, xColumn, yColumn, aggregation }: Props) {
  if (!rows.length) return null;

  const values = rows.map((r: any) => Number(r[yColumn] || 0));
  const total  = values.reduce((sum: number, v: number) => sum + v, 0);
  const maxRow = rows.reduce((a: any, b: any) => Number(a[yColumn]) > Number(b[yColumn]) ? a : b);

  // If the backend already returned an averaged metric per row (e.g.
  // groupby(...).mean()), re-summing those rows and dividing again produces
  // a meaningless number. In that case, the "Total" card doesn't make sense
  // either — show the average across the already-averaged rows instead,
  // and label both cards accordingly so nothing implies raw totals.
  const alreadyAveraged = isAlreadyAveraged(aggregation);

  const primaryValue = alreadyAveraged
    ? Math.round((total / rows.length) * 100) / 100
    : total;

  const primaryLabel = alreadyAveraged
    ? `Avg ${yColumn} (across ${rows.length})`
    : `Total ${yColumn}`;

  const secondaryValue = alreadyAveraged
    ? Math.max(...values)
    : Math.round(total / rows.length);

  const secondaryLabel = alreadyAveraged
    ? `Max ${yColumn}`
    : `Avg ${yColumn}`;

  const stats = [
    { label: primaryLabel,        value: primaryValue.toLocaleString(),                    color: ACCENT_COLORS[0] },
    { label: `Top ${xColumn}`,    value: formatDisplayValue(String(maxRow[xColumn])),       color: ACCENT_COLORS[1] },
    { label: secondaryLabel,      value: secondaryValue.toLocaleString(),                   color: ACCENT_COLORS[2] },
  ];

  return (
    <>
      <style>{`
        .metric-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 479px) {
          .metric-grid {
            grid-template-columns: 1fr;
          }
          .metric-card {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 14px 16px !important;
          }
          .metric-card-left {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .metric-value {
            font-size: 22px !important;
            margin-bottom: 0 !important;
          }
          .metric-label {
            margin-bottom: 0 !important;
          }
          .metric-bar {
            display: none !important;
          }
          .metric-color-dot {
            display: flex !important;
          }
        }
        @media (min-width: 480px) and (max-width: 640px) {
          .metric-grid {
            gap: 8px;
          }
          .metric-value {
            font-size: 20px !important;
          }
          .metric-card {
            padding: 14px 14px 12px !important;
          }
        }
      `}</style>

      <div className="metric-grid" style={{ marginBottom: 4 }}>
        {stats.map((item, i) => (
          <div
            key={i}
            className="metric-card"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: "18px 18px 14px",
              transition: "border-color 0.15s, transform 0.15s",
              cursor: "default",
              flexDirection: "column",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-muted)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <div className="metric-card-left">
              <p
                className="metric-label"
                style={{
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "var(--text-muted)", margin: "0 0 8px",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </p>
              <p
                className="metric-value"
                style={{
                  fontSize: "clamp(18px, 3.5vw, 26px)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                  margin: "0 0 12px",
                  lineHeight: 1,
                  wordBreak: "break-all",
                }}
              >
                {item.value}
              </p>
            </div>

            <div
              className="metric-bar"
              style={{
                width: 36, height: 3, borderRadius: 2,
                background: item.color,
                boxShadow: `0 0 8px ${item.color}60`,
              }}
            />

            <div
              className="metric-color-dot"
              style={{
                display: "none",
                width: 10, height: 10, borderRadius: "50%",
                background: item.color,
                boxShadow: `0 0 6px ${item.color}80`,
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
}