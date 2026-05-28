import { useState, useCallback } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  ScatterChart, Scatter, ZAxis,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart,
  Brush,
} from "recharts";
import type { ChartConfig, TableData } from "../types/query";

interface Props {
  table: TableData;
  chart: ChartConfig;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const COLORS = [
  "#3b82f6", "#a855f7", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#f43f5e", "#84cc16",
];

// Show Brush only when data has more points than this
const BRUSH_THRESHOLD = 20;

// How many points visible at minimum zoom-in level
const MIN_WINDOW = 5;

// ── Formatters ─────────────────────────────────────────────────────────────────
const formatValue = (value: unknown): string => {
  if (!value) return "";
  const v = value.toString();
  return v.includes("T") ? v.split("T")[0] : v;
};

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

// ── Shared style tokens ────────────────────────────────────────────────────────
const axisStyle = { fontSize: 10, fill: "var(--text-muted)", fontFamily: "inherit" };
const gridStyle  = { stroke: "var(--border-subtle)", strokeDasharray: "3 3" };
const getMargin  = (hasBrush: boolean) => ({
  top: 8, right: 8, left: 0, bottom: hasBrush ? 8 : 36,
});

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
interface TPayload { color: string; name: string; value: number; }
const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean; payload?: TPayload[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;

  // Deduplicate by name — the glow Area layer registers the same dataKey
  // as a second series causing it to appear twice in the tooltip.
  const seen = new Set<string>();
  const unique = payload.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  return (
    <div style={{
      background: "var(--bg-elevated)", border: "1px solid var(--border-muted)",
      borderRadius: 8, padding: "8px 12px", fontSize: 11,
      maxWidth: 200, wordBreak: "break-word",
    }}>
      {label && (
        <p style={{ color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>
          {formatValue(label)}
        </p>
      )}
      {unique.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0", fontWeight: 500 }}>
          {p.name}:{" "}
          <span style={{ color: "var(--text-primary)" }}>
            {Number(p.value).toLocaleString()}
          </span>
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
      const row = rows.find(
        r => formatValue(r[x_column]) === cat && r[group_by] === g,
      );
      entry[String(g)] = row ? Number(row[y_column]) : 0;
    });
    return entry;
  });
}

// ── Chart titles ───────────────────────────────────────────────────────────────
const CHART_TITLES: Record<string, string> = {
  pie:         "Distribution",
  line:        "Trend Analysis",
  area:        "Area Trend",
  scatter:     "Correlation",
  stacked_bar: "Stacked Breakdown",
  multi_line:  "Multi-Metric Trend",
  grouped_bar: "Visual Distribution",
  bar:         "Visual Distribution",
};

// ── Zoom controls UI ──────────────────────────────────────────────────────────
const ZoomControls = ({
  onZoomIn, onZoomOut, onReset, canZoomIn, canZoomOut, isZoomed,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  isZoomed: boolean;
}) => {
  const btnBase: React.CSSProperties = {
    width: 26, height: 26,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, lineHeight: 1,
    border: "1px solid var(--border-subtle)",
    borderRadius: 6,
    background: "var(--bg-elevated)",
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "border-color 0.15s, color 0.15s",
    userSelect: "none" as const,
  };

  const disabledStyle: React.CSSProperties = {
    opacity: 0.35,
    cursor: "not-allowed",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {/* Zoom in */}
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Zoom in"
        style={{ ...btnBase, ...(!canZoomIn ? disabledStyle : {}) }}
      >
        +
      </button>

      {/* Zoom out */}
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Zoom out"
        style={{ ...btnBase, ...(!canZoomOut ? disabledStyle : {}) }}
      >
        −
      </button>

      {/* Reset — only when zoomed */}
      {isZoomed && (
        <button
          onClick={onReset}
          title="Reset zoom"
          style={{
            ...btnBase,
            fontSize: 10, fontWeight: 600,
            padding: "0 8px", width: "auto",
            color: "var(--accent-light)",
            background: "var(--accent-bg)",
            borderColor: "var(--accent-border)",
          }}
        >
          ↺ Reset
        </button>
      )}
    </div>
  );
};

// ── useZoom hook ───────────────────────────────────────────────────────────────
// windowSize = how many data points are visible at once.
// center     = the index around which zoom in/out pivots.
// Brush handles left/right panning within the window.
function useZoom(total: number) {
  // Default: show ALL data. User zooms in with + button when they want detail.
  const defaultWindow = total;

  const [windowSize, setWindowSize] = useState(defaultWindow);
  const [center,     setCenter]     = useState(Math.floor(total / 2));

  // Clamp start/end so we never go out of bounds
  const start = Math.max(0, Math.min(center - Math.floor(windowSize / 2), total - windowSize));
  const end   = Math.min(total - 1, start + windowSize - 1);

  const hasBrush = total > BRUSH_THRESHOLD;
  const isZoomed = windowSize < total;

  const zoomIn = useCallback(() => {
    setWindowSize(prev => Math.max(MIN_WINDOW, Math.floor(prev * 0.5)));
  }, []);

  const zoomOut = useCallback(() => {
    setWindowSize(prev => Math.min(total, Math.ceil(prev * 2)));
  }, [total]);

  const reset = useCallback(() => {
    setWindowSize(defaultWindow);
    setCenter(Math.floor(total / 2));
  }, [defaultWindow, total]);

  // When the Brush moves, recenter around the new midpoint
  const handleBrushChange = useCallback(
    ({ startIndex, endIndex }: { startIndex?: number; endIndex?: number }) => {
      if (startIndex !== undefined && endIndex !== undefined) {
        setCenter(Math.floor((startIndex + endIndex) / 2));
        setWindowSize(endIndex - startIndex + 1);
      }
    },
    [],
  );

  return {
    start, end, hasBrush, isZoomed,
    canZoomIn:  windowSize > MIN_WINDOW,
    canZoomOut: windowSize < total,
    zoomIn, zoomOut, reset, handleBrushChange,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ChartRenderer({ table, chart }: Props) {
  const { chart_type, x_column, y_column, group_by } = chart;
  const fullRows = (table.data ?? []) as Record<string, unknown>[];
  if (!fullRows.length) return null;

  const isPie     = chart_type === "pie";
  const isScatter = chart_type === "scatter";
  const canZoom   = !isPie && !isScatter;

  const zoom = useZoom(fullRows.length);
  const {
    start, end, hasBrush, isZoomed,
    canZoomIn, canZoomOut,
    zoomIn, zoomOut, reset, handleBrushChange,
  } = zoom;

  // Slice the visible data
  const visibleData = canZoom ? fullRows.slice(start, end + 1) : fullRows;

  const m = getMargin(hasBrush && canZoom);

  // Brush slider element
  const brushEl = (hasBrush && canZoom) ? (
    <Brush
      dataKey={x_column}
      height={26}
      stroke="var(--border-muted)"
      fill="var(--bg-elevated)"
      travellerWidth={7}
      startIndex={0}
      endIndex={visibleData.length - 1}
      onChange={handleBrushChange}
      tickFormatter={formatValue}
    />
  ) : null;

  // ── Individual chart renders ───────────────────────────────────────────────
  const renderChart = () => {

    // Simple Bar
    if (chart_type === "bar" && !group_by) {
      return (
        <BarChart data={visibleData} margin={m}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle}
            axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
          <YAxis tickFormatter={formatNumber} tick={axisStyle}
            axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
          <Bar dataKey={y_column} fill={COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={52} />
          {brushEl}
        </BarChart>
      );
    }

    // Grouped Bar
    if ((chart_type === "bar" || chart_type === "grouped_bar") && group_by) {
      const groups = [...new Set(fullRows.map(r => r[group_by]))];
      const data   = buildGroupedData(visibleData, x_column, y_column, group_by);
      return (
        <BarChart data={data} margin={m}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tick={axisStyle}
            axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle}
            axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
          <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} />
          {groups.map((g, i) => (
            <Bar key={String(g)} dataKey={String(g)}
              fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={36} />
          ))}
          {brushEl}
        </BarChart>
      );
    }

    // Stacked Bar
    if (chart_type === "stacked_bar") {
      const grpBy = group_by
        || (fullRows.length
          ? Object.keys(fullRows[0]).find(k => k !== x_column && k !== y_column)
          : undefined);
      if (!grpBy) return null;
      const groups = [...new Set(fullRows.map(r => r[grpBy]))];
      const data   = buildGroupedData(visibleData, x_column, y_column, grpBy);
      return (
        <BarChart data={data} margin={m}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tick={axisStyle}
            axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle}
            axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
          <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} />
          {groups.map((g, i) => (
            <Bar key={String(g)} dataKey={String(g)}
              fill={COLORS[i % COLORS.length]} stackId="stack"
              radius={i === groups.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
          {brushEl}
        </BarChart>
      );
    }

    // ── Line — AreaChart with gradient fill + SVG glow on stroke ─────────────
    // Default shows ALL data. User zooms in with + button.
    // Gradient fill is stable because it's always relative to the chart height,
    // not the data range — no artefact on zoom.
    if (chart_type === "line") {
      return (
        <AreaChart data={visibleData} margin={m}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS[0]} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle}
            axisLine={false} tickLine={false} angle={-30} textAnchor="end"
            interval="preserveStartEnd" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle}
            axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} />
          {/* Glow layer — blurred wide stroke behind the sharp line.
              tooltipType="none" hides it from the tooltip so it doesn't
              show up as a duplicate entry. */}
          <Area
            type="monotone"
            dataKey={y_column}
            stroke={COLORS[0]}
            strokeWidth={6}
            strokeOpacity={0.2}
            fill="none"
            dot={false}
            activeDot={false}
            tooltipType="none"
            legendType="none"
            style={{ filter: "blur(4px)" }}
          />
          {/* Sharp line + fill on top */}
          <Area
            type="monotone"
            dataKey={y_column}
            stroke={COLORS[0]}
            strokeWidth={2}
            fill="url(#lineGrad)"
            dot={false}
            activeDot={{ r: 4, fill: COLORS[0], strokeWidth: 0 }}
          />
          {brushEl}
        </AreaChart>
      );
    }

