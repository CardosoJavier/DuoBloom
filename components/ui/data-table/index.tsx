import React from "react";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

// ── DataTableRow ──────────────────────────────────────────────────────────────

export interface DataTableRowProps {
  readonly label: string;
  readonly sublabel?: string;
  readonly value: string;
  /** Pre-formatted delta string, e.g. "+0.5 kg". Omit to hide badge. */
  readonly delta?: string;
  /** true → green badge, false → red badge */
  readonly deltaPositive?: boolean;
}

export function DataTableRow({
  label,
  sublabel,
  value,
  delta,
  deltaPositive,
}: DataTableRowProps) {
  const deltaBg = deltaPositive
    ? "bg-success-100 dark:bg-success-900"
    : "bg-error-100 dark:bg-error-900";
  const deltaText = deltaPositive
    ? "text-success-600 dark:text-success-300"
    : "text-error-600 dark:text-error-300";

  return (
    <Box className="bg-background-50 dark:bg-background-100 rounded-2xl px-4 py-3">
      <HStack className="items-center justify-between">
        <VStack className="gap-0.5">
          <Text className="text-typography-800 dark:text-typography-100 font-semibold text-sm">
            {label}
          </Text>
          {!!sublabel && (
            <Text className="text-typography-500 text-xs">{sublabel}</Text>
          )}
        </VStack>
        <HStack className="items-center gap-2">
          <Text className="text-typography-900 dark:text-white font-bold text-base">
            {value}
          </Text>
          {delta !== undefined && (
            <Box className={`px-2 py-0.5 rounded-full ${deltaBg}`}>
              <Text className={`text-xs font-semibold ${deltaText}`}>
                {delta}
              </Text>
            </Box>
          )}
        </HStack>
      </HStack>
    </Box>
  );
}

// ── DataTable ─────────────────────────────────────────────────────────────────

export interface DataTableProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <VStack className={className ? `gap-2 ${className}` : "gap-2"}>
      {children}
    </VStack>
  );
}
