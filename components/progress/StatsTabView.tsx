import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Lock, Repeat } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform } from "react-native";

import { statsApi } from "@/api/stats-api";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { DataTable, DataTableRow } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartPoint, GraphWidget } from "@/components/ui/graph-widget";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { SyncBanner } from "@/components/ui/sync-banner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { WidgetCard } from "@/components/ui/widget-card";
import { useAppToast } from "@/hooks/use-app-toast";
import {
  HealthSyncService,
  HealthWeightEntry,
} from "@/services/HealthSyncService";
import { ProgressStat, StatsHistoryPage } from "@/types/progress";
import { UnitSystem } from "@/types/user";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StatsTabViewProps {
  myId: string;
  myFirstName: string;
  partnerId?: string;
  partnerFirstName?: string;
  partnerPrivacyOn: boolean;
  unitSystem: UnitSystem;
}

type ComparisonTarget = "mine" | "partner";
type StatMetric = "weight" | "fat";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatStatValue(
  stat: ProgressStat,
  metric: StatMetric,
  unitSystem: UnitSystem,
): string {
  if (metric === "fat") {
    return stat.bodyFat === null ? "—" : `${stat.bodyFat.toFixed(1)}%`;
  }
  if (unitSystem === "LB") {
    return stat.weightLb === null ? "—" : `${stat.weightLb.toFixed(1)} lb`;
  }
  return stat.weightKg === null ? "—" : `${stat.weightKg.toFixed(1)} kg`;
}

const formatDelta = (
  delta: number | null,
  metric: StatMetric,
  unitSystem: UnitSystem,
): string => {
  if (delta === null) return "";
  const sign = delta >= 0 ? "+" : "";
  if (metric === "fat") return `${sign}${delta.toFixed(1)}%`;
  const unit = unitSystem === "LB" ? "lb" : "kg";
  return `${sign}${delta.toFixed(1)} ${unit}`;
};

function formatCurrentValue(
  value: number | null,
  metric: StatMetric,
  unitSystem: UnitSystem,
): string {
  if (value === null) return "—";
  if (metric === "fat") return `${value.toFixed(1)}%`;
  return `${value.toFixed(1)} ${unitSystem === "LB" ? "lb" : "kg"}`;
}

function formatTrend(trendPercent: number | null): string {
  if (trendPercent === null) return "—";
  const sign = trendPercent >= 0 ? "+" : "";
  return `${sign}${trendPercent.toFixed(1)}%`;
}

