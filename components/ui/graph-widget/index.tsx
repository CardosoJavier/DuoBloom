import React from "react";
import { ActivityIndicator } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import { useAppStore } from "@/store/appStore";

import { Box } from "../box";
import { EmptyState } from "../empty-state";
import { HStack } from "../hstack";
import { Text } from "../text";
import { VStack } from "../vstack";
import { WidgetCard } from "../widget-card";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChartPoint {
  readonly value: number;
  readonly label: string;
}

export interface StatPanel {
  readonly title: string;
  readonly value: string;
  /** Tailwind class(es) applied to the value text. Defaults to neutral typography. */
  readonly valueClassName?: string;
}

export interface GraphWidgetProps {
  /** Shows a loading spinner instead of content when true. */
  readonly isLoading?: boolean;
  /** Data points for the line chart. Fewer than 2 points renders the empty state. */
  readonly chartData?: ChartPoint[];
  /**
   * Stat panels displayed in an HStack above the chart.
   * Each panel occupies equal width (flex-1).
   */
  readonly panels?: StatPanel[];
  /** Shown when there is insufficient chart data. */
  readonly emptyMessage?: string;
  /** Forwarded to WidgetCard as the header title. */
  readonly title?: string;
  /** Forwarded to WidgetCard as the header subtitle. */
  readonly subtitle?: string;
  readonly className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GraphWidget({
  isLoading = false,
  chartData = [],
  panels = [],
  emptyMessage = "No data yet",
  title,
  subtitle,
  className,
}: GraphWidgetProps) {
  const { colorScheme } = useAppStore();

  const chartColor = colorScheme === "light" ? "#6366f1" : "#818cf8";
  const chartBg = colorScheme === "light" ? "#ffffff" : "#1e2d3d";
  const rulesColor = colorScheme === "light" ? "#e5e7eb" : "#374151";
  const axisColor = colorScheme === "light" ? "#d1d5db" : "#4b5563";
  const labelColor = colorScheme === "light" ? "#6b7280" : "#9ca3af";

  const normalizedData = chartData.map((p) => ({
    value: p.value,
    label: p.label,
    dataPointText: "",
  }));

  return (
    <WidgetCard title={title} subtitle={subtitle} className={className}>
      {isLoading ? (
        <Box className="h-48 items-center justify-center">
          <ActivityIndicator />
        </Box>
      ) : (
        <VStack className="gap-4">
          {panels.length > 0 && (
            <HStack className="gap-3">
              {panels.map((panel) => (
                <Box
                  key={panel.title}
                  className="flex-1 rounded-2xl bg-background-50 dark:bg-background-100 p-3 gap-0.5"
                >
                  <Text className="text-typography-400 text-xs font-medium uppercase tracking-wide">
                    {panel.title}
                  </Text>
                  <Text
                    className={`font-bold text-2xl ${panel.valueClassName ?? "text-typography-900 dark:text-white"}`}
                  >
                    {panel.value}
                  </Text>
                </Box>
              ))}
            </HStack>
          )}

          {normalizedData.length > 1 ? (
            <Box className="w-full overflow-hidden">
              <LineChart
                data={normalizedData}
                width={280}
                height={160}
                color={chartColor}
                thickness={2.5}
                curved
                hideDataPoints={normalizedData.length > 20}
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
            <EmptyState message={emptyMessage} />
          )}
        </VStack>
      )}
    </WidgetCard>
  );
}
