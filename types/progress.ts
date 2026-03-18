// ── Stats types ───────────────────────────────────────────────────────────────

/** A progress_stats DB row as returned from the API. */
export interface ProgressStat {
  id: string;
  userId: string;
  weightKg: number | null;
  weightLb: number | null;
  bodyFat: number | null;
  recordedDate: string; // 'YYYY-MM-DD'
  createdAt: string;
  updatedAt: string;
}

/** Caller-provided input for a manual stat entry. */
export interface ProgressStatInput {
  weightKg?: number;
  weightLb?: number;
  bodyFat?: number;
  recordedDate: string; // 'YYYY-MM-DD'
}

/** A single point on the stats line chart. */
export interface StatChartPoint {
  date: string; // 'YYYY-MM-DD'
  value: number;
}

/** Pre-computed summary for the chart header (current value + trend). */
export interface StatsSummary {
  currentValue: number | null;
  trendPercent: number | null; // ((current - 30dAgo) / 30dAgo) * 100
  chartPoints: StatChartPoint[];
}

/** One page of the paginated history list. */
export interface StatsHistoryPage {
  items: Array<ProgressStat & { delta: number | null }>;
  hasMore: boolean;
}

// ── Photo types ───────────────────────────────────────────────────────────────

/** Caller-provided input for a single progress photo upload session. */
export interface ProgressPhotoInput {
  frontUri: string; // local file URI
  sideUri: string;
  backUri: string;
  capturedDate: string; // ISO date 'YYYY-MM-DD'
  weightKg?: number;
  weightLb?: number;
  bodyFat?: number;
}

/** A progress_photos DB row as returned from the API. */
export interface ProgressPhoto {
  id: string;
  userId: string;
  frontPhotoUrl: string;
  sidePhotoUrl: string;
  backPhotoUrl: string;
  capturedDate: string;
  weightKg: number | null;
  weightLb: number | null;
  bodyFat: number | null;
  createdAt: string;
  updatedAt: string;
}
