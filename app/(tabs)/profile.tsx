import { userApi } from "@/api/user-api";
import { EditProfileModal } from "@/components/profile/edit";
import { AppSettingsModal } from "@/components/profile/settings";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { WidgetCard } from "@/components/ui/widget-card";
import { useAuthStore } from "@/store/authStore";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Copy,
  Heart,
  Link as LinkIcon,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, logout, partner, setPartner } = useAuthStore();
  const { t } = useTranslation();
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const refetchPartner = async () => {
      if (!partner) {
        console.warn("Fetching missing partner info");

        const partnerInfo = await userApi.fetchPartner(user?.id ?? "");

        if (partnerInfo.success && partnerInfo.data) {
          console.log(
            "Success fetching partner info: ",
            partnerInfo.data.firstName,
          );
          setPartner(partnerInfo.data);
        } else {
          console.log("Error fetching partner info: ", partnerInfo.error);
        }
      }
    };

    refetchPartner();
  }, [user?.id, partner]);

  const copyToClipboard = async () => {
    if (user?.pairCode) {
      await Clipboard.setStringAsync(user.pairCode);
      Alert.alert(t("common.success"), t("auth.code_copied"));
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <VStack space="xl" className="p-6">
          {/* Header Profile */}
          <VStack className="items-center" space="md">
            <Box className="relative">
              <Box className="h-24 w-24 rounded-full bg-background-100 items-center justify-center border-4 border-background-0">
                <Icon as={User} size="xl" className="text-typography-400" />
              </Box>
              <Box className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-green-500 border-4 border-background-0" />
            </Box>
            <VStack className="items-center">
              <Heading
                size="xl"
                className="text-typography-900 dark:text-typography-100"
              >
                {user.firstName} {user.lastName}
              </Heading>
              <Text className="text-typography-500">
                {t("profile.member_since", {
                  year: new Date(user.createdAt).getFullYear(),
                })}
              </Text>
            </VStack>
          </VStack>

          {/* Partner Code */}
          <WidgetCard>
            <VStack space="md" className="items-center">
              <Text className="text-typography-400 font-medium tracking-wider text-xs uppercase">
                {t("auth.partner_code")}
              </Text>
              <HStack space="md" className="w-full items-center">
                <Box className="flex-1 bg-background-100 p-4 rounded-xl items-center justify-center">
                  <Text className="text-typography-900 dark:text-typography-0 text-xl font-mono font-bold tracking-widest">
                    {user.pairCode}
                  </Text>
                </Box>
                <Button
                  variant="solid"
                  action="secondary"
                  className="bg-white h-14 w-14 rounded-xl items-center justify-center p-0"
                  onPress={copyToClipboard}
                >
                  <ButtonIcon as={Copy} className="text-typography-950" />
                </Button>
              </HStack>
              <Text className="text-typography-500 text-center text-sm">
                {t("auth.share_code_description")}
              </Text>
            </VStack>
          </WidgetCard>

          {/* Partner Status */}
          <WidgetCard>
            <HStack className="items-center justify-between">
              <HStack space="md" className="items-center">
                <Box className="relative">
                  <Box className="h-12 w-12 rounded-full bg-background-100 items-center justify-center overflow-hidden">
                    <Icon as={User} size="md" className="text-typography-400" />
                  </Box>
                  <Box className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-background-50">
                    <Icon as={Heart} size="xs" className="text-white w-3 h-3" />
                  </Box>
                </Box>
                <VStack>
                  <Text className="text-typography-900 dark:text-typography-0 font-bold text-lg">
                    {partner ? `${partner.firstName}` : t("profile.no_partner")}
                  </Text>
                </VStack>
              </HStack>
              <Icon as={LinkIcon} className="text-typography-400" />
            </HStack>
          </WidgetCard>

          {/* Menu Actions */}
          <VStack space="md">
            <Button
              variant="widget"
              className="h-14"
              onPress={() => setIsEditOpen(true)}
            >
              <HStack space="md" className="items-center">
                <ButtonText className="text-typography-900 dark:text-typography-0 text-base font-medium ml-2">
                  {t("profile.edit_profile")}
                </ButtonText>
              </HStack>
              <Icon as={ChevronRight} className="text-typography-400 mr-2" />
            </Button>

            <Button
              variant="widget"
              className="h-14"
              onPress={() => setIsSettingsOpen(true)}
            >
              <HStack space="md" className="items-center">
                <ButtonText className="text-typography-900 dark:text-typography-0 text-base font-medium ml-2">
                  {t("profile.app_settings")}
                </ButtonText>
              </HStack>
              <Icon as={ChevronRight} className="text-typography-400 mr-2" />
            </Button>

            <Button variant="link" className="h-14 mt-4" onPress={handleLogout}>
              <ButtonText className="text-red-500 text-base font-medium">
                {t("auth.logout")}
              </ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
      <AppSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}
