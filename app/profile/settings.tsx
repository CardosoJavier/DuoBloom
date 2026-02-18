import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAppStore } from "@/store/appStore";
import { useRouter } from "expo-router";
import { Check, Globe, Monitor, Moon, Sun, X } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppSettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { theme, setTheme, language, setLanguage } = useAppStore();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <VStack className="flex-1 p-6" space="xl">
        {/* Header */}
        <HStack className="justify-between items-center">
          <HStack space="sm" className="items-center">
            <Icon as={Globe} className="text-white" />
            <Heading className="text-white text-xl">
              {t("profile.app_settings")}
            </Heading>
          </HStack>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon as={X} className="text-slate-400" />
          </TouchableOpacity>
        </HStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack space="2xl" className="mt-4">
            {/* Language */}
            <VStack space="md">
              <Text className="text-slate-400 font-medium text-xs uppercase tracking-wider ml-1">
                {t("settings.language")}
              </Text>
              <HStack space="md">
                <TouchableOpacity
                  onPress={() => setLanguage("en")}
                  className={`flex-1 p-4 rounded-xl border ${
                    language === "en"
                      ? "bg-indigo-500/20 border-indigo-500"
                      : "bg-slate-800 border-slate-700"
                  } flex-row justify-between items-center`}
                >
                  <Text
                    className={`${language === "en" ? "text-indigo-400 font-bold" : "text-slate-300"}`}
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
                    language === "es"                      ? "bg-indigo-500/20 border-indigo-500"
                      : "bg-slate-800 border-slate-700"
                  } flex-row justify-between items-center`}
                >
                  <Text
                    className={`${language === "es" ? "text-indigo-400 font-bold" : "text-slate-300"}`}
                  >
                    Español
                  </Text>
                  {language === "es" && (
                    <Icon as={Check} size="sm" className="text-indigo-400" />
                  )}
                </TouchableOpacity>
              </HStack>
            </VStack>

            {/* Appearance */}
            <VStack space="md">
              <Text className="text-slate-400 font-medium text-xs uppercase tracking-wider ml-1">
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
                    onPress={() => setTheme(item.id as any)}
                    className={`p-4 rounded-xl border ${
                      theme === item.id
                        ? "bg-indigo-500/20 border-indigo-500"
                        : "bg-slate-800 border-slate-700"
                    } flex-row justify-between items-center`}
                  >
                    <HStack space="md" className="items-center">
                      <Icon
                        as={item.icon}
                        size="sm"
                        className={`${theme === item.id ? "text-indigo-400" : "text-slate-400"}`}
                      />
                      <Text
                        className={`${theme === item.id ? "text-indigo-400 font-bold" : "text-slate-300"}`}
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
