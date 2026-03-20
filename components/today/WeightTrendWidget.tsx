import { statsApi } from "@/api/stats-api";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { WidgetCard } from "@/components/ui/widget-card";
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

  const sparkline =
    sparkData.length > 1 ? (
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
    ) : undefined;

  return (
    <WidgetCard
      icon={<TrendingUp size={13} color="#9ca3af" />}
      title={label}
      className="flex-1"
      style={{ minHeight: 160 }}
      footer={sparkline}
    >
      {isLoading ? (
        <Box className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" />
        </Box>
      ) : (
        <VStack className="gap-2">
          <Text className="text-typography-900 dark:text-white font-bold text-xl leading-tight">
            {currentValue === null
              ? t("today.no_weight_data")
              : formatWeight(currentValue, unitSystem)}
          </Text>
          <TrendBadge trendPercent={trendPercent} />
        </VStack>
      )}
    </WidgetCard>
  );
}
