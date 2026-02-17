import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { ArrowRight, Copy, Heart, LogOut, User } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { Box } from "@/components/ui/box";
import {
  Button,
  ButtonIcon,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuthStore } from "@/store/authStore";

interface SyncInputProps {
  myCode?: string;
  onConnect: (code: string) => void;
  isLoading: boolean;
}

export const SyncInput = ({ myCode, onConnect, isLoading }: SyncInputProps) => {
  const { t } = useTranslation();
  const toast = useAppToast();
  const [partnerCode, setPartnerCode] = useState("");
  const { logout } = useAuthStore();
  const router = useRouter();

  const copyToClipboard = async () => {
    if (myCode) {
      await Clipboard.setStringAsync(myCode);
      toast.success(t("common.success"), "Code copied to clipboard");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <>
      <Box className="w-16 h-16 bg-lavender-500/10 rounded-full justify-center items-center mb-2">
        <User size={32} color="#9FA0FF" />
      </Box>

      <VStack space="xs" className="items-center mb-4">
        <Heading
          size="2xl"
          className="text-slate-900 dark:text-typography-0 font-bold text-center"
        >
          {t("auth.bloom_title")}
        </Heading>
        <Text className="text-slate-500 dark:text-typography-400 text-center px-2">
          {t("auth.bloom_subtitle")}
        </Text>
      </VStack>

      <VStack space="md" className="w-full">
        <Box className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl items-center border border-slate-100 dark:border-slate-700">
          <Text
            size="xs"
            className="text-slate-400 dark:text-typography-400 font-bold uppercase tracking-wider mb-2"
          >
            {t("auth.pair_code")}
          </Text>
          <Box className="flex-row items-center gap-2">
            <Heading
              size="xl"
              className="text-slate-900 dark:text-typography-0 font-mono tracking-widest"
            >
              {myCode || "..."}
            </Heading>
            <Button
              variant="link"
              size="sm"
              onPress={copyToClipboard}
              className="h-8 w-8 p-0"
              accessibilityLabel="Copy code"
            >
              <ButtonIcon
                as={Copy}
                className="text-slate-400 dark:text-typography-400"
              />
            </Button>
          </Box>
        </Box>

        <VStack space="xs" className="mt-2">
          <Input variant="soft" size="xl" className="w-full" isDisabled={isLoading}>
            <InputSlot className="pl-4">
              <InputIcon as={Heart} className="text-rose-400" />
            </InputSlot>
            <InputField
              placeholder={t("auth.enter_partner_code_placeholder")}
              value={partnerCode}
              onChangeText={(text) => setPartnerCode(text.toUpperCase())}
              autoCapitalize="characters"
              className="font-medium"
            />
          </Input>
        </VStack>

        <Button
          action="primary"
          size="xl"
          className="rounded-xl mt-2"
          onPress={() => onConnect(partnerCode)}
          isDisabled={!partnerCode || isLoading}
        >
          {isLoading ? (
            <ButtonSpinner color="white" />
          ) : (
            <>
              <ButtonText className="font-bold text-lg">
                {t("auth.connect")}
              </ButtonText>
              <ButtonIcon as={ArrowRight} className="ml-2" />
            </>
          )}
        </Button>

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
    </>
  );
};
