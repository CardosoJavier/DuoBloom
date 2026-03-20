import { statsApi } from "@/api/stats-api";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { StatsSummary } from "@/types/progress";
import { UnitSystem } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface WeightTrendWidgetProps {
  readonly userId: string;
  readonly label: string;
  readonly unitSystem?: UnitSystem;
  readonly chartColor?: string;
}

function formatWeight(value: number | null, unit: UnitSystem): string {
  if (value === null) return "—";
  const suffix = unit === "LB" ? " lb" : " kg";
  return `${value.toFixed(1)}${suffix}`;
}

function TrendBadge({
  trendPercent,
}: {
  readonly trendPercent: number | null;
}) {
  if (trendPercent === null) return null;
  const isPositive = trendPercent > 0;
  const sign = isPositive ? "+" : "";
  const bgClass = isPositive
    ? "bg-error-100 dark:bg-error-900"
    : "bg-success-100 dark:bg-success-900";
  const textClass = isPositive
    ? "text-error-600 dark:text-error-300"
    : "text-success-600 dark:text-success-300";

  return (
    <Box className={`px-2 py-0.5 rounded-full self-start ${bgClass}`}>
      <Text className={`text-xs font-semibold ${textClass}`}>
        {sign}
        {trendPercent.toFixed(1)}%
      </Text>
    </Box>
  );
}

export function WeightTrendWidget({
  userId,
  label,
  unitSystem = "KG",
  chartColor = "#6366f1",
}: WeightTrendWidgetProps) {
  const { t } = useTranslation();
  const [chartWidth, setChartWidth] = useState(0);

  const { data: summary, isLoading } = useQuery<StatsSummary | null>({
    queryKey: ["stats-summary", userId, "weight", unitSystem],
    queryFn: async () => {
      const result = await statsApi.getStatsSummary(
        userId,
        "weight",
        unitSystem,
      );
      return result.success ? (result.data ?? null) : null;
    },
    enabled: !!userId,
  });

  const currentValue = summary?.currentValue ?? null;
  const trendPercent = summary?.trendPercent ?? null;
  const sparkData = (summary?.chartPoints ?? [])
    .slice(-20)
    .map((p) => ({ value: p.value }));

  return (
    <Box
      className="flex-1 rounded-[32px] border border-outline-100 dark:border-outline-800 bg-background-0 dark:bg-background-dark overflow-hidden"
      style={{ minHeight: 160 }}
    >
      <VStack className="p-5 gap-2 flex-1">
        <HStack className="items-center gap-1.5">
          <TrendingUp size={13} color="#9ca3af" />
          <Text className="text-typography-500 uppercase font-bold tracking-wider text-xs">
            {label}
          </Text>
        </HStack>
        {isLoading ? (
          <Box className="flex-1 items-center justify-center mt-4">
            <ActivityIndicator size="small" />
          </Box>
        ) : (
          <VStack className="gap-2 mt-1">
            <Text className="text-typography-900 dark:text-white font-bold text-2xl leading-tight">
              {currentValue === null
                ? t("today.no_weight_data")
                : formatWeight(currentValue, unitSystem)}
            </Text>
            <TrendBadge trendPercent={trendPercent} />
          </VStack>
        )}
      </VStack>
      {sparkData.length > 1 && (
        <Box
          style={{ height: 44 }}
          onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
        >
          {chartWidth > 0 && (
            <LineChart
              data={sparkData}
              width={chartWidth}
              height={44}
              color={chartColor}
              thickness={2}
              curved
              hideDataPoints
              areaChart
              startFillColor={chartColor}
              endFillColor="transparent"
              startOpacity={0.15}
              endOpacity={0}
              hideYAxisText
              yAxisColor="transparent"
              xAxisColor="transparent"
              rulesColor="transparent"
              backgroundColor="transparent"
              initialSpacing={0}
              endSpacing={0}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
