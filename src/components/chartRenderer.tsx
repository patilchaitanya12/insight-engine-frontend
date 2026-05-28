import { useState, useCallback, useRef } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  ScatterChart, Scatter, ZAxis,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart,
  Brush, ReferenceArea,
} from "recharts";
import type { ChartConfig, TableData } from "../types/query";

interface Props {
  table: TableData;
  chart: ChartConfig;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const COLORS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#f43f5e", "#84cc16"];
const BRUSH_THRESHOLD = 20;

// ── Formatters ─────────────────────────────────────────────────────────────────
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

// ── Shared style tokens ────────────────────────────────────────────────────────
const axisStyle = { fontSize: 10, fill: "var(--text-muted)", fontFamily: "inherit" };
const gridStyle  = { stroke: "var(--border-subtle)", strokeDasharray: "3 3" };
const getMargin  = (hasBrush: boolean) => ({ top: 8, right: 8, left: 0, bottom: hasBrush ? 8 : 36 });

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
interface TPayload { color: string; name: string; value: number; }
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TPayload[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-elevated)", border: "1px solid var(--border-muted)",
      borderRadius: 8, padding: "8px 12px", fontSize: 11,
      maxWidth: 200, wordBreak: "break-word",
    }}>
      {label && (
        <p style={{ color: "var(--text-muted)", marginBottom: 4, fontWeight: 600, fontSize: 11 }}>
          {formatValue(label)}
        </p>
      )}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0", fontWeight: 500 }}>
          {p.name}: <span style={{ color: "var(--text-primary)" }}>{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

// ── Grouped data builder ───────────────────────────────────────────────────────
function buildGroupedData(
  rows: Record<string, unknown>[],
  x_column: string,
  y_column: string,
  group_by: string,
): Record<string, unknown>[] {
  const groups     = [...new Set(rows.map(r => r[group_by]))];
  const categories = [...new Set(rows.map(r => formatValue(r[x_column])))];
  return categories.map(cat => {
    const entry: Record<string, unknown> = { [x_column]: cat };
    groups.forEach(g => {
      const row = rows.find(r => formatValue(r[x_column]) === cat && r[group_by] === g);
      entry[String(g)] = row ? Number(row[y_column]) : 0;
    });
    return entry;
  });
}

// ── Chart titles ───────────────────────────────────────────────────────────────
const CHART_TITLES: Record<string, string> = {
  pie: "Distribution", line: "Trend Analysis", area: "Area Trend",
  scatter: "Correlation", stacked_bar: "Stacked Breakdown",
  multi_line: "Multi-Metric Trend", grouped_bar: "Visual Distribution", bar: "Visual Distribution",
};

// ── Reset button ───────────────────────────────────────────────────────────────
const ResetBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} style={{
    fontSize: 10, fontWeight: 600, color: "var(--accent-light)",
    background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
    borderRadius: 6, padding: "2px 8px", cursor: "pointer",
  }}>
    ↺ Reset
  </button>
);

