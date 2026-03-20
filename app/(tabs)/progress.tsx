import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { Columns2, LayoutGrid, Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { progressApi } from "@/api/progress-api";
import { statsApi } from "@/api/stats-api";
import { DateNavigator } from "@/components/DateNavigator";
import { SegmentedControl } from "@/components/SegmentedControl";
import { AddProgressModal } from "@/components/progress/AddProgressModal";
import { AddStatsModal } from "@/components/progress/AddStatsModal";
import { ComparisonView } from "@/components/progress/ComparisonView";
import { PhotoUpdateSection } from "@/components/progress/PhotoUpdateSection";
import { StatsTabView } from "@/components/progress/StatsTabView";
import { Fab, FabIcon } from "@/components/ui/fab";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { WidgetCard } from "@/components/ui/widget-card";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { ProgressPhotoInput, ProgressStatInput } from "@/types/progress";

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { user, partner } = useAuthStore();
  const { colorScheme } = useAppStore();
  const queryClient = useQueryClient();
  const toast = useAppToast();

  const tabPhotos = t("progress.tab_photos");
  const tabStats = t("progress.tab_stats");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"photos" | "stats">("photos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<"gallery" | "comparison">(
    "gallery",
  );

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
    console.log(
      "[ProgressScreen.handlePrivacyToggle] toggled →",
      newValue,
      "userId:",
      user?.id,
    );
    setPrivacyMode(newValue); // optimistic update
    const result = await progressApi.updatePrivacyMode(user!.id, newValue);
    if (result.success) {
      console.log(
        "[ProgressScreen.handlePrivacyToggle] Success — privacyMode:",
        result.data.privacyMode,
      );
      queryClient.setQueryData(["user-settings", user?.id], result.data);
      toast.info(
        newValue
          ? t("progress.privacy_enabled")
          : t("progress.privacy_disabled"),
      );
    } else {
      console.error(
        "[ProgressScreen.handlePrivacyToggle] Error:",
        result.error?.message,
      );
      setPrivacyMode(!newValue); // revert
      toast.error(t("progress.privacy_update_error"));
    }
  };

  const handleUpload = async (input: ProgressPhotoInput) => {
    if (!user) return;
    console.log(
      "[ProgressScreen.handleUpload] Uploading for userId:",
      user.id,
      "date:",
      input.capturedDate,
    );
    setIsSaving(true);
    const result = await progressApi.uploadProgressUpdate(user.id, input);
    setIsSaving(false);

    if (result.success) {
      console.log(
        "[ProgressScreen.handleUpload] Success — photoId:",
        result.data.id,
      );
      queryClient.invalidateQueries({
        queryKey: ["progress-photos", user.id, dateStr],
      });
      toast.success(t("progress.upload_success"));
      setIsModalOpen(false);
      return;
    }

    console.error(
      "[ProgressScreen.handleUpload] Error:",
      result.error?.message,
    );
    toast.error(t("progress.upload_error"));
  };

  const handleRefresh = async () => {
    console.log("[ProgressScreen.handleRefresh] Pulling to refresh...");
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["progress-photos"] }),
      queryClient.invalidateQueries({ queryKey: ["user-settings"] }),
      queryClient.invalidateQueries({ queryKey: ["stats-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["stats-history"] }),
    ]);
    setIsRefreshing(false);
    console.log("[ProgressScreen.handleRefresh] Done");
  };

  const handleStatsSave = async (input: ProgressStatInput) => {
    if (!user) return;
    setIsSavingStats(true);
    const result = await statsApi.insertStat(user.id, input);
    setIsSavingStats(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["stats-summary", user.id] });
      queryClient.invalidateQueries({ queryKey: ["stats-history", user.id] });
      toast.success(t("stats.save_success"));
      setIsStatsModalOpen(false);
    } else {
      toast.error(t("stats.save_error"));
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const unitSystem = mySettings?.preferredUnitSystem ?? "KG";
  const latestMyPhoto = myPhotos[0] ?? null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-background-0" edges={["top"]}>
      <VStack className="flex-1">
        {/* Header controls */}
        <VStack className="px-5 pt-4 pb-3 gap-3">
          {/* Title row with view toggle */}
          <HStack className="items-center justify-between">
            <Text className="text-typography-900 dark:text-typography-100 font-bold text-xl">
              {activeView === "gallery"
                ? t("progress.photo_gallery")
                : t("progress.comparison")}
            </Text>
            <HStack className="gap-2">
              <Pressable
                onPress={() => setActiveView("gallery")}
                className="w-9 h-9 rounded-full items-center justify-center"
              >
                <Icon
                  as={LayoutGrid}
                  size="md"
                  className={
                    activeView === "gallery"
                      ? "text-primary-500"
                      : "text-typography-400"
                  }
                />
              </Pressable>
              <Pressable
                onPress={() => setActiveView("comparison")}
                className="w-9 h-9 rounded-full items-center justify-center"
              >
                <Icon
                  as={Columns2}
                  size="md"
                  className={
                    activeView === "comparison"
                      ? "text-primary-500"
                      : "text-typography-400"
                  }
                />
              </Pressable>
            </HStack>
          </HStack>

          {/* Gallery-only sub-controls */}
          {activeView === "gallery" && (
            <>
              <SegmentedControl
                options={[tabPhotos, tabStats]}
                selectedValue={activeTab === "photos" ? tabPhotos : tabStats}
                onValueChange={(value) =>
                  setActiveTab(value === tabPhotos ? "photos" : "stats")
                }
              />
              {activeTab === "photos" && (
                <DateNavigator
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  disableNext={todayFlag}
                  textSize="sm"
                />
              )}
            </>
          )}
        </VStack>

        {/* Scrollable content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {/* ── Photos tab ── */}
          {activeView === "comparison" && (
            <ComparisonView
              myId={user!.id}
              myFirstName={user?.firstName ?? "Me"}
              partnerId={partner?.id}
              partnerFirstName={partner?.firstName}
              partnerPrivacyOn={partnerSettings?.privacyMode ?? false}
              colorScheme={colorScheme}
            />
          )}

          {/* ── Gallery tab ── */}
          {activeView === "gallery" && activeTab === "photos" && (
            <View style={{ gap: 16 }}>
              {/* Privacy toggle card */}
              <WidgetCard>
                <HStack className="items-center justify-between">
                  <Text className="text-typography-800 font-semibold text-sm flex-1 mr-4 dark:text-typography-100">
                    {t("progress.privacy_toggle_label")}
                  </Text>
                  <Switch
                    value={privacyMode}
                    onValueChange={handlePrivacyToggle}
                    trackColor={{ false: "#767577", true: "#4f46e5" }}
                    thumbColor="#ffffff"
                  />
                </HStack>
              </WidgetCard>

              {/* My photos */}
              <PhotoUpdateSection
                sectionTitle={t("progress.your_photos")}
                photo={latestMyPhoto}
                isLoading={myPhotosLoading}
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
                />
              )}
            </View>
          )}

          {/* ── Stats tab ── */}
          {activeView === "gallery" && activeTab === "stats" && (
            <StatsTabView
              myId={user!.id}
              myFirstName={user?.firstName ?? "Me"}
              partnerId={partner?.id}
              partnerFirstName={partner?.firstName}
              partnerPrivacyOn={partnerSettings?.privacyMode ?? false}
              unitSystem={unitSystem}
              colorScheme={colorScheme}
            />
          )}
        </ScrollView>

        {/* FAB — photos tab */}
        {activeView === "gallery" && activeTab === "photos" && (
          <Fab
            size="lg"
            placement="bottom right"
            className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 shadow-lg absolute bottom-6 right-6"
            onPress={() => setIsModalOpen(true)}
          >
            <FabIcon as={Plus} className="text-white" />
          </Fab>
        )}

        {/* FAB — stats tab */}
        {activeView === "gallery" && activeTab === "stats" && (
          <Fab
            size="lg"
            placement="bottom right"
            className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 shadow-lg absolute bottom-6 right-6"
            onPress={() => setIsStatsModalOpen(true)}
          >
            <FabIcon as={Plus} className="text-white" />
          </Fab>
        )}
      </VStack>

      <AddProgressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUpload}
        capturedDate={dateStr}
        isSaving={isSaving}
      />

      <AddStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        onSave={handleStatsSave}
        isSaving={isSavingStats}
        defaultDate={dateStr}
      />
    </SafeAreaView>
  );
}