function trendColorClass(trendPercent: number | null): string {
  if (trendPercent === null) return "text-typography-900 dark:text-white";
  return trendPercent <= 0 ? "text-success-400" : "text-error-500";
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface TargetSelectorProps {
  target: ComparisonTarget;
  partnerFirstName?: string;
  onToggle: () => void;
  t: (key: string, opts?: Record<string, string>) => string;
}

function TargetSelector({
  target,
  partnerFirstName,
  onToggle,
  t,
}: Readonly<TargetSelectorProps>) {
  const label =
    target === "mine"
      ? t("stats.my_stats")
      : t("stats.partner_stats", { name: partnerFirstName ?? "Partner" });
  return (
    <Pressable
      onPress={onToggle}
      className="rounded-2xl h-[52px] px-4 flex-row items-center justify-between bg-[#EEF0F6] dark:bg-background-dark"
    >
      <Text
        className="text-typography-900 dark:text-white font-bold text-sm flex-1 mr-2"
        numberOfLines={1}
      >
        {label}
      </Text>
      <Icon as={Repeat} className="text-typography-500" />
    </Pressable>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StatsTabView({
  myId,
  partnerId,
  partnerFirstName,
  partnerPrivacyOn,
  unitSystem,
}: Readonly<StatsTabViewProps>) {
  const { t } = useTranslation();
  const toast = useAppToast();

  const hasPartner = !!partnerId;
  const [target, setTarget] = useState<ComparisonTarget>("mine");
  const [metric, setMetric] = useState<StatMetric>("weight");
  const [isSyncing, setIsSyncing] = useState(false);
  const [sdkWeightEntry, setSdkWeightEntry] =
    useState<HealthWeightEntry | null>(null);

  const targetId = target === "mine" ? myId : (partnerId ?? "");
  const showPrivacyGate = target === "partner" && partnerPrivacyOn;
  const metricOptions = [t("stats.weight"), t("stats.body_fat")];
  const selectedMetricLabel =
    metric === "weight" ? t("stats.weight") : t("stats.body_fat");

  useEffect(() => {
    if (target !== "mine") return;
    void (async () => {
      const { granted, error } = await HealthSyncService.requestPermissions();
      if (error === "SDK_UNAVAILABLE") {
        toast.warning(t("stats.health_unavailable"));
      } else if (error === "PERMISSION_DENIED") {
        toast.info(t("stats.health_permission_denied"));
      }
      if (!granted) return;
      const entry = await HealthSyncService.getLatestWeightEntry();
      setSdkWeightEntry(entry);
    })();
    // toast and t are utility functions, not reactive state. useAppToast()
    // returns a new object every render, so including it here would cause an
    // infinite re-render loop identical to the one in useHealthData.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["stats-summary", targetId, metric, unitSystem],
    queryFn: async () => {
      const result = await statsApi.getStatsSummary(
        targetId,
        metric,
        unitSystem,
      );
      if (!result.success) throw result.error;
      return result.data;
    },
    enabled: !!targetId && !showPrivacyGate,
    staleTime: 2 * 60_000,
  });

  const {
    data: historyData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: historyLoading,
  } = useInfiniteQuery<StatsHistoryPage, Error>({
    queryKey: ["stats-history", targetId, metric, unitSystem],
    queryFn: async ({ pageParam }) => {
      const result = await statsApi.getStatsHistory(
        targetId,
        pageParam as number,
        metric,
        unitSystem,
      );
      if (!result.success) throw result.error;
      return result.data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length : undefined,
    initialPageParam: 0,
    enabled: !!targetId && !showPrivacyGate,
    staleTime: 2 * 60_000,
  });

  const historyItems = historyData?.pages.flatMap((p) => p.items) ?? [];
  const latestStat: ProgressStat | null = historyItems[0] ?? null;

  const chartData: ChartPoint[] = (summary?.chartPoints ?? []).map((p) => ({
    value: p.value,
    label: format(new Date(p.date), "M/d"),
  }));
  const currentLabel = formatCurrentValue(
    summary?.currentValue ?? null,
    metric,
    unitSystem,
  );
  const trendLabel = formatTrend(summary?.trendPercent ?? null);
  const trendClass = trendColorClass(summary?.trendPercent ?? null);

  const needsSync =
    target === "mine" &&
    metric === "weight" &&
    HealthSyncService.checkNeedsSync(sdkWeightEntry?.date ?? null, latestStat);

  const handleSync = async () => {
    if (!sdkWeightEntry) return;
    setIsSyncing(true);
    try {
      const result = await statsApi.insertStat(myId, {
        recordedDate: sdkWeightEntry.date,
        weightKg: sdkWeightEntry.weightKg,
        weightLb: sdkWeightEntry.weightKg * 2.20462,
      });
      if (result.success) {
        toast.success(t("stats.sync_success"));
      } else {
        toast.error(t("stats.sync_error"));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleTarget = () =>
    setTarget((prev) => (prev === "mine" ? "partner" : "mine"));

  if (showPrivacyGate) {
    return (
      <VStack className="gap-4">
        {hasPartner && (
          <TargetSelector
            target={target}
            partnerFirstName={partnerFirstName}
            onToggle={() => setTarget("mine")}
            t={t}
          />
        )}
        <WidgetCard>
          <VStack className="items-center gap-3 py-4">
            <Box className="w-14 h-14 rounded-full bg-background-100 items-center justify-center">
              <Icon as={Lock} size="xl" className="text-typography-400" />
            </Box>
            <Text className="text-typography-400 text-sm text-center">
              {t("stats.privacy_blocked", {
                name: partnerFirstName ?? "Partner",
              })}
            </Text>
          </VStack>
        </WidgetCard>
      </VStack>
    );
  }

  return (
    <VStack className="gap-4">
      {hasPartner && (
        <TargetSelector
          target={target}
          partnerFirstName={partnerFirstName}
          onToggle={handleToggleTarget}
          t={t}
        />
      )}

      <SegmentedControl
        options={metricOptions}
        selectedValue={selectedMetricLabel}
        onValueChange={(val) =>
          setMetric(val === t("stats.weight") ? "weight" : "fat")
        }
      />

      {needsSync && (
        <SyncBanner
          isSyncing={isSyncing}
          onSync={() => void handleSync()}
          prompt={
            Platform.OS === "android"
              ? t("stats.sync_prompt_android")
              : t("stats.sync_prompt")
          }
          syncLabel={t("stats.sync_to_cloud")}
        />
      )}

      <GraphWidget
        isLoading={summaryLoading}
        chartData={chartData}
        panels={[
          { title: t("stats.current"), value: currentLabel },
          {
            title: t("stats.trend"),
            value: trendLabel,
            valueClassName: trendClass,
          },
        ]}
        emptyMessage={t("stats.no_data")}
      />

      <WidgetCard title={t("stats.history")}>
        {historyLoading && (
          <Box className="py-8 items-center">
            <ActivityIndicator />
          </Box>
        )}

        {!historyLoading && historyItems.length === 0 && (
          <EmptyState message={t("stats.no_data")} />
        )}

        {!historyLoading && historyItems.length > 0 && (
          <>
            <DataTable>
              {historyItems.map((stat) => {
                const rawDelta =
                  stat.delta !== null && stat.delta !== 0 ? stat.delta : null;
                return (
                  <DataTableRow
                    key={stat.id}
                    label={format(
                      new Date(stat.recordedDate),
                      "EEE, MMM d yyyy",
                    )}
                    sublabel={format(new Date(stat.recordedDate), "MMMM yyyy")}
                    value={formatStatValue(stat, metric, unitSystem)}
                    delta={
                      rawDelta !== null
                        ? formatDelta(rawDelta, metric, unitSystem)
                        : undefined
                    }
                    deltaPositive={
                      rawDelta !== null ? rawDelta <= 0 : undefined
                    }
                  />
                );
              })}
            </DataTable>

            {hasNextPage && (
              <Button
                variant="outline"
                className="mt-1 rounded-xl"
                onPress={() => void fetchNextPage()}
                isDisabled={isFetchingNextPage}
              >
                <ButtonText>
                  {isFetchingNextPage
                    ? t("common.saving")
                    : t("stats.load_more")}
                </ButtonText>
              </Button>
            )}
          </>
        )}
      </WidgetCard>
    </VStack>
  );
}