// ── useZoom hook ───────────────────────────────────────────────────────────────
// Brush  → pan slider at the bottom (appears when data > BRUSH_THRESHOLD points)
// ReferenceArea → click/touch & drag on the chart to zoom into a region
// Y-axis auto-scales to the visible X range automatically (free from data slicing)
function useZoom(fullData: Record<string, unknown>[], xColumn: string) {
  const total      = fullData.length;
  const defaultEnd = Math.min(total - 1, BRUSH_THRESHOLD - 1);
  const hasBrush   = total > BRUSH_THRESHOLD;

  const [brushStart, setBrushStart] = useState(0);
  const [brushEnd,   setBrushEnd]   = useState(defaultEnd);
  const [zoomedData, setZoomedData] = useState<Record<string, unknown>[] | null>(null);
  const [refLeft,    setRefLeft]    = useState<string | null>(null);
  const [refRight,   setRefRight]   = useState<string | null>(null);

  const selecting       = useRef(false);
  const touchStartLabel = useRef<string | null>(null);

  // The data slice currently visible in the chart
  const visibleData = zoomedData
    ?? (hasBrush ? fullData.slice(brushStart, brushEnd + 1) : fullData);

  const getBase = useCallback(
    () => zoomedData ?? (hasBrush ? fullData.slice(brushStart, brushEnd + 1) : fullData),
    [zoomedData, hasBrush, fullData, brushStart, brushEnd],
  );

  const handleBrushChange = useCallback(
    ({ startIndex, endIndex }: { startIndex?: number; endIndex?: number }) => {
      if (startIndex !== undefined) setBrushStart(startIndex);
      if (endIndex   !== undefined) setBrushEnd(endIndex);
      setZoomedData(null); // clear drag-zoom when brush moves
    },
    [],
  );

  // Commit zoom: slice data between two x-axis labels
  const commitZoom = useCallback((left: string | null, right: string | null) => {
    selecting.current = false;
    if (!left || !right || left === right) {
      setRefLeft(null); setRefRight(null); return;
    }
    const base = getBase();
    const il = base.findIndex(r => formatValue(r[xColumn]) === left);
    const ir = base.findIndex(r => formatValue(r[xColumn]) === right);
    if (il === -1 || ir === -1) { setRefLeft(null); setRefRight(null); return; }
    const [lo, hi] = il < ir ? [il, ir] : [ir, il];
    if (hi - lo > 0) setZoomedData(base.slice(lo, hi + 1));
    setRefLeft(null); setRefRight(null);
  }, [getBase, xColumn]);

  // Mouse handlers (desktop)
  const onMouseDown = useCallback((e: any) => {
    if (!e?.activeLabel) return;
    selecting.current = true;
    setRefLeft(e.activeLabel); setRefRight(null);
  }, []);

  const onMouseMove = useCallback((e: any) => {
    if (!selecting.current || !e?.activeLabel) return;
    setRefRight(e.activeLabel);
  }, []);

  const onMouseUp = useCallback((e: any) => {
    if (!selecting.current) return;
    commitZoom(refLeft, e?.activeLabel ?? refRight);
  }, [commitZoom, refLeft, refRight]);

  // Touch handlers (mobile) — Recharts passes the same synthetic event shape
  const onTouchStart = useCallback((e: any) => {
    const label = e?.activeLabel ?? null;
    touchStartLabel.current = label;
    if (!label) return;
    selecting.current = true;
    setRefLeft(label); setRefRight(null);
  }, []);

  const onTouchMove = useCallback((e: any) => {
    if (!selecting.current || !e?.activeLabel) return;
    setRefRight(e.activeLabel);
  }, []);

  const onTouchEnd = useCallback((_e: any) => {
    commitZoom(touchStartLabel.current, refRight);
    touchStartLabel.current = null;
  }, [commitZoom, refRight]);

  const resetZoom = useCallback(() => {
    setZoomedData(null);
    setBrushStart(0);
    setBrushEnd(defaultEnd);
  }, [defaultEnd]);

  return {
    visibleData, hasBrush, brushStart, brushEnd, handleBrushChange,
    onMouseDown, onMouseMove, onMouseUp,
    onTouchStart, onTouchMove, onTouchEnd,
    refLeft, refRight,
    isZoomed: zoomedData !== null,
    resetZoom,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ChartRenderer({ table, chart }: Props) {
  const { chart_type, x_column, y_column, group_by } = chart;
  const fullRows = (table.data ?? []) as Record<string, unknown>[];
  if (!fullRows.length) return null;

  const isPie   = chart_type === "pie";
  const isScatter = chart_type === "scatter";
  const canZoom = !isPie && !isScatter;

  const zoom = useZoom(fullRows, x_column);
  const {
    visibleData, hasBrush, brushStart, brushEnd, handleBrushChange,
    onMouseDown, onMouseMove, onMouseUp,
    onTouchStart, onTouchMove, onTouchEnd,
    refLeft, refRight, isZoomed, resetZoom,
  } = zoom;

  const m = getMargin(hasBrush);

  // Event props spread onto each chart that supports drag-zoom
  const dragProps = canZoom
    ? { onMouseDown, onMouseMove, onMouseUp, onTouchStart, onTouchMove, onTouchEnd }
    : {};

  // Blue highlight shown while user is dragging to select a zoom region
  const refArea = (refLeft && refRight) ? (
    <ReferenceArea
      x1={refLeft} x2={refRight}
      fill="var(--accent)" fillOpacity={0.12} strokeOpacity={0.3}
    />
  ) : null;

  // Bottom pan slider
  const brushEl = hasBrush ? (
    <Brush
      dataKey={x_column}
      height={26}
      stroke="var(--border-muted)"
      fill="var(--bg-elevated)"
      travellerWidth={7}
      startIndex={brushStart}
      endIndex={brushEnd}
      onChange={handleBrushChange}
      tickFormatter={formatValue}
    />
  ) : null;

  // ── Individual chart renders ───────────────────────────────────────────────
  const renderChart = () => {

    // Simple Bar
    if (chart_type === "bar" && !group_by) {
      return (
        <BarChart data={visibleData} margin={m} {...dragProps}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
          <Bar dataKey={y_column} fill={COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={52} />
          {refArea}{brushEl}
        </BarChart>
      );
    }

    // Grouped Bar
    if ((chart_type === "bar" || chart_type === "grouped_bar") && group_by) {
      const groups = [...new Set(fullRows.map(r => r[group_by]))];
      const data   = buildGroupedData(visibleData, x_column, y_column, group_by);
      return (
        <BarChart data={data} margin={m} {...dragProps}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tick={axisStyle} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
          <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} />
          {groups.map((g, i) => (
            <Bar key={String(g)} dataKey={String(g)} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={36} />
          ))}
          {refArea}{brushEl}
        </BarChart>
      );
    }

    // Stacked Bar
    if (chart_type === "stacked_bar") {
      const grpBy = group_by || (fullRows.length
        ? Object.keys(fullRows[0]).find(k => k !== x_column && k !== y_column)
        : undefined);
      if (!grpBy) return null;
      const groups = [...new Set(fullRows.map(r => r[grpBy]))];
      const data   = buildGroupedData(visibleData, x_column, y_column, grpBy);
      return (
        <BarChart data={data} margin={m} {...dragProps}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tick={axisStyle} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
          <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} />
          {groups.map((g, i) => (
            <Bar key={String(g)} dataKey={String(g)} fill={COLORS[i % COLORS.length]} stackId="stack"
              radius={i === groups.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
          {refArea}{brushEl}
        </BarChart>
      );
    }

    // Line (rendered as AreaChart with subtle gradient fill)
    if (chart_type === "line") {
      return (
        <AreaChart data={visibleData} margin={m} {...dragProps}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS[0]} stopOpacity={0.15} />
              <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={y_column} stroke={COLORS[0]} strokeWidth={2} fill="url(#lineGrad)" dot={false} activeDot={{ r: 4, fill: COLORS[0] }} />
          {refArea}{brushEl}
        </AreaChart>
      );
    }

    // Area
    if (chart_type === "area") {
      return (
        <AreaChart data={visibleData} margin={m} {...dragProps}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS[2]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={y_column} stroke={COLORS[2]} strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: COLORS[2] }} />
          {refArea}{brushEl}
        </AreaChart>
      );
    }

    // Multi Line
    if (chart_type === "multi_line" && group_by) {
      const groups = [...new Set(fullRows.map(r => r[group_by]))];
      const data   = buildGroupedData(visibleData, x_column, y_column, group_by);
      return (
        <LineChart data={data} margin={m} {...dragProps}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} />
          {groups.map((g, i) => (
            <Line key={String(g)} type="monotone" dataKey={String(g)}
              stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          ))}
          {refArea}{brushEl}
        </LineChart>
      );
    }

    // Scatter — no zoom (axes are numeric ranges, not categorical labels)
    if (chart_type === "scatter") {
      const scatterData = fullRows.map(row => ({
        x: Number(row[x_column]) || 0,
        y: Number(row[y_column]) || 0,
      }));
      return (
        <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 36 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis type="number" dataKey="x" name={x_column} tickFormatter={formatNumber}
            tick={axisStyle} axisLine={false} tickLine={false}
            label={{ value: x_column, position: "insideBottom", offset: -10, fill: "var(--text-muted)", fontSize: 10 }} />
          <YAxis type="number" dataKey="y" name={y_column} tickFormatter={formatNumber}
            tick={axisStyle} axisLine={false} tickLine={false} width={44} />
          <ZAxis range={[32, 32]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-muted)", borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
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

    // Pie — no zoom
    if (chart_type === "pie") {
      const pieData = fullRows.map(row => ({
        name:  formatValue(row[x_column]),
        value: Number(row[y_column]) || 0,
      }));
      return (
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius="35%" outerRadius="60%" paddingAngle={3} dataKey="value">
            {fullRows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} iconType="circle" iconSize={7} />
        </PieChart>
      );
    }

    return null;
  };

  const chartEl = renderChart();
  if (!chartEl) return null;

  const chartHeight = hasBrush ? 380 : 300;

  return (
    <div style={{ padding: "16px 12px 10px" }}>

      {/* Title + zoom hint + reset */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "-0.01em", margin: 0 }}>
          {CHART_TITLES[chart_type] ?? "Visual Distribution"}
        </p>

        {canZoom && (
          <span style={{
            fontSize: 9, color: "var(--text-muted)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 4, padding: "2px 6px", lineHeight: 1.6,
          }}>
            {hasBrush ? "drag handles to pan · drag chart to zoom" : "drag to zoom"}
          </span>
        )}

        {isZoomed && <ResetBtn onClick={resetZoom} />}
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        {chartEl}
      </ResponsiveContainer>

      {isZoomed && (
        <p style={{ fontSize: 9, color: "var(--text-muted)", textAlign: "center", marginTop: 6 }}>
          Showing zoomed view · tap ↺ Reset to restore full data
        </p>
      )}
    </div>
  );
}