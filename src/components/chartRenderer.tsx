import { useState, useCallback } from "react";
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

// ── Constants ─────────────────────────────────────────────────────────────────
const COLORS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#f43f5e", "#84cc16"];

// How many data points to show in the Brush window by default.
// If dataset has ≤ BRUSH_THRESHOLD points, Brush is hidden (no need).
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
const axisStyle = {
  fontSize: 11,
  fill: "var(--text-muted)",
  fontFamily: "DM Sans, sans-serif",
};

const gridStyle = {
  stroke: "var(--border-subtle)",
  strokeDasharray: "3 3",
};

// Extra bottom margin when Brush is shown, normal otherwise
const margin = (hasBrush: boolean) => ({
  top: 10, right: 10, left: 0,
  bottom: hasBrush ? 10 : 40,
});

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
interface TooltipPayloadItem { color: string; name: string; value: number; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayloadItem[]; label?: string; }

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-elevated)", border: "1px solid var(--border-muted)",
      borderRadius: 8, padding: "10px 14px", fontSize: 12,
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

// ── Brush component (shared config) ───────────────────────────────────────────
// startIndex / endIndex control the visible window.
// onChange fires whenever user drags the handles.
const BrushBar = ({
  dataKey,
  dataLength,
  startIndex,
  endIndex,
  onChange,
}: {
  dataKey: string;
  dataLength: number;
  startIndex: number;
  endIndex: number;
  onChange: (range: { startIndex?: number; endIndex?: number }) => void;
}) => (
  <Brush
    dataKey={dataKey}
    height={28}
    stroke="var(--border-muted)"
    fill="var(--bg-elevated)"
    travellerWidth={8}
    startIndex={startIndex}
    endIndex={endIndex}
    onChange={onChange}
    tickFormatter={formatValue}
  >
    {/* Recharts requires a chart child inside Brush for the minimap */}
    <AreaChart>
      <Area dataKey={dataKey} stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.15} />
    </AreaChart>
  </Brush>
);

// ── Zoom state hook ────────────────────────────────────────────────────────────
// Manages:
//   brushStart / brushEnd  — current Brush window indices
//   refLeft / refRight     — ReferenceArea drag-to-zoom state (index strings)
//   zoomedData             — sliced rows after drag-zoom
function useZoom(fullData: Record<string, unknown>[], xColumn: string) {
  const total = fullData.length;
  const defaultWindow = Math.min(total - 1, Math.max(0, BRUSH_THRESHOLD - 1));

  const [brushStart, setBrushStart] = useState(0);
  const [brushEnd, setBrushEnd]   = useState(defaultWindow);

  // ReferenceArea drag state
  const [refLeft,  setRefLeft]  = useState<string | null>(null);
  const [refRight, setRefRight] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Data currently visible (after drag-zoom; null = show all brushed data)
  const [zoomedData, setZoomedData] = useState<Record<string, unknown>[] | null>(null);

  const hasBrush = total > BRUSH_THRESHOLD;

  // The data the chart actually renders
  const visibleData = zoomedData
    ?? (hasBrush ? fullData.slice(brushStart, brushEnd + 1) : fullData);

  const handleBrushChange = useCallback(
    ({ startIndex, endIndex }: { startIndex?: number; endIndex?: number }) => {
      if (startIndex !== undefined) setBrushStart(startIndex);
      if (endIndex   !== undefined) setBrushEnd(endIndex);
      setZoomedData(null); // clear drag-zoom when brush moves
    },
    [],
  );

  // ReferenceArea drag-to-zoom (line/area/scatter only)
  const onMouseDown = useCallback((e: any) => {
    if (!e?.activeLabel) return;
    setRefLeft(e.activeLabel);
    setRefRight(null);
    setIsSelecting(true);
  }, []);

  const onMouseMove = useCallback((e: any) => {
    if (!isSelecting || !e?.activeLabel) return;
    setRefRight(e.activeLabel);
  }, [isSelecting]);

  const onMouseUp = useCallback(() => {
    if (!isSelecting) return;
    setIsSelecting(false);

    if (refLeft === null || refRight === null || refLeft === refRight) {
      setRefLeft(null);
      setRefRight(null);
      return;
    }

    const base = zoomedData ?? (hasBrush ? fullData.slice(brushStart, brushEnd + 1) : fullData);
    const idxLeft  = base.findIndex(r => formatValue(r[xColumn]) === refLeft);
    const idxRight = base.findIndex(r => formatValue(r[xColumn]) === refRight);
    if (idxLeft === -1 || idxRight === -1) { setRefLeft(null); setRefRight(null); return; }

    const [lo, hi] = idxLeft < idxRight ? [idxLeft, idxRight] : [idxRight, idxLeft];
    const sliced = base.slice(lo, hi + 1);
    if (sliced.length > 1) setZoomedData(sliced);

    setRefLeft(null);
    setRefRight(null);
  }, [isSelecting, refLeft, refRight, zoomedData, hasBrush, fullData, brushStart, brushEnd, xColumn]);

  const resetZoom = useCallback(() => {
    setZoomedData(null);
    setBrushStart(0);
    setBrushEnd(defaultWindow);
  }, [defaultWindow]);

  const isZoomed = zoomedData !== null;

  return {
    visibleData, hasBrush, brushStart, brushEnd,
    handleBrushChange, onMouseDown, onMouseMove, onMouseUp,
    refLeft, refRight, isZoomed, resetZoom,
  };
}

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
  pie:         "Distribution",
  line:        "Trend Analysis",
  area:        "Area Trend",
  scatter:     "Correlation Analysis",
  stacked_bar: "Stacked Breakdown",
  multi_line:  "Multi-Metric Trend",
  grouped_bar: "Visual Distribution",
  bar:         "Visual Distribution",
};

