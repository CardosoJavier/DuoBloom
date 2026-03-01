import { AuthContainer } from "@/components/auth/AuthContainer";
import { Box } from "@/components/ui/box";
import {
  Button,
  ButtonIcon,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAppToast } from "@/hooks/use-app-toast";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { Lock, ShieldAlert, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function SetupSecurityScreen() {
  const { t } = useTranslation();
  const { generateKeysLocally, isProcessing, error } = useOnboarding();
  const { setPendingSecurityData } = useAuthStore();
  const router = useRouter();
  const toast = useAppToast();

  const [setupFailed, setSetupFailed] = useState(false);
  const setupStarted = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (!setupStarted.current && !setupFailed) {
      setupStarted.current = true;
      handleSetup();
    }
  }, []);

  const handleSetup = async () => {
    setSetupFailed(false);
    try {
      const result = await generateKeysLocally();
      if (result && result.mnemonic) {
        // Store payload in AuthStore for when user verifies
        setPendingSecurityData(result);

        // Redirect to the display screen
        router.replace("/(auth)/security/recovery");
      }
    } catch (e: any) {
      setSetupFailed(true);
      toast.error("Encryption Setup Failed", e.message || "Unknown error");
    }
  };

  return (
    <AuthContainer>
      <VStack
        space="xl"
        className="items-center w-full justify-center flex-1 h-full py-12"
      >
        <Box
          className={`w-28 h-28 rounded-full justify-center items-center mb-4 ${
            setupFailed ? "bg-red-500/10" : "bg-lavender-500/10"
          }`}
        >
          {setupFailed ? (
            <ShieldAlert size={56} color="#ef4444" />
          ) : (
            <Lock size={56} color="#9FA0FF" />
          )}
        </Box>

        <VStack space="md" className="items-center w-full px-4">
          <Heading
            size="2xl"
            className="text-slate-900 dark:text-typography-0 font-bold text-center"
          >
            {setupFailed ? "Setup Incomplete" : "Securing your account..."}
          </Heading>

          <Text className="text-slate-500 dark:text-typography-400 text-center text-lg px-2">
            {setupFailed
              ? "We could not generate your secure vault. Your device might be missing a lock screen or passcode which is required for hardware isolation."
              : "We are generating your military-grade encryption keys. This ensures neither we nor anyone else can see your private uploads."}
          </Text>
        </VStack>

        <VStack className="w-full mt-12 items-center min-h-[100px] justify-center">
          {isProcessing ? (
            <ButtonSpinner color="#9FA0FF" size="large" />
          ) : setupFailed ? (
            <Button
              size="xl"
              variant="solid"
              action="primary"
              onPress={handleSetup}
              className="w-full mt-4"
            >
              <ButtonIcon as={ShieldCheck} className="mr-2" />
              <ButtonText className="font-bold text-lg">Try Again</ButtonText>
            </Button>
          ) : null}
        </VStack>
      </VStack>
    </AuthContainer>
  );
}
