import { ApiResult } from "@/types/api";
import { ErrorCode } from "@/types/error";
import {
  ProgressStat,
  ProgressStatInput,
  StatChartPoint,
  StatsHistoryPage,
  StatsSummary,
} from "@/types/progress";
import { supabase } from "@/util/supabase";
import { format, subDays } from "date-fns";

const PAGE_SIZE = 10;

// ── Mapper ────────────────────────────────────────────────────────────────────

const mapProgressStat = (row: any): ProgressStat => ({
  id: row.id,
  userId: row.user_id,
  weightKg: row.weight_kg ?? null,
  weightLb: row.weight_lb ?? null,
  bodyFat: row.body_fat ?? null,
  recordedDate: row.recorded_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ── API ───────────────────────────────────────────────────────────────────────

export const statsApi = {
  /**
   * Returns chart-ready data for the last 90 days plus a computed trend.
   * metric: 'weight' uses preferred_unit_system to pick kg/lb column;
   *         'fat' uses body_fat.
   */
  getStatsSummary: async (
    userId: string,
    metric: "weight" | "fat",
    unitSystem: "KG" | "LB" = "KG",
  ): Promise<ApiResult<StatsSummary>> => {
    const since = format(subDays(new Date(), 90), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("progress_stats")
      .select("recorded_date, weight_kg, weight_lb, body_fat")
      .eq("user_id", userId)
      .gte("recorded_date", since)
      .order("recorded_date", { ascending: true });

    if (error) {
      return {
        success: false,
        error: {
          code: ErrorCode.STATS_FETCH_ERROR,
          message: `Failed to fetch stats summary: ${error.message}`,
          originalError: error,
        },
      };
    }

    const rows = data ?? [];

    const getValue = (row: any): number | null => {
      if (metric === "fat") return row.body_fat ?? null;
      return unitSystem === "LB"
        ? (row.weight_lb ?? null)
        : (row.weight_kg ?? null);
    };

    const chartPoints: StatChartPoint[] = rows
      .map((r) => ({ date: r.recorded_date, value: getValue(r) }))
      .filter((p): p is StatChartPoint => p.value !== null);

    const currentValue = chartPoints.at(-1)?.value ?? null;

    // Trend: compare current to the earliest point in the window that is
    // at least 30 days before today.
    const cutoff = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const baseline = chartPoints.find((p) => p.date <= cutoff) ?? null;
    const trendPercent =
      currentValue !== null && baseline !== null && baseline.value !== 0
        ? ((currentValue - baseline.value) / baseline.value) * 100
        : null;

    return {
      success: true,
      data: { currentValue, trendPercent, chartPoints },
    };
  },

  /**
   * Returns a page of history rows (newest first) with a per-row delta
   * vs the immediately preceding entry.
   */
  getStatsHistory: async (
    userId: string,
    page: number,
    metric: "weight" | "fat",
    unitSystem: "KG" | "LB" = "KG",
  ): Promise<ApiResult<StatsHistoryPage>> => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE; // range is inclusive on both ends in Supabase

    const { data, error } = await supabase
      .from("progress_stats")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_date", { ascending: false })
      .range(from, to); // fetch PAGE_SIZE + 1 to determine hasMore

    if (error) {
      return {
        success: false,
        error: {
          code: ErrorCode.STATS_FETCH_ERROR,
          message: `Failed to fetch stats history: ${error.message}`,
          originalError: error,
        },
      };
    }

    const rows = data ?? [];
    const hasMore = rows.length > PAGE_SIZE;
    const pageRows = rows.slice(0, PAGE_SIZE).map(mapProgressStat);

    const getValue = (stat: ProgressStat): number | null => {
      if (metric === "fat") return stat.bodyFat;
      return unitSystem === "LB" ? stat.weightLb : stat.weightKg;
    };

    // Delta = current value minus the next (older) row's value
    const items = pageRows.map((stat, idx) => {
      const prev = pageRows[idx + 1];
      const cur = getValue(stat);
      const prevVal = prev ? getValue(prev) : null;
      const delta = cur !== null && prevVal !== null ? cur - prevVal : null;
      return { ...stat, delta };
    });

    return { success: true, data: { items, hasMore } };
  },

  /**
   * Upserts a stat row for the given user + date.
   * Existing fields not provided in input are left unchanged.
   */
  insertStat: async (
    userId: string,
    input: ProgressStatInput,
  ): Promise<ApiResult<ProgressStat>> => {
    const { data, error } = await supabase
      .from("progress_stats")
      .upsert(
        {
          user_id: userId,
          recorded_date: input.recordedDate,
          ...(input.weightKg != null && { weight_kg: input.weightKg }),
          ...(input.weightLb != null && { weight_lb: input.weightLb }),
          ...(input.bodyFat != null && { body_fat: input.bodyFat }),
        },
        { onConflict: "user_id,recorded_date" },
      )
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: {
          code: ErrorCode.STATS_INSERT_ERROR,
          message: `Failed to save stat: ${error?.message ?? "unknown error"}`,
          originalError: error,
        },
      };
    }

    return { success: true, data: mapProgressStat(data) };
  },
};
