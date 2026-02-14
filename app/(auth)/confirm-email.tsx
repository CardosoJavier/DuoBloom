import { AuthContainer } from "@/components/auth/AuthContainer";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import React, { useEffect, useState } from "react";

export default function ConfirmEmailScreen() {
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
  } = useAuthStore();
  const toast = useAppToast();

  const [code, setCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (!needsEmailConfirmation && isAuthenticated) {
      toast.success("Success", "Email verified successfully");
      router.replace("/(tabs)");
    }
  }, [needsEmailConfirmation, isAuthenticated]);

  useEffect(() => {
    if (error) {
      toast.error("Error", error);
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
    if (code.length !== 8) {
      toast.warning("Invalid Code", "Please enter a 8-digit code");
      return;
    }
    await verifyEmail(code);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await resendVerificationEmail();
    setResendTimer(30);
    toast.success("Code Sent", "A new verification code has been sent.");
  };

  return (
    <AuthContainer>
      <VStack space="xl" className="items-center">
        <Box className="w-20 h-20 bg-lavender-500/10 rounded-full justify-center items-center mb-2">
          <Mail size={40} color="#9FA0FF" />
        </Box>

        <VStack space="xs" className="items-center">
          <Heading size="2xl" className="text-slate-900 font-bold text-center">
            Check your email
          </Heading>
          <Text className="text-slate-500 text-center">
            We've sent a 8-digit confirmation code to{" "}
            <Text className="font-bold text-slate-700">
              {unconfirmedEmail || "your email"}
            </Text>
            . Please enter the code below to verify your account.
          </Text>
        </VStack>

        <Input size="xl" variant="outline" className="w-full text-center">
          <InputField
            placeholder="00000000"
            keyboardType="number-pad"
            maxLength={8}
            className="text-center text-2xl tracking-widest font-bold"
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
            {isLoading ? "Verifying..." : "Verify Email"}
          </ButtonText>
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
            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Code"}
          </ButtonText>
        </Button>

        <Button
          size="md"
          variant="link"
          action="secondary"
          onPress={() => router.replace("/(auth)/login")}
          className="mt-4"
        >
          <ButtonIcon as={ArrowLeft} className="mr-2 text-slate-400" />
          <ButtonText className="text-slate-400">Back to Login</ButtonText>
        </Button>
      </VStack>
    </AuthContainer>
  );
}
