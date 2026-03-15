import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { progressApi } from "@/api/progress-api";
import { DateNavigator } from "@/components/DateNavigator";
import { SegmentedControl } from "@/components/SegmentedControl";
import { AddProgressModal } from "@/components/progress/AddProgressModal";
import { PhotoUpdateSection } from "@/components/progress/PhotoUpdateSection";
import { Box } from "@/components/ui/box";
import { Fab, FabIcon } from "@/components/ui/fab";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { ProgressPhotoInput } from "@/types/progress";

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { user, partner } = useAuthStore();
  const { colorScheme } = useAppStore();
  const queryClient = useQueryClient();
  const toast = useAppToast();

  const tabPhotos = t("progress.tab_photos");
  const tabStats = t("progress.tab_stats");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState(tabPhotos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const todayFlag = isToday(selectedDate);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: myPhotos = [], isLoading: myPhotosLoading } = useQuery({
    queryKey: ["progress-photos", user?.id, dateStr],
    queryFn: async () => {
      const result = await progressApi.getProgressPhotosForDate(
        user!.id,
        dateStr,
      );
      if (!result.success) throw result.error;
      return result.data;
    },
    enabled: !!user,
  });

  const { data: partnerPhotos = [], isLoading: partnerPhotosLoading } =
    useQuery({
      queryKey: ["progress-photos", partner?.id, dateStr],
      queryFn: async () => {
        const result = await progressApi.getProgressPhotosForDate(
          partner!.id,
          dateStr,
        );
        if (!result.success) throw result.error;
        return result.data;
      },
      enabled: !!partner,
    });

  const { data: mySettings } = useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      const result = await progressApi.getSettings(user!.id);
      if (!result.success) throw result.error;
      return result.data;
    },
    enabled: !!user,
  });

  const { data: partnerSettings } = useQuery({
    queryKey: ["user-settings", partner?.id],
    queryFn: async () => {
      const result = await progressApi.getSettings(partner!.id);
      if (!result.success) throw result.error;
      return result.data;
    },
    enabled: !!partner,
  });

  // Sync local toggle state with the server value
  useEffect(() => {
    if (mySettings != null) setPrivacyMode(mySettings.privacyMode);
  }, [mySettings]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePrivacyToggle = async (newValue: boolean) => {
    setPrivacyMode(newValue); // optimistic update
    const result = await progressApi.updatePrivacyMode(user!.id, newValue);
    if (result.success) {
      queryClient.setQueryData(["user-settings", user?.id], result.data);
      toast.info(
        newValue
          ? t("progress.privacy_enabled")
          : t("progress.privacy_disabled"),
      );
    } else {
      setPrivacyMode(!newValue); // revert
      toast.error(t("progress.privacy_update_error"));
    }
  };

  const handleUpload = async (input: ProgressPhotoInput) => {
    if (!user) return;
    setIsSaving(true);
    const result = await progressApi.uploadProgressUpdate(user.id, input);
    setIsSaving(false);

    if (result.success) {
      queryClient.invalidateQueries({
        queryKey: ["progress-photos", user.id, dateStr],
      });
      toast.success(t("progress.upload_success"));
      setIsModalOpen(false);
      return;
    }

    toast.error(t("progress.upload_error"));
  };

  // ── Theme helpers ──────────────────────────────────────────────────────────

  const cardBg = colorScheme === "light" ? "bg-white" : "bg-[#1e2d3d]";
  const borderColor =
    colorScheme === "light" ? "border-outline-100" : "border-outline-800";

  const latestMyPhoto = myPhotos[0] ?? null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-background-0" edges={["top"]}>
      <VStack className="flex-1">
        {/* Header controls */}
        <VStack className="px-5 pt-4 pb-3 gap-3">
          <SegmentedControl
            options={[tabPhotos, tabStats]}
            selectedValue={activeTab}
            onValueChange={setActiveTab}
          />
          <DateNavigator
            date={selectedDate}
            onDateChange={setSelectedDate}
            disableNext={todayFlag}
            textSize="sm"
          />
        </VStack>

        {/* Scrollable content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Photos tab ── */}
          {activeTab === tabPhotos && (
            <View style={{ gap: 16 }}>
              {/* Privacy toggle card */}
              <Box
                className={`rounded-3xl border p-4 ${cardBg} ${borderColor}`}
              >
                <HStack className="items-center justify-between">
                  <Text className="text-typography-800 font-semibold text-sm flex-1 mr-4">
                    {t("progress.privacy_toggle_label")}
                  </Text>
                  <Switch
                    value={privacyMode}
                    onValueChange={handlePrivacyToggle}
                    trackColor={{ false: "#767577", true: "#4f46e5" }}
                    thumbColor="#ffffff"
                  />
                </HStack>
              </Box>

              {/* My photos */}
              <PhotoUpdateSection
                sectionTitle={t("progress.your_photos")}
                photo={latestMyPhoto}
                isLoading={myPhotosLoading}
                colorScheme={colorScheme}
              />

              {/* Partner photos */}
              {partner && (
                <PhotoUpdateSection
                  sectionTitle={t("progress.partner_photos", {
                    name: partner.firstName ?? "Partner",
                  })}
                  photo={partnerPhotos[0] ?? null}
                  isLoading={partnerPhotosLoading}
                  isPartner
                  partnerPrivacyOn={partnerSettings?.privacyMode ?? false}
                  partnerFirstName={partner.firstName ?? "Partner"}
                  colorScheme={colorScheme}
                />
              )}
            </View>
          )}

          {/* ── Stats tab ── */}
          {activeTab === tabStats && (
            <View style={{ gap: 16 }}>
              <Box
                className={`rounded-3xl border p-5 ${cardBg} ${borderColor}`}
              >
                <Text className="text-typography-700 font-semibold text-base mb-4">
                  {t("progress.your_photos")}
                </Text>
                {latestMyPhoto ? (
                  <HStack className="gap-8 justify-center">
                    {latestMyPhoto.weightKg !== null && (
                      <VStack className="items-center">
                        <Text className="text-typography-500 text-xs mb-1">
                          {t("progress.weight_kg")}
                        </Text>
                        <Text className="text-typography-900 font-bold text-2xl">
                          {latestMyPhoto.weightKg}
                        </Text>
                      </VStack>
                    )}
                    {latestMyPhoto.weightLb !== null && (
                      <VStack className="items-center">
                        <Text className="text-typography-500 text-xs mb-1">
                          {t("progress.weight_lb")}
                        </Text>
                        <Text className="text-typography-900 font-bold text-2xl">
                          {latestMyPhoto.weightLb}
                        </Text>
                      </VStack>
                    )}
                    {latestMyPhoto.bodyFat !== null && (
                      <VStack className="items-center">
                        <Text className="text-typography-500 text-xs mb-1">
                          {t("progress.body_fat")}
                        </Text>
                        <Text className="text-typography-900 font-bold text-2xl">
                          {latestMyPhoto.bodyFat}%
                        </Text>
                      </VStack>
                    )}
                  </HStack>
                ) : (
                  <Text className="text-typography-400 text-sm text-center">
                    {t("progress.no_photos_today")}
                  </Text>
                )}
              </Box>
            </View>
          )}
        </ScrollView>

        {/* FAB */}
        <Fab
          size="lg"
          placement="bottom right"
          className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 shadow-lg absolute bottom-6 right-6"
          onPress={() => setIsModalOpen(true)}
        >
          <FabIcon as={Plus} className="text-white" />
        </Fab>
      </VStack>

      <AddProgressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUpload}
        capturedDate={dateStr}
        isSaving={isSaving}
      />
    </SafeAreaView>
  );
}
