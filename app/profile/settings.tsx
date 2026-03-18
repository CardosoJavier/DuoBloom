import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Check,
  Globe,
  Monitor,
  Moon,
  Scale,
  Sun,
  X,
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { progressApi } from "@/api/progress-api";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
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
            {/* Language */}
            <VStack space="md">
              <Text className="text-typography-500 font-medium text-xs uppercase tracking-wider ml-1">
                {t("settings.language")}
              </Text>
              <HStack space="md">
                <TouchableOpacity
                  onPress={() => setLanguage("en")}
                  className={`flex-1 p-4 rounded-xl border ${
                    language === "en"
                      ? "bg-indigo-500/20 border-indigo-500"
                      : "bg-background-50 border-outline-200"
                  } flex-row justify-between items-center`}
                >
                  <Text
                    className={`${language === "en" ? "text-indigo-400 font-bold" : "text-typography-700"}`}
                  >
                    English
                  </Text>
                  {language === "en" && (
                    <Icon as={Check} size="sm" className="text-indigo-400" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setLanguage("es")}
                  className={`flex-1 p-4 rounded-xl border ${
                    language === "es"
                      ? "bg-indigo-500/20 border-indigo-500"
                      : "bg-background-50 border-outline-200"
                  } flex-row justify-between items-center`}
                >
                  <Text
                    className={`${language === "es" ? "text-indigo-400 font-bold" : "text-typography-700"}`}
                  >
                    Español
                  </Text>
                  {language === "es" && (
                    <Icon as={Check} size="sm" className="text-indigo-400" />
                  )}
                </TouchableOpacity>
              </HStack>
            </VStack>

            {/* Units */}
            <VStack space="md">
              <HStack space="sm" className="items-center ml-1">
                <Icon as={Scale} size="xs" className="text-typography-500" />
                <Text className="text-typography-500 font-medium text-xs uppercase tracking-wider">
                  {t("settings.unit_system")}
                </Text>
              </HStack>
              <HStack space="md">
                {(["KG", "LB"] as UnitSystem[]).map((unit) => {
                  const isActive = activeUnit === unit;
                  return (
                    <TouchableOpacity
                      key={unit}
                      onPress={() => unitMutation.mutate(unit)}
                      className={`flex-1 p-4 rounded-xl border ${
                        isActive
                          ? "bg-indigo-500/20 border-indigo-500"
                          : "bg-background-50 border-outline-200"
                      } flex-row justify-between items-center`}
                    >
                      <Text
                        className={`${isActive ? "text-indigo-400 font-bold" : "text-typography-700"}`}
                      >
                        {t(`settings.unit_${unit.toLowerCase()}`)}
                      </Text>
                      {isActive && (
                        <Icon
                          as={Check}
                          size="sm"
                          className="text-indigo-400"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </HStack>
            </VStack>

            {/* Appearance */}
            <VStack space="md">
              <Text className="text-typography-500 font-medium text-xs uppercase tracking-wider ml-1">
                {t("settings.appearance")}
              </Text>

              <VStack space="sm">
                {[
                  { id: "light", icon: Sun, label: t("settings.light_mode") },
                  { id: "dark", icon: Moon, label: t("settings.dark_mode") },
                  {
                    id: "system",
                    icon: Monitor,
                    label: t("settings.system_default"),
                  },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() =>
                      setTheme(item.id as "light" | "dark" | "system")
                    }
                    className={`p-4 rounded-xl border ${
                      theme === item.id
                        ? "bg-indigo-500/20 border-indigo-500"
                        : "bg-background-50 border-outline-200"
                    } flex-row justify-between items-center`}
                  >
                    <HStack space="md" className="items-center">
                      <Icon
                        as={item.icon}
                        size="sm"
                        className={`${theme === item.id ? "text-indigo-400" : "text-typography-500"}`}
                      />
                      <Text
                        className={`${theme === item.id ? "text-indigo-400 font-bold" : "text-typography-700"}`}
                      >
                        {item.label}
                      </Text>
                    </HStack>
                    {theme === item.id && (
                      <Icon as={Check} size="sm" className="text-indigo-400" />
                    )}
                  </TouchableOpacity>
                ))}
              </VStack>
            </VStack>
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
}
