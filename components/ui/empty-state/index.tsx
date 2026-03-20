import React from "react";
import { Box } from "../box";
import { Text } from "../text";
import { VStack } from "../vstack";

interface EmptyStateProps {
  readonly message: string;
  readonly icon?: React.ReactNode;
  readonly className?: string;
}

export function EmptyState({ message, icon, className }: EmptyStateProps) {
  const base = "bg-background-100 rounded-2xl p-4 items-center justify-center";
  const combined = className ? `${base} ${className}` : base;

  return (
    <Box className={combined}>
      {icon ? (
        <VStack className="items-center gap-2">
          {icon}
          <Text className="text-typography-500 text-center text-sm">
            {message}
          </Text>
        </VStack>
      ) : (
        <Text className="text-typography-500 text-center text-sm">
          {message}
        </Text>
      )}
    </Box>
  );
}
