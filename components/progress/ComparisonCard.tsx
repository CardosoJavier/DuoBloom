import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSignedUrl } from "@/hooks/useSignedUrl";

// ── Single image card ──────────────────────────────────────────────────────────

interface ComparisonImageCardProps {
  storagePath: string | null;
  badge: string;
  badgeStyle: "before" | "after";
  isContainerLoading: boolean;
}

const ComparisonImageCard: React.FC<ComparisonImageCardProps> = ({
  storagePath,
  badge,
  badgeStyle,
  isContainerLoading,
}) => {
  const { t } = useTranslation();
  const { signedUrl, isLoading: isSigning } = useSignedUrl(
    storagePath,
    "user_media",
  );

  const isLoading = isContainerLoading || isSigning;

  return (
    <Box className="flex-1 aspect-[3/4] rounded-2xl overflow-hidden bg-background-100">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : signedUrl ? (
        <>
          <Image
            source={{ uri: signedUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          {/* Badge overlay */}
          <View className="absolute top-2 left-2">
            <Box
              className={`px-2 py-0.5 rounded-full ${
                badgeStyle === "before" ? "bg-[#1a1a2e]" : "bg-primary-500"
              }`}
            >
              <Text className="text-white text-xs font-medium">{badge}</Text>
            </Box>
          </View>
        </>
      ) : (
        <View className="flex-1 items-center justify-center px-3">
          <Text className="text-typography-400 text-xs text-center">
            {t("progress.no_photo_for_date")}
          </Text>
        </View>
      )}
    </Box>
  );
};

// ── ComparisonCard ─────────────────────────────────────────────────────────────

export interface ComparisonCardProps {
  viewLabel: string;
  beforePath: string | null;
  afterPath: string | null;
  isLoading: boolean;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  viewLabel,
  beforePath,
  afterPath,
  isLoading,
}) => {
  const { t } = useTranslation();

  return (
    <VStack className="gap-2">
      <Text className="text-typography-500 text-xs font-semibold text-center tracking-wider">
        {viewLabel}
      </Text>
      <HStack className="gap-2">
        <ComparisonImageCard
          storagePath={beforePath}
          badge={t("progress.before")}
          badgeStyle="before"
          isContainerLoading={isLoading}
        />
        <ComparisonImageCard
          storagePath={afterPath}
          badge={t("progress.after")}
          badgeStyle="after"
          isContainerLoading={isLoading}
        />
      </HStack>
    </VStack>
  );
};
