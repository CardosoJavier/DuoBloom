import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Lock, RefreshCw, Repeat } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import { statsApi } from "@/api/stats-api";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAppToast } from "@/hooks/use-app-toast";
import {
  HealthSyncService,
  HealthWeightEntry,
} from "@/services/HealthSyncService";
import { ProgressStat, StatsHistoryPage, StatsSummary } from "@/types/progress";
import { UnitSystem } from "@/types/user";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StatsTabViewProps {
  myId: string;
  myFirstName: string;
  partnerId?: string;
  partnerFirstName?: string;
  partnerPrivacyOn: boolean;
  unitSystem: UnitSystem;
  colorScheme: "light" | "dark";
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
  return trendPercent <= 0 ? "text-success-500" : "text-error-500";
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

interface SyncBannerProps {
  isSyncing: boolean;
  onSync: () => void;
  t: (key: string) => string;
  cardBg: string;
  borderColor: string;
}

function SyncBanner({
  isSyncing,
  onSync,
  t,
  cardBg,
  borderColor,
}: Readonly<SyncBannerProps>) {
  const prompt =
    Platform.OS === "android"
      ? t("stats.sync_prompt_android")
      : t("stats.sync_prompt");
  return (
    <Box className={`rounded-2xl border p-3 ${cardBg} ${borderColor}`}>
      <HStack className="items-center justify-between gap-2">
        <Text className="text-typography-700 dark:text-typography-200 text-sm flex-1">
          {prompt}
        </Text>
        <Button
          size="sm"
          className="rounded-xl bg-primary-500"
          onPress={onSync}
          isDisabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <HStack className="items-center gap-1">
              <Icon as={RefreshCw} size="xs" className="text-white" />
              <ButtonText className="text-white text-xs">
                {t("stats.sync_to_cloud")}
              </ButtonText>
            </HStack>
          )}
        </Button>
      </HStack>
    </Box>
  );
}

interface SummaryCardProps {
  summary: StatsSummary | undefined;
  isLoading: boolean;
  metric: StatMetric;
  unitSystem: UnitSystem;
  colorScheme: "light" | "dark";
  cardBg: string;
  borderColor: string;
  t: (key: string) => string;
}

