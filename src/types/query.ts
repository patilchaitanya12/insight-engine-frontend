export interface TableData {
  columns: string[];
  data: Record<string, any>[];
}

export interface ChartConfig {
  chart_type: "bar" | "line" | "pie" | "scatter";
  x_column: string;
  y_column: string;
}

export interface QueryResponse {
  table: TableData;
  chart: ChartConfig;
  insights: string;
}