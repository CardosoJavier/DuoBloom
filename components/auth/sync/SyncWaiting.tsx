import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";

import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";

interface SyncWaitingProps {
  myCode?: string;
}

export const SyncWaiting = ({ myCode }: SyncWaitingProps) => {
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <VStack space="xl" className="items-center py-8 w-full">
      <Box className="mb-4 relative w-24 h-24 items-center justify-center">
        {/* Outer Ring */}
        <Box className="absolute w-full h-full rounded-full border-4 border-lavender-100 dark:border-slate-700" />
        <ActivityIndicator
          size="large"
          color="#818cf8"
          style={{ transform: [{ scale: 1.5 }] }}
        />
      </Box>

      <VStack space="xs" className="items-center">
        <Heading
          size="xl"
          className="font-bold text-center text-slate-900 dark:text-typography-0"
        >
          {t("auth.waiting_for_partner")}
        </Heading>
        <Text className="text-center text-slate-500 dark:text-typography-400">
          {t("auth.tell_them_to_enter", { code: myCode || "..." })}
        </Text>
      </VStack>
      <Button
        variant="link"
        action="secondary"
        size="md"
        className="mt-4"
        onPress={handleLogout}
      >
        <ButtonIcon as={LogOut} className="mr-2 text-slate-500" />
        <ButtonText className="text-slate-500">
          {t("auth.back_to_login")}
        </ButtonText>
      </Button>
    </VStack>
  );
};
