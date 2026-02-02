export interface NumericStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  std: number;
  count: number;
}

export interface ChartData {
  bar_charts?: {
    label: string;
    data: { name: string; value: number }[];
  }[];
  line_charts?: {
    label: string;
    data: { timestamp: string; value: number }[];
  }[];
  radar_chart?: {
    labels: string[];
    values: number[];
    raw_values: number[];
    health_score: number;
    title: string;
  };
  pie_charts?: {
    label: string;
    data: { name: string; value: number }[];
  }[];
  histograms?: {
    column: string;
    bins: { range: string; count: number; min: number; max: number }[];
    total: number;
    stats: { mean: number; std: number; min: number; max: number };
  }[];
  grouped_bar_charts?: {
    title: string;
    group_by: string;
    groups: string[];
    datasets: { label: string; values: number[] }[];
  }[];
}

// Legacy interface for backward compatibility with existing components
export interface Statistic {
  column: string;
  mean: number;
  median: number;
  min: number;
  max: number;
  std: number;
  unit?: string;
}

export interface AnalyticsData {
  dataset_id: number;
  file_name: string;
  upload_time: string;
  total_records: number;
  columns: string[];
  numeric_columns: string[];
  categorical_columns: string[];
  numeric_stats: Record<string, NumericStats>;
  categorical_distributions: Record<string, Record<string, number>>;
  averages: Record<string, number>;
  chart_data: ChartData;
  
  // Computed/derived properties for backward compatibility
  id?: string;
  filename?: string;
  numeric_columns_count?: number;
  categorical_columns_count?: number;
  statistics?: Statistic[];
}

export interface DatasetHistoryItem {
  id: number;
  file_name: string;
  upload_time: string;
  total_records: number;
  
  // Legacy aliases for backward compatibility
  filename?: string;
  record_count?: number;
}

export interface HistoryResponse {
  count: number;
  max_history: number;
  datasets: DatasetHistoryItem[];
}

export interface AuthState {
  isLoggedIn: boolean;
  username: string;
  authHeader: string | null;
}
