export interface TableData {
  columns: string[];
  data: Record<string, any>[];
}

export interface ChartConfig {
  chart_type: "bar" | "grouped_bar" | "line" | "pie" | "scatter" | "area" | "stacked_bar" | "multi_line";
  x_column: string;
  y_column: string;
  group_by?: string;
}

export interface QueryResponse {
  table: TableData;
  chart: ChartConfig;
  insights: string;
}