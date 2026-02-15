import { AuthContainer } from "@/components/auth/AuthContainer";
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
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { ArrowRight, Copy, Heart, User } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

type SyncStep = "input" | "waiting" | "found";

export default function BloomScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useAppToast();

  const [step, setStep] = useState<SyncStep>("input");
  const [partnerCode, setPartnerCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const myCode = "ALEX-8392"; // This would come from the backend

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(myCode);
    toast.success(t("common.success"), "Code copied to clipboard");
  };

  const handleConnect = () => {
    if (!partnerCode) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep("waiting");

      // Simulate partner connecting after a delay
      setTimeout(() => {
        setStep("found");
      }, 3000);
    }, 1500);
  };

  const handleConfirmSync = () => {
    toast.success(t("common.success"), t("auth.email_verified")); // Using existing success message or similar
    router.replace("/(tabs)");
  };

  return (
    <AuthContainer>
      <VStack space="xl" className="items-center w-full">
        {/* INPUT STEP */}
        {step === "input" && (
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
                    {myCode}
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
                <Input variant="soft" size="xl" className="w-full">
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
                onPress={handleConnect}
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
            </VStack>
          </>
        )}

        {/* WAITING STEP */}
        {step === "waiting" && (
          <VStack space="xl" className="items-center py-8 w-full">
            <Box className="mb-4 relative w-24 h-24 items-center justify-center">
              {/* Outer Ring */}
              <Box className="absolute w-full h-full rounded-full border-4 border-lavender-100 dark:border-slate-700" />
              {/* Spinning Ring handled by ActivityIndicator for now or we could animate this */}
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
                {t("auth.tell_them_to_enter", { code: myCode })}
              </Text>
            </VStack>
          </VStack>
        )}

        {/* FOUND STEP */}
        {step === "found" && (
          <VStack space="xl" className="items-center w-full py-4">
            <View className="flex-row items-center justify-center h-20 mb-4">
              {/* User Avatar */}
              <View className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-800 z-10 overflow-hidden items-center justify-center">
                <User
                  size={32}
                  className="text-slate-400 dark:text-slate-500"
                />
              </View>

              {/* Heart Connector */}
              <View className="w-12 h-12 rounded-full bg-lavender-100 dark:bg-slate-800 items-center justify-center -ml-4 z-20 border-4 border-white dark:border-slate-800 shadow-sm">
                <Heart
                  size={20}
                  className="text-lavender-500 fill-lavender-500"
                />
              </View>

              {/* Partner Avatar */}
              <View className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-800 -ml-4 z-10 overflow-hidden items-center justify-center">
                <User
                  size={32}
                  className="text-slate-400 dark:text-slate-500"
                />
              </View>
            </View>

            <VStack space="xs" className="items-center mb-4">
              <Heading
                size="xl"
                className="font-bold text-center text-slate-900 dark:text-typography-0"
              >
                {t("auth.partner_found")}
              </Heading>
              <Text className="text-center text-slate-500 dark:text-typography-400">
                {t("auth.you_are_linking_with", { name: "Sarah" })}
              </Text>
            </VStack>

            <Button
              size="xl"
              className="w-full rounded-xl bg-lavender-500"
              onPress={handleConfirmSync}
            >
              <ButtonText className="font-bold text-white text-lg">
                {t("auth.confirm_sync")}
              </ButtonText>
              <ButtonIcon as={User} className="ml-2 text-white" />
            </Button>
          </VStack>
        )}
      </VStack>
    </AuthContainer>
  );
}
