import { AuthContainer } from "@/components/auth/AuthContainer";
import { Box } from "@/components/ui/box";
import {
  Button,
  ButtonIcon,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuthStore } from "@/store/authStore";
import { verifyEmailSchema } from "@/types/auth-schema";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ConfirmEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    unconfirmedEmail,
    verifyEmail,
    resendVerificationEmail,
    clearError,
    error,
    isLoading,
    needsEmailConfirmation,
    isAuthenticated,
    logout,
  } = useAuthStore();
  const toast = useAppToast();

  const [code, setCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (!needsEmailConfirmation && isAuthenticated) {
      toast.success(t("common.success"), t("auth.email_verified"));
      router.replace("/(tabs)");
    }
  }, [needsEmailConfirmation, isAuthenticated]);

  useEffect(() => {
    if (error) {
      toast.error(t("common.error"), t(error));
      clearError();
    }
  }, [error, toast, clearError]);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (!unconfirmedEmail) {
      toast.warning(t("common.warning"), t("auth.session_expired"));
      router.replace("/(auth)/login");
    }

    const validationResult = verifyEmailSchema.safeParse({ code });

    if (!validationResult.success) {
      toast.warning(
        t("common.warning"),
        t(validationResult.error.issues[0].message),
      );
      return;
    }

    await verifyEmail(code);
  };

  const handleBackToLogin = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await resendVerificationEmail();
    setResendTimer(30);
    toast.success(t("common.success"), t("auth.code_sent"));
  };

  return (
    <AuthContainer>
      <VStack space="xl" className="items-center">
        <Box className="w-20 h-20 bg-lavender-500/10 rounded-full justify-center items-center mb-2">
          <Mail size={40} color="#9FA0FF" />
        </Box>

        <VStack space="xs" className="items-center">
          <Heading
            size="2xl"
            className="text-slate-900 dark:text-typography-0 font-bold text-center"
          >
            {t("auth.verify_title")}
          </Heading>
          <Text className="text-slate-500 dark:text-typography-400 text-center">
            {t("auth.verify_subtitle", {
              email: unconfirmedEmail || t("common.email"),
            })}
          </Text>
        </VStack>

        <Input
          size="xl"
          variant="outline"
          className="w-full text-center dark:bg-background-0"
        >
          <InputField
            placeholder="00000000"
            keyboardType="number-pad"
            maxLength={8}
            className="text-center text-2xl tracking-widest font-bold dark:text-typography-0"
            value={code}
            onChangeText={setCode}
          />
        </Input>

        <Button
          size="xl"
          variant="solid"
          action="primary"
          onPress={handleVerify}
          className="w-full bg-lavender-500"
          isDisabled={isLoading || code.length !== 8}
        >
          <ButtonText className="font-bold text-lg">
            {isLoading ? t("auth.verifying") : t("auth.verify_button")}
          </ButtonText>
          {isLoading && <ButtonSpinner color="white" className="ml-2" />}
        </Button>

        <Button
          size="md"
          variant="link"
          action="secondary"
          onPress={handleResend}
          isDisabled={resendTimer > 0 || isLoading}
          className="mt-2"
        >
          <ButtonText className="text-slate-500">
            {resendTimer > 0
              ? t("auth.resend_timer", { count: resendTimer })
              : t("auth.resend_code")}
          </ButtonText>
        </Button>

        <Button
          size="md"
          variant="link"
          action="secondary"
          onPress={() => handleBackToLogin()}
          className="mt-4"
        >
          <ButtonIcon
            as={ArrowLeft}
            className="mr-2 text-slate-400 dark:text-typography-400"
          />
          <ButtonText className="text-slate-400 dark:text-typography-400">
            {t("auth.back_to_login")}
          </ButtonText>
        </Button>
      </VStack>
    </AuthContainer>
  );
}
