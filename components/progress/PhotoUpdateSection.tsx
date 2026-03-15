import { Buffer } from "@craftzdog/react-native-buffer";
import { useQuery } from "@tanstack/react-query";
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
import {
  EncryptionMetadata,
  encryptionService,
} from "@/services/EncryptionService";
import { ProgressPhoto } from "@/types/progress";
import { supabase } from "@/util/supabase";

const BUCKET = "progress-photos";
const SIGNED_URL_TTL = 3600; // 60 min
const STALE_TIME = 55 * 60 * 1000; // 55 min — just under signed URL TTL

// ── Single decrypted photo card ───────────────────────────────────────────────

interface SinglePhotoCardProps {
  storagePath: string;
  metadata: EncryptionMetadata;
  viewerUserId: string;
  privateKey: string;
}

const SinglePhotoCard: React.FC<SinglePhotoCardProps> = ({
  storagePath,
  metadata,
  viewerUserId,
  privateKey,
}) => {
  const {
    data: localUri,
    isLoading,
    isError,
  } = useQuery<string>({
    queryKey: ["decrypted-photo", storagePath, viewerUserId],
    queryFn: async () => {
      const { data: signedData, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, SIGNED_URL_TTL);

      if (error ?? !signedData) {
        throw error ?? new Error("Failed to create signed download URL");
      }

      const resp = await fetch(signedData.signedUrl);
      const arrayBuf = await resp.arrayBuffer();
      const encryptedBase64 = Buffer.from(arrayBuf).toString("base64");

      return encryptionService.decryptImage(
        encryptedBase64,
        metadata,
        viewerUserId,
        privateKey,
      );
    },
    staleTime: STALE_TIME,
    enabled: !!storagePath && !!privateKey,
  });

  if (isLoading) {
    return (
      <Box className="w-full aspect-[3/4] rounded-2xl bg-background-100 items-center justify-center">
        <ActivityIndicator />
      </Box>
    );
  }

  if (isError || !localUri) {
    return (
      <Box className="w-full aspect-[3/4] rounded-2xl bg-background-100 items-center justify-center">
        <Text className="text-error-500 text-sm">Failed to decrypt image</Text>
      </Box>
    );
  }

  return (
    <Box className="w-full aspect-[3/4] rounded-2xl overflow-hidden">
      <Image
        source={{ uri: localUri }}
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
  viewerUserId: string;
  privateKey: string | null;
  colorScheme: "light" | "dark";
}

export const PhotoUpdateSection: React.FC<PhotoUpdateSectionProps> = ({
  sectionTitle,
  photo,
  isLoading,
  isPartner = false,
  partnerPrivacyOn = false,
  partnerFirstName,
  viewerUserId,
  privateKey,
  colorScheme,
}) => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<"front" | "side" | "back">(
    "front",
  );

  const cardBg = colorScheme === "light" ? "bg-white" : "bg-[#1e2d3d]";
  const borderColor =
    colorScheme === "light" ? "border-outline-100" : "border-outline-800";
  const inactiveViewBg =
    colorScheme === "light" ? "bg-background-100" : "bg-[#2a3d52]";

  // ── Partner privacy locked state ──────────────────────────────────────────
  if (isPartner && partnerPrivacyOn) {
    return (
      <Box
        className={`rounded-3xl border p-6 gap-3 items-center ${cardBg} ${borderColor}`}
      >
        <Text className="text-typography-700 font-semibold text-base self-start">
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

  // ── Resolve active photo metadata ─────────────────────────────────────────
  const getActivePhoto = (): {
    path: string;
    metadata: EncryptionMetadata;
  } | null => {
    if (photo === null) return null;
    switch (activeView) {
      case "front":
        return {
          path: photo.frontPhotoUrl,
          metadata: photo.frontPhotoMetadata,
        };
      case "side":
        return { path: photo.sidePhotoUrl, metadata: photo.sidePhotoMetadata };
      case "back":
        return { path: photo.backPhotoUrl, metadata: photo.backPhotoMetadata };
    }
  };

  const activePhoto = getActivePhoto();
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
    if (privateKey === null) {
      return (
        <Box className="w-full aspect-[3/4] rounded-2xl bg-background-100 items-center justify-center">
          <ActivityIndicator />
        </Box>
      );
    }
    if (activePhoto !== null) {
      return (
        <SinglePhotoCard
          storagePath={activePhoto.path}
          metadata={activePhoto.metadata}
          viewerUserId={viewerUserId}
          privateKey={privateKey}
        />
      );
    }
    return null;
  };

  return (
    <Box
      className={`rounded-3xl border overflow-hidden ${cardBg} ${borderColor}`}
    >
      {/* Header row */}
      <HStack className="px-4 pt-4 pb-2 items-center justify-between">
        <Text className="text-typography-700 font-semibold text-base">
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
