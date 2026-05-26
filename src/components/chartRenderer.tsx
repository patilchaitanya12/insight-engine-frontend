import {
  BarChart, Bar,
  LineChart, Line,
  ScatterChart, Scatter, ZAxis,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart,
} from "recharts";
import type { ChartConfig, TableData } from "../types/query";

interface Props {
  table: TableData;
  chart: ChartConfig;
}

const COLORS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#f43f5e", "#84cc16"];

const formatValue = (value: unknown): string => {
  if (!value) return "";
  const v = value.toString();
  return v.includes("T") ? v.split("T")[0] : v;
};

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-muted)",
      borderRadius: 8, padding: "10px 14px",
      fontSize: 12,
    }}>
      {label && <p style={{ color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0", fontWeight: 500 }}>
          {p.name}: <span style={{ color: "var(--text-primary)" }}>{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

const axisStyle = {
  fontSize: 11,
  fill: "var(--text-muted)",
  fontFamily: "DM Sans, sans-serif",
};

const gridStyle = {
  stroke: "var(--border-subtle)",
  strokeDasharray: "3 3",
};

const MARGIN = { top: 10, right: 10, left: 0, bottom: 40 };

function buildGroupedData(
  rows: Record<string, unknown>[],
  x_column: string,
  y_column: string,
  group_by: string,
): Record<string, unknown>[] {
  const groups = [...new Set(rows.map((r) => r[group_by]))];
  const categories = [...new Set(rows.map((r) => formatValue(r[x_column])))];
  return categories.map((cat) => {
    const entry: Record<string, unknown> = { [x_column]: cat };
    groups.forEach((g) => {
      const row = rows.find(
        (r) => formatValue(r[x_column]) === cat && r[group_by] === g,
      );
      entry[String(g)] = row ? Number(row[y_column]) : 0;
    });
    return entry;
  });
}

const CHART_TITLES: Record<string, string> = {
  pie:         "Distribution",
  line:        "Trend Analysis",
  area:        "Area Trend",
  scatter:     "Correlation Analysis",
  stacked_bar: "Stacked Breakdown",
  multi_line:  "Multi-Metric Trend",
  grouped_bar: "Visual Distribution",
  bar:         "Visual Distribution",
};

export default function ChartRenderer({ table, chart }: Props) {
  const { chart_type, x_column, y_column, group_by } = chart;
  const rows = (table.data ?? []) as Record<string, unknown>[];

  if (!rows.length) return null;

  const title = CHART_TITLES[chart_type] ?? "Visual Distribution";

  const renderChart = () => {

    // ── Simple Bar ────────────────────────────────────────────────────────────
    if (chart_type === "bar" && !group_by) {
      return (
        <BarChart data={rows} margin={MARGIN}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
          <Bar dataKey={y_column} fill={COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={56} />
        </BarChart>
      );
    }

    // ── Grouped Bar ───────────────────────────────────────────────────────────
    if ((chart_type === "bar" || chart_type === "grouped_bar") && group_by) {
      const groups = [...new Set(rows.map((r) => r[group_by]))];
      const data = buildGroupedData(rows, x_column, y_column, group_by);
      return (
        <BarChart data={data} margin={MARGIN}>
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
    }

    // ── Stacked Bar ───────────────────────────────────────────────────────────
    if (chart_type === "stacked_bar") {
      const grpBy = group_by || (rows.length ? Object.keys(rows[0]).find(k => k !== x_column && k !== y_column) : undefined);
      if (!grpBy) return null;
      const groups = [...new Set(rows.map((r) => r[grpBy]))];
      const data = buildGroupedData(rows, x_column, y_column, grpBy);
      return (
        <BarChart data={data} margin={MARGIN}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
          {groups.map((g, i) => (
            <Bar key={String(g)} dataKey={String(g)} fill={COLORS[i % COLORS.length]} stackId="stack"
              radius={i === groups.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      );
    }

    // ── Line Chart (with area fill) ───────────────────────────────────────────
    if (chart_type === "line") {
      return (
        <AreaChart data={rows} margin={MARGIN}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.15} />
              <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={y_column} stroke={COLORS[0]} strokeWidth={2} fill="url(#lineGrad)" dot={false} activeDot={{ r: 4, fill: COLORS[0] }} />
        </AreaChart>
      );
    }

    // ── Area Chart (explicit, teal accent) ────────────────────────────────────
    if (chart_type === "area") {
      return (
        <AreaChart data={rows} margin={MARGIN}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[2]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={y_column} stroke={COLORS[2]} strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: COLORS[2] }} />
        </AreaChart>
      );
    }

    // ── Multi Line ────────────────────────────────────────────────────────────
    if (chart_type === "multi_line" && group_by) {
      const groups = [...new Set(rows.map((r) => r[group_by]))];
      const data = buildGroupedData(rows, x_column, y_column, group_by);
      return (
        <LineChart data={data} margin={MARGIN}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
          {groups.map((g, i) => (
            <Line key={String(g)} type="monotone" dataKey={String(g)} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          ))}
        </LineChart>
      );
    }

    // ── Scatter Chart ─────────────────────────────────────────────────────────
    if (chart_type === "scatter") {
      const scatterData = rows.map((row) => ({
        x: Number(row[x_column]) || 0,
        y: Number(row[y_column]) || 0,
      }));
      return (
        <ScatterChart margin={MARGIN}>
          <CartesianGrid {...gridStyle} />
          <XAxis type="number" dataKey="x" name={x_column} tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false}
            label={{ value: x_column, position: "insideBottom", offset: -10, fill: "var(--text-muted)", fontSize: 11 }} />
          <YAxis type="number" dataKey="y" name={y_column} tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <ZAxis range={[40, 40]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-muted)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
                  <p style={{ color: "var(--text-muted)", margin: "2px 0" }}>{x_column}: <span style={{ color: "var(--text-primary)" }}>{formatNumber(d.x)}</span></p>
                  <p style={{ color: "var(--text-muted)", margin: "2px 0" }}>{y_column}: <span style={{ color: "var(--text-primary)" }}>{formatNumber(d.y)}</span></p>
                </div>
              );
            }}
          />
          <Scatter data={scatterData} fill={COLORS[0]} opacity={0.75} />
        </ScatterChart>
      );
    }

    // ── Pie Chart ─────────────────────────────────────────────────────────────
    if (chart_type === "pie") {
      const pieData = rows.map((row) => ({
        name: formatValue(row[x_column]),
        value: Number(row[y_column]) || 0,
      }));
      return (
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={3} dataKey="value">
            {rows.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} iconType="circle" iconSize={8} />
        </PieChart>
      );
    }

    return null;
  };

  const chartElement = renderChart();
  if (!chartElement) return null;

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
        {chartElement}
      </ResponsiveContainer>
    </div>
  );
}