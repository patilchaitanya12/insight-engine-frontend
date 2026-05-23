interface Props {
  rows: any[];
  xColumn: string;
  yColumn: string;
}

const ACCENT_COLORS = ["#3b82f6", "#a855f7", "#10b981"];

export default function MetricCards({ rows, xColumn, yColumn }: Props) {
  if (!rows.length) return null;

  const total = rows.reduce((sum: number, r: any) => sum + Number(r[yColumn] || 0), 0);
  const maxRow = rows.reduce((a: any, b: any) => Number(a[yColumn]) > Number(b[yColumn]) ? a : b);
  const avg = Math.round(total / rows.length);

  const stats = [
    { label: `Total ${yColumn}`, value: total.toLocaleString(), color: ACCENT_COLORS[0] },
    { label: `Top ${xColumn}`, value: String(maxRow[xColumn]), color: ACCENT_COLORS[1] },
    { label: `Avg ${yColumn}`, value: avg.toLocaleString(), color: ACCENT_COLORS[2] },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 4 }}>
      {stats.map((item, i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: "20px 20px 16px",
            transition: "border-color 0.15s, transform 0.15s",
            cursor: "default",
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
          <p style={{
            fontSize: 11, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--text-muted)", margin: "0 0 10px",
          }}>
            {item.label}
          </p>
          <p style={{
            fontSize: 28, fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em", margin: "0 0 14px",
            lineHeight: 1,
          }}>
            {item.value}
          </p>
          <div style={{
            width: 40, height: 3, borderRadius: 2,
            background: item.color,
            boxShadow: `0 0 8px ${item.color}60`,
          }} />
        </div>
      ))}
    </div>
  );
}