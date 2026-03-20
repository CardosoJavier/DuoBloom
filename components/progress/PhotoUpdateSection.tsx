import { Image } from "expo-image";
import { Lock } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";

import { Box } from "@/components/ui/box";
import { EmptyState } from "@/components/ui/empty-state";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { WidgetCard } from "@/components/ui/widget-card";
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
}

export const PhotoUpdateSection: React.FC<PhotoUpdateSectionProps> = ({
  sectionTitle,
  photo,
  isLoading,
  isPartner = false,
  partnerPrivacyOn = false,
  partnerFirstName,
}) => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<"front" | "side" | "back">(
    "front",
  );

  // ── Partner privacy locked state ──────────────────────────────────────────
  if (isPartner && partnerPrivacyOn) {
    return (
      <WidgetCard
        icon={<Icon as={Lock} size="sm" className="text-typography-400" />}
        title={sectionTitle}
      >
        <Box className="w-14 h-14 rounded-full bg-background-100 items-center justify-center self-center">
          <Icon as={Lock} size="xl" className="text-typography-400" />
        </Box>
        <Text className="text-typography-400 text-sm text-center">
          {t("progress.privacy_card_message")}
        </Text>
      </WidgetCard>
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
        <EmptyState
          message={
            isPartner
              ? t("progress.partner_no_photos", {
                  name: partnerFirstName ?? "Partner",
                })
              : t("progress.no_photos_today")
          }
        />
      );
    }
    if (activePath !== null) {
      return <PhotoCard storagePath={activePath} />;
    }
    return null;
  };

  const viewToggle =
    photo !== null ? (
      <HStack className="gap-1">
        {views.map((view) => (
          <Pressable
            key={view}
            onPress={() => setActiveView(view)}
            className={`px-3 py-1 rounded-full ${
              activeView === view
                ? "bg-primary-500"
                : "bg-background-100 dark:bg-[#2a3d52]"
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
    ) : undefined;

  return (
    <WidgetCard title={sectionTitle} headerRight={viewToggle}>
      {renderPhotoContent()}

      {/* Metrics row */}
      {photo !== null && (
        <HStack className="gap-6 justify-center">
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
    </WidgetCard>
  );
};
