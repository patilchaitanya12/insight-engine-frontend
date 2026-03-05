import { BarChart, LineChart, PieChart, ScatterChart } from "@mui/x-charts";
import { Paper, Typography } from "@mui/material";
import type { ChartConfig, TableData } from "../types/query";

interface Props {
  table: TableData;
  chart: ChartConfig;
}

export default function ChartRenderer({ table, chart }: Props) {
  const { chart_type, x_column, y_column } = chart;

  const rows = table.data;

  const xData = rows.map((row) => row[x_column]);
  const yData = rows.map((row) => row[y_column]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Chart Visualization
      </Typography>

      {chart_type === "bar" && (
        <BarChart
          xAxis={[
            {
              scaleType: "band",
              data: xData,
              label: x_column
            }
          ]}
          series={[
            {
              data: yData,
              label: y_column
            }
          ]}
          width={800}
          height={400}
        />
      )}

      {chart_type === "line" && (
        <LineChart
          xAxis={[{ scaleType: "point", data: xData }]}
          series={[
            {
              data: yData,
              label: y_column
            }
          ]}
          width={800}
          height={400}
        />
      )}

      {chart_type === "pie" && (
        <PieChart
          series={[
            {
              data: rows.map((row, index) => ({
                id: index,
                value: row[y_column],
                label: row[x_column]
              }))
            }
          ]}
          width={500}
          height={400}
        />
      )}

      {chart_type === "scatter" && (
        <ScatterChart
          series={[
            {
              data: rows.map((row) => ({
                x: row[x_column],
                y: row[y_column]
              }))
            }
          ]}
          width={800}
          height={400}
        />
      )}
    </Paper>
  );
}