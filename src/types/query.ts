export interface TableData {
  columns: string[];
  data: Record<string, any>[];
}

export interface ChartConfig {
  chart_type: "bar" | "grouped_bar" | "line" | "pie" | "scatter" | "area" | "stacked_bar" | "multi_line";
  x_column: string;
  y_column: string;
  group_by?: string;
  /** The aggregation applied on the backend (sum | avg | count | max | min).
   *  Used by MetricCards to avoid re-aggregating already-aggregated rows. */
  aggregation?: string;
}

export interface QueryResponse {
  query_id: string | null;
  table: TableData;
  chart: ChartConfig;
  insights: string;
}