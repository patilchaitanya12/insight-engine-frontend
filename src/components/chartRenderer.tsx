import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import type { ChartConfig, TableData } from "../types/query";

interface Props {
  table: TableData;
  chart: ChartConfig;
}

const COLORS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

const formatValue = (value: any) => {
  if (!value) return "";
  const v = value.toString();
  return v.includes("T") ? v.split("T")[0] : v;
};

const formatNumber = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-muted)",
      borderRadius: 8, padding: "10px 14px",
      fontSize: 12,
    }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, margin: "2px 0", fontWeight: 500 }}>
          {p.name}: <span style={{ color: "var(--text-primary)" }}>{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

export default function ChartRenderer({ table, chart }: Props) {
  const { chart_type, x_column, y_column, group_by } = chart;
  const rows = table.data ?? [];

  if (!rows.length) return null;

  const axisStyle = {
    fontSize: 11,
    fill: "var(--text-muted)",
    fontFamily: "DM Sans, sans-serif",
  };

  const gridStyle = {
    stroke: "var(--border-subtle)",
    strokeDasharray: "3 3",
  };

  const title = chart_type === "pie" ? "Distribution" : chart_type === "line" ? "Trend Analysis" : "Visual Distribution";

  return (
    <div style={{ padding: "24px 24px 16px" }}>
      <p style={{
        fontSize: 13, fontWeight: 600,
        color: "var(--text-secondary)",
        marginBottom: 20,
        letterSpacing: "-0.01em",
      }}>
        {title}
      </p>

      <ResponsiveContainer width="100%" height={340}>
        <>
          {/* ── Bar Chart ── */}
          {chart_type === "bar" && !group_by && (
            <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis
                dataKey={x_column}
                tickFormatter={formatValue}
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tickFormatter={formatNumber}
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
              <Bar dataKey={y_column} fill={COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={56} />
            </BarChart>
          )}

          {/* ── Grouped Bar ── */}
          {(chart_type === "bar" || chart_type === "grouped_bar") && group_by && (() => {
            const groups = [...new Set(rows.map((r) => r[group_by]))];
            const categories = [...new Set(rows.map((r) => formatValue(r[x_column])))];
            const data = categories.map((cat) => {
              const entry: any = { [x_column]: cat };
              groups.forEach((g) => {
                const row = rows.find((r) => formatValue(r[x_column]) === cat && r[group_by] === g);
                entry[String(g)] = row ? Number(row[y_column]) : 0;
              });
              return entry;
            });
            return (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid {...gridStyle} vertical={false} />
                <XAxis dataKey={x_column} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
                {groups.map((g, i) => (
                  <Bar key={String(g)} dataKey={String(g)} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={40} />
                ))}
              </BarChart>
            );
          })()}

          {/* ── Line / Area Chart ── */}
          {chart_type === "line" && (
            <AreaChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
              <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey={y_column} stroke={COLORS[0]} strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: COLORS[0] }} />
            </AreaChart>
          )}

          {/* ── Pie Chart ── */}
          {chart_type === "pie" && (
            <PieChart>
              <Pie
                data={rows.map((row) => ({
                  name: formatValue(row[x_column]),
                  value: Number(row[y_column]) || 0,
                }))}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={3}
                dataKey="value"
              >
                {rows.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          )}
        </>
      </ResponsiveContainer>
    </div>
  );
}