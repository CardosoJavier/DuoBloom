import { AuthContainer } from "@/components/auth/AuthContainer";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { ArrowRight, Link as LinkIcon, Share2 } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function BloomScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuthStore();
  const [pairCode, setPairCode] = useState("");
  const myCode = "BLOOM-X7Y2"; // This would come from the backend

  const handleBloom = async () => {
    // Logic to pair users
    // await login(); // TODO: Implement pairing logic
  };

  return (
    <AuthContainer>
      <VStack space="xl">
        <VStack space="xs">
          <Heading
            size="3xl"
            className="text-slate-900 dark:text-typography-0 font-bold"
          >
            {t("auth.bloom_title")}
          </Heading>
          <Text size="md" className="text-slate-500 dark:text-typography-400">
            {t("auth.bloom_subtitle")}
          </Text>
        </VStack>

        <VStack space="md" className="mt-4">
          <Box className="bg-primary-50 dark:bg-background-0 p-6 rounded-2xl items-center border border-primary-100 dark:border-slate-700">
            <Text
              size="xs"
              className="text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider mb-2"
            >
              {t("auth.pair_code")}
            </Text>
            <Heading
              size="2xl"
              className="text-primary-700 dark:text-primary-300 font-mono tracking-[4px]"
            >
              {myCode}
            </Heading>
            <Button variant="link" size="sm" className="mt-2">
              <ButtonIcon
                as={Share2}
                className="text-primary-500 dark:text-primary-400 mr-2"
              />
              <ButtonText className="text-primary-500 dark:text-primary-400 font-semibold">
                {t("auth.share_code")}
              </ButtonText>
            </Button>
          </Box>

          <Box className="flex-row items-center py-4">
            <Divider className="flex-1" />
            <Text
              size="xs"
              className="px-4 text-slate-400 dark:text-typography-400 font-bold uppercase"
            >
              OR
            </Text>
            <Divider className="flex-1" />
          </Box>

          <VStack space="xs">
            <Text
              size="sm"
              className="font-medium text-slate-700 dark:text-typography-200 ml-1"
            >
              {t("auth.enter_partner_code")}
            </Text>
            <Input variant="soft" size="xl">
              <InputSlot className="pl-4">
                <InputIcon
                  as={LinkIcon}
                  className="text-slate-400 dark:text-typography-400"
                />
              </InputSlot>
              <InputField
                placeholder="BLOOM-XXXX"
                value={pairCode}
                onChangeText={setPairCode}
                autoCapitalize="characters"
              />
            </Input>
          </VStack>
        </VStack>

        <Button
          action="primary"
          size="xl"
          className="rounded-2xl mt-4 h-14"
          onPress={handleBloom}
          disabled={!pairCode}
        >
          <ButtonText className="text-lg font-bold">
            {t("auth.connect_partner")}
          </ButtonText>
          <ButtonIcon as={ArrowRight} className="ml-2" />
        </Button>

        <Button
          variant="link"
          size="md"
          onPress={() => router.push("/(auth)/login")}
        >
          <ButtonText className="text-slate-400 dark:text-typography-400 font-medium">
            Skip for now
          </ButtonText>
        </Button>
      </VStack>
    </AuthContainer>
  );
}
