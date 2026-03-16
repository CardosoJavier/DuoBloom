import { Image } from "expo-image";
import { Lock } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { ProgressPhoto } from "@/types/progress";

// ── Single photo card ─────────────────────────────────────────────────────────

const PhotoCard: React.FC<{ storagePath: string }> = ({ storagePath }) => {
  const { signedUrl, isLoading } = useSignedUrl(storagePath, "user_media");

  if (isLoading) {
    return (
      <Box className="w-full aspect-[3/4] rounded-2xl bg-background-100 items-center justify-center">
        <ActivityIndicator />
      </Box>
    );
  }

  if (!signedUrl) {
    return (
      <Box className="w-full aspect-[3/4] rounded-2xl bg-background-100 items-center justify-center">
        <Text className="text-error-500 text-sm">Failed to load image</Text>
      </Box>
    );
  }

  return (
    <Box className="w-full aspect-[3/4] rounded-2xl overflow-hidden">
      <Image
        source={{ uri: signedUrl }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
    </Box>
  );
};

// ── Section component ─────────────────────────────────────────────────────────

export interface PhotoUpdateSectionProps {
  sectionTitle: string;
  photo: ProgressPhoto | null;
  isLoading: boolean;
  isPartner?: boolean;
  partnerPrivacyOn?: boolean;
  partnerFirstName?: string;
  colorScheme: "light" | "dark";
}

export const PhotoUpdateSection: React.FC<PhotoUpdateSectionProps> = ({
  sectionTitle,
  photo,
  isLoading,
  isPartner = false,
  partnerPrivacyOn = false,
  partnerFirstName,
  colorScheme,
}) => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<"front" | "side" | "back">(
    "front",
  );

  const cardBg = colorScheme === "light" ? "bg-white" : "bg-[#1e2d3d]";
  const borderColor =
    colorScheme === "light" ? "border-outline-100" : "border-outline-600";
  const inactiveViewBg =
    colorScheme === "light" ? "bg-background-100" : "bg-[#2a3d52]";

  // ── Partner privacy locked state ──────────────────────────────────────────
  if (isPartner && partnerPrivacyOn) {
    return (
      <Box
        className={`rounded-3xl border p-6 gap-3 items-center bg-background-0 ${borderColor}`}
      >
        <Text className="text-typography-700 font-semibold text-base self-start dark:text-typography-100">
          {sectionTitle}
        </Text>
        <Box className="w-14 h-14 rounded-full bg-background-100 items-center justify-center">
          <Icon as={Lock} size="xl" className="text-typography-400" />
        </Box>
        <Text className="text-typography-400 text-sm text-center">
          {t("progress.privacy_card_message")}
        </Text>
      </Box>
    );
  }

  // ── Resolve active storage path ───────────────────────────────────────────
  const getActivePath = (): string | null => {
    if (photo === null) return null;
    switch (activeView) {
      case "front":
        return photo.frontPhotoUrl;
      case "side":
        return photo.sidePhotoUrl;
      case "back":
        return photo.backPhotoUrl;
    }
  };

  const activePath = getActivePath();
  const views = ["front", "side", "back"] as const;

  // ── Render photo body ─────────────────────────────────────────────────────
  const renderPhotoContent = () => {
    if (isLoading) {
      return (
        <Box className="w-full aspect-[3/4] rounded-2xl bg-background-100 items-center justify-center">
          <ActivityIndicator />
        </Box>
      );
    }
    if (photo === null) {
      return (
        <Box className="w-full aspect-[3/4] rounded-2xl bg-background-100 items-center justify-center">
          <Text className="text-typography-400 text-sm text-center px-4">
            {isPartner
              ? t("progress.partner_no_photos", {
                  name: partnerFirstName ?? "Partner",
                })
              : t("progress.no_photos_today")}
          </Text>
        </Box>
      );
    }
    if (activePath !== null) {
      return <PhotoCard storagePath={activePath} />;
    }
    return null;
  };

  return (
    <Box
      className={`rounded-3xl border overflow-hidden bg-background-0 ${borderColor}`}
    >
      {/* Header row */}
      <HStack className="px-4 pt-4 pb-2 items-center justify-between">
        <Text className="text-typography-700 font-semibold text-base dark:text-typography-100">
          {sectionTitle}
        </Text>
        {photo !== null && (
          <HStack className="gap-1">
            {views.map((view) => (
              <Pressable
                key={view}
                onPress={() => setActiveView(view)}
                className={`px-3 py-1 rounded-full ${
                  activeView === view ? "bg-primary-500" : inactiveViewBg
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    activeView === view ? "text-white" : "text-typography-500"
                  }`}
                >
                  {t(`progress.${view}`)}
                </Text>
              </Pressable>
            ))}
          </HStack>
        )}
      </HStack>

      {/* Photo area */}
      <Box className="px-4 pb-4">
        {renderPhotoContent()}

        {/* Metrics row */}
        {photo !== null && (
          <HStack className="mt-3 gap-6 justify-center">
            {photo.weightKg !== null && (
              <VStack className="items-center">
                <Text className="text-typography-500 text-xs">
                  {t("progress.weight_kg")}
                </Text>
                <Text className="text-typography-900 font-semibold text-sm">
                  {photo.weightKg}
                </Text>
              </VStack>
            )}
            {photo.weightLb !== null && (
              <VStack className="items-center">
                <Text className="text-typography-500 text-xs">
                  {t("progress.weight_lb")}
                </Text>
                <Text className="text-typography-900 font-semibold text-sm">
                  {photo.weightLb}
                </Text>
              </VStack>
            )}
            {photo.bodyFat !== null && (
              <VStack className="items-center">
                <Text className="text-typography-500 text-xs">
                  {t("progress.body_fat")}
                </Text>
                <Text className="text-typography-900 font-semibold text-sm">
                  {photo.bodyFat}%
                </Text>
              </VStack>
            )}
          </HStack>
        )}
      </Box>
    </Box>
  );
};