function SummaryCard({
  summary,
  isLoading,
  metric,
  unitSystem,
  colorScheme,
  cardBg,
  borderColor,
  t,
}: Readonly<SummaryCardProps>) {
  const currentLabel = formatCurrentValue(
    summary?.currentValue ?? null,
    metric,
    unitSystem,
  );
  const trendLabel = formatTrend(summary?.trendPercent ?? null);
  const trendClass = trendColorClass(summary?.trendPercent ?? null);
  const chartData = (summary?.chartPoints ?? []).map((p) => ({
    value: p.value,
    label: format(new Date(p.date), "M/d"),
    dataPointText: "",
  }));
  const chartColor = colorScheme === "light" ? "#6366f1" : "#818cf8";
  const chartBg = colorScheme === "light" ? "#ffffff" : "#1e2d3d";
  const rulesColor = colorScheme === "light" ? "#e5e7eb" : "#374151";
  const axisColor = colorScheme === "light" ? "#d1d5db" : "#4b5563";
  const labelColor = colorScheme === "light" ? "#6b7280" : "#9ca3af";

  return (
    <Box
      className={`rounded-3xl border overflow-hidden ${cardBg} ${borderColor}`}
    >
      {isLoading ? (
        <Box className="h-48 items-center justify-center">
          <ActivityIndicator />
        </Box>
      ) : (
        <VStack className="p-4 gap-4">
          <HStack className="gap-3">
            <Box className="flex-1 rounded-2xl bg-background-50 dark:bg-background-800 p-3 gap-0.5">
              <Text className="text-typography-400 text-xs font-medium uppercase tracking-wide">
                {t("stats.current")}
              </Text>
              <Text className="text-typography-900 dark:text-white font-bold text-2xl">
                {currentLabel}
              </Text>
            </Box>
            <Box className="flex-1 rounded-2xl bg-background-50 dark:bg-background-800 p-3 gap-0.5">
              <Text className="text-typography-400 text-xs font-medium uppercase tracking-wide">
                {t("stats.trend")}
              </Text>
              <Text className={`font-bold text-2xl ${trendClass}`}>
                {trendLabel}
              </Text>
            </Box>
          </HStack>
          {chartData.length > 1 ? (
            <Box className="w-full overflow-hidden">
              <LineChart
                data={chartData}
                width={280}
                height={160}
                color={chartColor}
                thickness={2.5}
                curved
                hideDataPoints={chartData.length > 20}
                dataPointsColor={chartColor}
                startFillColor={chartColor}
                endFillColor={chartBg}
                startOpacity={0.3}
                endOpacity={0}
                areaChart
                hideYAxisText={false}
                rulesColor={rulesColor}
                rulesType="solid"
                xAxisColor={axisColor}
                yAxisColor="transparent"
                backgroundColor={chartBg}
                noOfSections={4}
                xAxisLabelTextStyle={{ color: labelColor, fontSize: 10 }}
                yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
              />
            </Box>
          ) : (
            <Box className="h-40 items-center justify-center">
              <Text className="text-typography-400 text-sm text-center">
                {t("stats.no_data")}
              </Text>
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
}

interface HistoryRowProps {
  stat: ProgressStat & { delta: number | null };
  metric: StatMetric;
  unitSystem: UnitSystem;
  cardBg: string;
  borderColor: string;
}

function HistoryRow({
  stat,
  metric,
  unitSystem,
  cardBg,
  borderColor,
}: Readonly<HistoryRowProps>) {
  const valueStr = formatStatValue(stat, metric, unitSystem);
  const deltaStr = formatDelta(stat.delta, metric, unitSystem);
  const isPositive = stat.delta !== null && stat.delta > 0;
  const showDelta = stat.delta !== null && stat.delta !== 0;
  const deltaBg = isPositive
    ? "bg-error-100 dark:bg-error-900"
    : "bg-success-100 dark:bg-success-900";
  const deltaText = isPositive
    ? "text-error-600 dark:text-error-300"
    : "text-success-600 dark:text-success-300";

  return (
    <Box className={`rounded-2xl border px-4 py-3 ${cardBg} ${borderColor}`}>
      <HStack className="items-center justify-between">
        <VStack className="gap-0.5">
          <Text className="text-typography-800 dark:text-typography-100 font-semibold text-sm">
            {format(new Date(stat.recordedDate), "EEE, MMM d yyyy")}
          </Text>
          <Text className="text-typography-500 text-xs">
            {format(new Date(stat.recordedDate), "MMMM yyyy")}
          </Text>
        </VStack>
        <HStack className="items-center gap-2">
          <Text className="text-typography-900 dark:text-white font-bold text-base">
            {valueStr}
          </Text>
          {showDelta && (
            <Box className={`px-2 py-0.5 rounded-full ${deltaBg}`}>
              <Text className={`text-xs font-semibold ${deltaText}`}>
                {deltaStr}
              </Text>
            </Box>
          )}
        </HStack>
      </HStack>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StatsTabView({
  myId,
  partnerId,
  partnerFirstName,
  partnerPrivacyOn,
  unitSystem,
  colorScheme,
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
  const cardBg = colorScheme === "light" ? "bg-white" : "bg-[#1e2d3d]";
  const borderColor =
    colorScheme === "light" ? "border-outline-100" : "border-outline-600";
  const metricOptions = [t("stats.weight"), t("stats.body_fat")];
  const selectedMetricLabel =
    metric === "weight" ? t("stats.weight") : t("stats.body_fat");

  useEffect(() => {
    if (target !== "mine") return;
    void (async () => {
      const granted = await HealthSyncService.requestPermissions();
      if (!granted) return;
      const entry = await HealthSyncService.getLatestWeightEntry();
      setSdkWeightEntry(entry);
    })();
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
        <Box
          className={`rounded-3xl border p-8 items-center justify-center bg-background-0 gap-3 ${borderColor}`}
        >
          <Box className="w-14 h-14 rounded-full bg-background-100 items-center justify-center">
            <Icon as={Lock} size="xl" className="text-typography-400" />
          </Box>
          <Text className="text-typography-400 text-sm text-center">
            {t("stats.privacy_blocked")}
          </Text>
        </Box>
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
          t={t}
          cardBg={cardBg}
          borderColor={borderColor}
        />
      )}

      <SummaryCard
        summary={summary}
        isLoading={summaryLoading}
        metric={metric}
        unitSystem={unitSystem}
        colorScheme={colorScheme}
        cardBg={cardBg}
        borderColor={borderColor}
        t={t}
      />

      <VStack className="gap-2">
        <Text className="text-typography-400 dark:text-typography-500 font-bold text-xs tracking-widest px-1">
          {t("stats.history")}
        </Text>

        {historyLoading && (
          <Box className="py-8 items-center">
            <ActivityIndicator />
          </Box>
        )}

        {!historyLoading && historyItems.length === 0 && (
          <Box
            className={`rounded-2xl border p-5 items-center ${cardBg} ${borderColor}`}
          >
            <Text className="text-typography-400 text-sm text-center">
              {t("stats.no_data")}
            </Text>
          </Box>
        )}

        {!historyLoading && historyItems.length > 0 && (
          <>
            {historyItems.map((stat) => (
              <HistoryRow
                key={stat.id}
                stat={stat}
                metric={metric}
                unitSystem={unitSystem}
                cardBg={cardBg}
                borderColor={borderColor}
              />
            ))}

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
      </VStack>
    </VStack>
  );
}
