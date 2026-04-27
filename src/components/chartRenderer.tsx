import { BarChart, LineChart, PieChart } from "@mui/x-charts";
import { Paper, Typography, Box, useTheme } from "@mui/material";
import type { ChartConfig, TableData } from "../types/query";

interface Props {
  table: TableData;
  chart: ChartConfig;
}

// Updated color palette to be vibrant in both modes
const CHART_COLORS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444"];

export default function ChartRenderer({ table, chart }: Props) {
  const { chart_type, x_column, y_column, group_by } = chart;
  const rows = table.data ?? [];
  
  // Initialize theme for color coding
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!rows.length) return null;

  const formatValue = (value: any) => {
    if (!value) return "";
    const v = value.toString();
    return v.includes("T") ? v.split("T")[0] : v;
  };

  const xData = rows.map((row) => formatValue(row[x_column]));
  const yData = rows.map((row) => Number(row[y_column]) || 0);

  const containerStyle = {
    p: 4,
    borderRadius: 6,
    bgcolor: "background.paper", // Theme aware background
    border: "1px solid",
    borderColor: "divider",      // Theme aware border
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.05)",
    mb: 4,
  };

  const commonProps = {
    height: 400,
    margin: { top: 50, bottom: 50, left: 60, right: 20 },
    colors: CHART_COLORS,
    slotProps: {
      legend: {
        labelStyle: { 
          fill: theme.palette.text.secondary, // Dynamic legend color
          fontSize: 12 
        },
      },
    },
    // This adds dynamic coloring to the axes (lines and labels)
    sx: {
      "& .MuiChartsAxis-left .MuiChartsAxis-tickLabel": {
        fill: theme.palette.text.secondary,
      },
      "& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel": {
        fill: theme.palette.text.secondary,
      },
      "& .MuiChartsAxis-line": {
        stroke: theme.palette.divider,
      },
      "& .MuiChartsAxis-tick": {
        stroke: theme.palette.divider,
      },
    }
  };

  // Grouped Bar Logic
  if (group_by && (chart_type === "bar" || chart_type === "grouped_bar")) {
    const groups = [...new Set(rows.map((r) => r[group_by]))];
    const categories = [...new Set(rows.map((r) => formatValue(r[x_column])))];

    const series = groups.map((group) => ({
      label: String(group),
      data: categories.map((cat) => {
        const row = rows.find(
          (r) => formatValue(r[x_column]) === cat && r[group_by] === group
        );
        return row ? Number(row[y_column]) : 0;
      }),
    }));

    return (
      <Paper sx={containerStyle}>
        <Typography variant="h6" sx={{ color: "text.primary", mb: 2, fontWeight: 700 }}>
          Visual Distribution
        </Typography>
        <Box sx={{ width: "100%" }}>
          <BarChart
            {...commonProps}
            xAxis={[{ scaleType: "band", data: categories, label: x_column }]}
            series={series}
          />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={containerStyle}>
      <Typography variant="h6" sx={{ color: "text.primary", mb: 2, fontWeight: 700 }}>
        Trend Analysis
      </Typography>
      <Box sx={{ width: "100%" }}>
        {chart_type === "bar" && (
          <BarChart
            {...commonProps}
            xAxis={[{ scaleType: "band", data: xData }]}
            series={[{ data: yData, label: y_column }]}
          />
        )}
        {chart_type === "line" && (
          <LineChart
            {...commonProps}
            xAxis={[{ scaleType: "point", data: xData }]}
            series={[{ data: yData, label: y_column, area: true }]}
          />
        )}
        {chart_type === "pie" && (
          <PieChart
            {...commonProps}
            series={[{
              data: rows.map((row, i) => ({
                id: i,
                value: Number(row[y_column]) || 0,
                label: formatValue(row[x_column]),
              })),
              innerRadius: 80,
              paddingAngle: 5,
              cornerRadius: 5,
            }]}
          />
        )}
      </Box>
    </Paper>
  );
}