// ── Reset zoom button ──────────────────────────────────────────────────────────
const ResetButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      fontSize: 11, fontWeight: 600,
      color: "var(--accent-light)",
      background: "var(--accent-bg)",
      border: "1px solid var(--accent-border)",
      borderRadius: 6, padding: "3px 10px",
      cursor: "pointer", marginLeft: 10,
    }}
  >
    ↺ Reset zoom
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ChartRenderer({ table, chart }: Props) {
  const { chart_type, x_column, y_column, group_by } = chart;
  const fullRows = (table.data ?? []) as Record<string, unknown>[];

  if (!fullRows.length) return null;

  const title = CHART_TITLES[chart_type] ?? "Visual Distribution";

  // Pie and scatter don't benefit from the same zoom model — handled separately
  const isPie     = chart_type === "pie";
  const isScatter = chart_type === "scatter";
  const useDragZoom = !isPie && !isScatter; // line, area, bar, grouped, stacked, multi_line

  const zoom = useZoom(fullRows, x_column);
  const { visibleData, hasBrush, brushStart, brushEnd, handleBrushChange,
          onMouseDown, onMouseMove, onMouseUp,
          refLeft, refRight, isZoomed, resetZoom } = zoom;

  const m = margin(hasBrush);

  // Shared Brush element (reused across chart types)
  const brushEl = hasBrush ? (
    <BrushBar
      dataKey={x_column}
      dataLength={fullRows.length}
      startIndex={brushStart}
      endIndex={brushEnd}
      onChange={handleBrushChange}
    />
  ) : null;

  // Shared drag-zoom props (only for charts that support it)
  const dragZoomProps = useDragZoom ? {
    onMouseDown,
    onMouseMove,
    onMouseUp,
  } : {};

  // ReferenceArea shown while user is dragging
  const refAreaEl = (refLeft && refRight) ? (
    <ReferenceArea
      x1={refLeft} x2={refRight}
      strokeOpacity={0.3}
      fill="var(--accent)"
      fillOpacity={0.15}
    />
  ) : null;

  // ── Render individual chart types ──────────────────────────────────────────
  const renderChart = () => {

    // ── Simple Bar ────────────────────────────────────────────────────────────
    if (chart_type === "bar" && !group_by) {
      return (
        <BarChart data={visibleData} margin={m} {...dragZoomProps}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
          <Bar dataKey={y_column} fill={COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={56} />
          {refAreaEl}
          {brushEl}
        </BarChart>
      );
    }

    // ── Grouped Bar ───────────────────────────────────────────────────────────
    if ((chart_type === "bar" || chart_type === "grouped_bar") && group_by) {
      const groups = [...new Set(fullRows.map(r => r[group_by]))];
      const data   = buildGroupedData(visibleData, x_column, y_column, group_by);
      return (
        <BarChart data={data} margin={m} {...dragZoomProps}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
          {groups.map((g, i) => (
            <Bar key={String(g)} dataKey={String(g)} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={40} />
          ))}
          {refAreaEl}
          {brushEl}
        </BarChart>
      );
    }

    // ── Stacked Bar ───────────────────────────────────────────────────────────
    if (chart_type === "stacked_bar") {
      const grpBy = group_by || (fullRows.length ? Object.keys(fullRows[0]).find(k => k !== x_column && k !== y_column) : undefined);
      if (!grpBy) return null;
      const groups = [...new Set(fullRows.map(r => r[grpBy]))];
      const data   = buildGroupedData(visibleData, x_column, y_column, grpBy);
      return (
        <BarChart data={data} margin={m} {...dragZoomProps}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-subtle)" }} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
          {groups.map((g, i) => (
            <Bar key={String(g)} dataKey={String(g)} fill={COLORS[i % COLORS.length]} stackId="stack"
              radius={i === groups.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
          {refAreaEl}
          {brushEl}
        </BarChart>
      );
    }

    // ── Line Chart (with area fill) ───────────────────────────────────────────
    if (chart_type === "line") {
      return (
        <AreaChart data={visibleData} margin={m} {...dragZoomProps}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS[0]} stopOpacity={0.15} />
              <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={y_column} stroke={COLORS[0]} strokeWidth={2} fill="url(#lineGrad)" dot={false} activeDot={{ r: 4, fill: COLORS[0] }} />
          {refAreaEl}
          {brushEl}
        </AreaChart>
      );
    }

    // ── Area Chart ────────────────────────────────────────────────────────────
    if (chart_type === "area") {
      return (
        <AreaChart data={visibleData} margin={m} {...dragZoomProps}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS[2]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={y_column} stroke={COLORS[2]} strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: COLORS[2] }} />
          {refAreaEl}
          {brushEl}
        </AreaChart>
      );
    }

    // ── Multi Line ────────────────────────────────────────────────────────────
    if (chart_type === "multi_line" && group_by) {
      const groups = [...new Set(fullRows.map(r => r[group_by]))];
      const data   = buildGroupedData(visibleData, x_column, y_column, group_by);
      return (
        <LineChart data={data} margin={m} {...dragZoomProps}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={x_column} tickFormatter={formatValue} tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tickFormatter={formatNumber} tick={axisStyle} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
          {groups.map((g, i) => (
            <Line key={String(g)} type="monotone" dataKey={String(g)} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          ))}
          {refAreaEl}
          {brushEl}
        </LineChart>
      );
    }

    // ── Scatter (no brush/zoom — axes are numeric, not categorical) ───────────
    if (chart_type === "scatter") {
      const scatterData = fullRows.map(row => ({
        x: Number(row[x_column]) || 0,
        y: Number(row[y_column]) || 0,
      }));
      return (
        <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
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

    // ── Pie (no zoom — doesn't apply) ─────────────────────────────────────────
    if (chart_type === "pie") {
      const pieData = fullRows.map(row => ({
        name:  formatValue(row[x_column]),
        value: Number(row[y_column]) || 0,
      }));
      return (
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={3} dataKey="value">
            {fullRows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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

  // Chart height: taller when Brush is shown so chart area stays the same
  const chartHeight = hasBrush ? 390 : 340;

  return (
    <div style={{ padding: "20px 16px 12px" }}>

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <p style={{
          fontSize: 13, fontWeight: 600,
          color: "var(--text-secondary)",
          letterSpacing: "-0.01em", margin: 0,
        }}>
          {title}
        </p>

        {/* Zoom hint — only for charts that support drag-zoom */}
        {useDragZoom && !isPie && (
          <span style={{
            fontSize: 10, color: "var(--text-muted)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 4, padding: "2px 7px",
          }}>
            {hasBrush ? "drag handles to pan · click & drag chart to zoom" : "click & drag to zoom"}
          </span>
        )}

        {isZoomed && <ResetButton onClick={resetZoom} />}
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        {chartElement}
      </ResponsiveContainer>

      {/* Double-click hint when zoomed */}
      {isZoomed && (
        <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginTop: 4 }}>
          Click ↺ Reset zoom to see full data
        </p>
      )}
    </div>
  );
}