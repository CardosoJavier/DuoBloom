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
import { useAuthStore } from "@/store/authStore";
import { loginSchema } from "@/types/auth-schema";
import { useRouter } from "expo-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, clearError, needsEmailConfirmation, isLoading } =
    useAuthStore();
  const router = useRouter();
  const toast = useAppToast();

  useEffect(() => {
    if (needsEmailConfirmation) {
      router.replace("/(auth)/confirm-email");
    }
  }, [needsEmailConfirmation]);

  useEffect(() => {
    if (error) {
      toast.error("Error", error);
      clearError();
    }
  }, [error, toast, clearError]);

  const handleLogin = async () => {
    const validationResult = loginSchema.safeParse({
      email,
      password,
    });

    if (!validationResult.success) {
      toast.error("Invalid Input", validationResult.error.issues[0].message);
      return;
    }

    await login(email, password);
  };

  return (
    <AuthContainer>
      <VStack space="xl">
        <VStack space="xs">
          <Heading size="2xl" className="text-slate-800 font-bold">
            {t("auth.signin_title")}
          </Heading>
          <Text className="text-slate-500">{t("auth.signin_subtitle")}</Text>
        </VStack>

        <VStack space="lg" className="mt-4">
          <View>
            <Input variant="soft" size="xl">
              <InputSlot className="pl-4">
                <InputIcon as={Mail} className="text-slate-400" />
              </InputSlot>
              <InputField
                placeholder={t("common.email")}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Input>
          </View>

          <View>
            <Input variant="soft" size="xl">
              <InputSlot className="pl-4">
                <InputIcon as={Lock} className="text-slate-400" />
              </InputSlot>
              <InputField
                placeholder={t("common.password")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <InputSlot
                className="pr-4"
                onPress={() => setShowPassword(!showPassword)}
              >
                <InputIcon
                  as={showPassword ? EyeOff : Eye}
                  className="text-slate-400"
                />
              </InputSlot>
            </Input>
            <Box className="items-end mt-1">
              <Pressable onPress={() => {}}>
                <Text className="text-sm text-lavender-500 font-medium">
                  {t("auth.forgot_password")}
                </Text>
              </Pressable>
            </Box>
          </View>
        </VStack>

        <Button
          size="xl"
          action="primary"
          onPress={handleLogin}
          className="mt-6"
          isDisabled={isLoading}
        >
          <ButtonText className="font-bold text-lg">
            {isLoading ? t("auth.signing_in") : t("common.login")}
          </ButtonText>
          {isLoading ? (
            <ButtonSpinner color="white" />
          ) : (
            <ButtonIcon as={ArrowRight} />
          )}
        </Button>

        <Box className="flex-row justify-center mt-4">
          <Text className="text-slate-500">{t("auth.no_account_text")} </Text>
          <Pressable onPress={() => router.push("/(auth)/signup")}>
            <Text className="text-lavender-500 font-bold">
              {t("common.signup")}
            </Text>
          </Pressable>
        </Box>
      </VStack>
    </AuthContainer>
  );
}
