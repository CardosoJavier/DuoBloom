import { AuthContainer } from "@/components/auth/AuthContainer";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import React from "react";

export default function ConfirmEmailScreen() {
  const router = useRouter();

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
            We've sent a confirmation link to your email address. Please click
            the link to verify your account.
          </Text>
        </VStack>

        <Button
          size="xl"
          variant="solid"
          action="secondary"
          onPress={() => router.replace("/(auth)/login")}
          className="mt-6 w-full"
        >
          <ButtonIcon as={ArrowLeft} className="mr-2" />
          <ButtonText className="font-bold text-lg">Back to Login</ButtonText>
        </Button>
      </VStack>
    </AuthContainer>
  );
}