    // Area (explicit area chart type — keeps gradient, user chose this type)
    if (chart_type === "area") {
      return (
        <AreaChart data={visibleData} margin={m}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS[2]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle}
            axisLine={false} tickLine={false} angle={-30} textAnchor="end"
            interval="preserveStartEnd" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle}
            axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={y_column} stroke={COLORS[2]} strokeWidth={2}
            fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: COLORS[2] }} />
          {brushEl}
        </AreaChart>
      );
    }

    // Multi Line
    if (chart_type === "multi_line" && group_by) {
      const groups = [...new Set(fullRows.map(r => r[group_by]))];
      const data   = buildGroupedData(visibleData, x_column, y_column, group_by);
      return (
        <LineChart data={data} margin={m}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle}
            axisLine={false} tickLine={false} angle={-30} textAnchor="end"
            interval="preserveStartEnd" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle}
            axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} />
          {groups.map((g, i) => (
            <Line key={String(g)} type="monotone" dataKey={String(g)}
              stroke={COLORS[i % COLORS.length]} strokeWidth={2}
              dot={false} activeDot={{ r: 4 }} />
          ))}
          {brushEl}
        </LineChart>
      );
    }

    // Scatter — zoom not applicable (numeric axes)
    if (chart_type === "scatter") {
      const scatterData = fullRows.map(row => ({
        x: Number(row[x_column]) || 0,
        y: Number(row[y_column]) || 0,
      }));
      return (
        <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 36 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis type="number" dataKey="x" name={x_column}
            tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false}
            label={{ value: x_column, position: "insideBottom", offset: -10,
              fill: "var(--text-muted)", fontSize: 10 }} />
          <YAxis type="number" dataKey="y" name={y_column}
            tickFormatter={formatNumber} tick={axisStyle}
            axisLine={false} tickLine={false} width={44} />
          <ZAxis range={[32, 32]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: "var(--bg-elevated)",
                  border: "1px solid var(--border-muted)", borderRadius: 8,
                  padding: "8px 12px", fontSize: 11 }}>
                  <p style={{ color: "var(--text-muted)", margin: "2px 0" }}>
                    {x_column}: <span style={{ color: "var(--text-primary)" }}>{formatNumber(d.x)}</span>
                  </p>
                  <p style={{ color: "var(--text-muted)", margin: "2px 0" }}>
                    {y_column}: <span style={{ color: "var(--text-primary)" }}>{formatNumber(d.y)}</span>
                  </p>
                </div>
              );
            }}
          />
          <Scatter data={scatterData} fill={COLORS[0]} opacity={0.75} />
        </ScatterChart>
      );
    }

    // Pie — zoom not applicable
    if (chart_type === "pie") {
      const pieData = fullRows.map(row => ({
        name:  formatValue(row[x_column]),
        value: Number(row[y_column]) || 0,
      }));
      return (
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%"
            innerRadius="35%" outerRadius="60%"
            paddingAngle={3} dataKey="value">
            {fullRows.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }}
            iconType="circle" iconSize={7} />
        </PieChart>
      );
    }

    return null;
  };

  const chartEl = renderChart();
  if (!chartEl) return null;

  const chartHeight = (hasBrush && canZoom) ? 380 : 300;

  return (
    <div style={{ padding: "16px 12px 10px" }}>

      {/* ── Title row + zoom controls ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap", gap: 8, marginBottom: 12,
      }}>
        <p style={{
          fontSize: 12, fontWeight: 600,
          color: "var(--text-secondary)",
          letterSpacing: "-0.01em", margin: 0,
        }}>
          {CHART_TITLES[chart_type] ?? "Visual Distribution"}
        </p>

        {/* +/- zoom buttons — only for charts that support zoom */}
        {canZoom && (
          <ZoomControls
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={reset}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            isZoomed={isZoomed}
          />
        )}
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        {chartEl}
      </ResponsiveContainer>

      {/* Zoom level indicator */}
      {isZoomed && canZoom && (
        <p style={{
          fontSize: 9, color: "var(--text-muted)",
          textAlign: "center", marginTop: 6,
        }}>
          Showing {end - start + 1} of {fullRows.length} data points
          · drag handles to pan · tap ↺ Reset to restore
        </p>
      )}
    </div>
  );
}