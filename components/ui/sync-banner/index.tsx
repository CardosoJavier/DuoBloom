import { RefreshCw } from "lucide-react-native";
import React from "react";
import { ActivityIndicator } from "react-native";

import { Box } from "../box";
import { Button, ButtonText } from "../button";
import { HStack } from "../hstack";
import { Icon } from "../icon";
import { Text } from "../text";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SyncBannerProps {
  readonly isSyncing: boolean;
  readonly onSync: () => void;
  /** Pre-translated prompt message shown on the left. */
  readonly prompt: string;
  /** Pre-translated label for the sync button. */
  readonly syncLabel: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SyncBanner({
  isSyncing,
  onSync,
  prompt,
  syncLabel,
}: SyncBannerProps) {
  return (
    <Box className="rounded-2xl border p-3 bg-background-100 dark:bg-background-800 border-outline-200 dark:border-outline-700">
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
                {syncLabel}
              </ButtonText>
            </HStack>
          )}
        </Button>
      </HStack>
    </Box>
  );
}
