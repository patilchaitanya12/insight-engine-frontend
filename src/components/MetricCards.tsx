interface Props {
  rows: any[];
  xColumn: string;
  yColumn: string;
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

export default function MetricCards({ rows, xColumn, yColumn }: Props) {
  if (!rows.length) return null;

  const total  = rows.reduce((sum: number, r: any) => sum + Number(r[yColumn] || 0), 0);
  const maxRow = rows.reduce((a: any, b: any) => Number(a[yColumn]) > Number(b[yColumn]) ? a : b);
  const avg    = Math.round(total / rows.length);

  const stats = [
    { label: `Total ${yColumn}`,  value: total.toLocaleString(),    color: ACCENT_COLORS[0] },
    { label: `Top ${xColumn}`,    value: formatDisplayValue(String(maxRow[xColumn])),   color: ACCENT_COLORS[1] },
    { label: `Avg ${yColumn}`,    value: avg.toLocaleString(),      color: ACCENT_COLORS[2] },
  ];

  return (
    <>
      {/* Responsive grid:
          - Mobile (<480px)  → 1 column, cards are full width rows
          - Tablet (480–768) → 3 columns, compact
          - Desktop (>768)   → 3 columns, comfortable
          We use a CSS custom property trick via inline style + a <style> tag
          because this is a pure inline-style codebase with no Tailwind/CSS modules. */}
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
              flexDirection: "column", // overridden on mobile via CSS
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
            {/* Left side (label + value) */}
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

            {/* Colored bar (hidden on mobile, replaced by dot) */}
            <div
              className="metric-bar"
              style={{
                width: 36, height: 3, borderRadius: 2,
                background: item.color,
                boxShadow: `0 0 8px ${item.color}60`,
              }}
            />

            {/* Color dot — only visible on mobile via CSS */}
            <div
              className="metric-color-dot"
              style={{
                display: "none", // shown via CSS on mobile
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