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
import { signupSchema } from "@/types/auth-schema";
import { useRouter } from "expo-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

export default function SignupScreen() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, needsEmailConfirmation, error, clearError, isLoading } =
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

  const handleSignup = async () => {
    const validationResult = signupSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
    });

    if (!validationResult.success) {
      toast.error("Invalid Input", validationResult.error.issues[0].message);
      return;
    }

    await signUp(email, password, firstName, lastName);
  };

  return (
    <AuthContainer>
      <VStack space="xl">
        <VStack space="xs">
          <Heading size="2xl" className="text-slate-900 font-bold">
            {t("auth.signup_title")}
          </Heading>
          <Text className="text-slate-500">{t("auth.signup_subtitle")} </Text>
        </VStack>

        <VStack space="md" className="mt-4">
          <VStack space="xs">
            <Input variant="soft" size="xl">
              <InputSlot className="pl-4">
                <InputIcon as={User} className="text-slate-400" />
              </InputSlot>
              <InputField
                placeholder={t("common.first_name")}
                value={firstName}
                onChangeText={setFirstName}
              />
            </Input>
          </VStack>

          <VStack space="xs">
            <Input variant="soft" size="xl">
              <InputSlot className="pl-4">
                <InputIcon as={User} className="text-slate-400" />
              </InputSlot>
              <InputField
                placeholder={t("common.last_name")}
                value={lastName}
                onChangeText={setLastName}
              />
            </Input>
          </VStack>

          <VStack space="xs">
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
          </VStack>

          <VStack space="xs">
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
          </VStack>
        </VStack>

        <Button
          size="xl"
          action="primary"
          onPress={handleSignup}
          className="mt-6"
          isDisabled={isLoading}
        >
          <ButtonText className="font-bold text-lg">
            {isLoading ? t("auth.signing_up") : t("common.signup")}
          </ButtonText>
          {isLoading ? (
            <ButtonSpinner color="white" />
          ) : (
            <ButtonIcon as={ArrowRight} />
          )}
        </Button>

        <Box className="flex-row justify-center mt-4">
          <Text className="text-slate-500">{t("auth.have_account_text")} </Text>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text className="text-lavender-500 font-bold">
              {t("common.login")}
            </Text>
          </Pressable>
        </Box>
      </VStack>
    </AuthContainer>
  );
}
