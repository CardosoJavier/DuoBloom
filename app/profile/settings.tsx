import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Globe, Monitor, Moon, Scale, Sun, X } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { progressApi } from "@/api/progress-api";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { SelectionGroup } from "@/components/ui/selection-group";
import { VStack } from "@/components/ui/vstack";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { UnitSystem } from "@/types/user";

export default function AppSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, setTheme, language, setLanguage } = useAppStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useAppToast();

  // ── Unit system ────────────────────────────────────────────────────────────

  const { data: userSettings } = useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      const result = await progressApi.getSettings(user!.id);
      if (!result.success) throw result.error;
      return result.data;
    },
    enabled: !!user,
  });

  const unitMutation = useMutation({
    mutationFn: (unitSystem: UnitSystem) =>
      progressApi.updateUnitSystem(user!.id, unitSystem),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["user-settings", user?.id],
      });
      toast.success(t("settings.unit_system_saved"));
    },
    onError: () => {
      toast.error(t("settings.unit_system_error"));
    },
  });

  const activeUnit = userSettings?.preferredUnitSystem ?? "KG";

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <VStack className="flex-1 p-6" space="xl">
        {/* Header */}
        <HStack className="justify-between items-center">
          <HStack space="sm" className="items-center">
            <Icon
              as={Globe}
              className="text-typography-900 dark:text-typography-0"
            />
            <Heading className="text-typography-900 dark:text-typography-0 text-xl">
              {t("profile.app_settings")}
            </Heading>
          </HStack>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon as={X} className="text-typography-500" />
          </TouchableOpacity>
        </HStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack space="2xl" className="mt-4">
            <SelectionGroup
              title={t("settings.language")}
              options={[
                { id: "en", label: "English" },
                { id: "es", label: "Español" },
              ]}
              selected={language}
              onSelect={(id) => setLanguage(id as "en" | "es")}
              direction="horizontal"
            />

            <SelectionGroup
              title={t("settings.unit_system")}
              titleIcon={Scale}
              options={[
                { id: "KG", label: t("settings.unit_kg") },
                { id: "LB", label: t("settings.unit_lb") },
              ]}
              selected={activeUnit}
              onSelect={(unit) => unitMutation.mutate(unit as UnitSystem)}
              direction="horizontal"
            />

            <SelectionGroup
              title={t("settings.appearance")}
              options={[
                { id: "light", icon: Sun, label: t("settings.light_mode") },
                { id: "dark", icon: Moon, label: t("settings.dark_mode") },
                {
                  id: "system",
                  icon: Monitor,
                  label: t("settings.system_default"),
                },
              ]}
              selected={theme}
              onSelect={(id) => setTheme(id as "light" | "dark" | "system")}
              direction="vertical"
            />
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
}
