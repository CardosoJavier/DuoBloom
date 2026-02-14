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

export default function SyncScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [pairCode, setPairCode] = useState("");
  const myCode = "SYNC-X7Y2"; // This would come from the backend

  const handleSync = async () => {
    // Logic to pair users
    // await login(); // TODO: Implement pairing logic
  };

  return (
    <AuthContainer>
      <VStack space="xl">
        <VStack space="xs">
          <Heading size="3xl" className="text-typography-900">
            Sync with Partner
          </Heading>
          <Text size="md" className="text-typography-500">
            Connect with your partner to share progress
          </Text>
        </VStack>

        <VStack space="md" className="mt-4">
          <Box className="bg-primary-50 p-6 rounded-2xl items-center border border-primary-100">
            <Text
              size="xs"
              className="text-primary-600 font-bold uppercase tracking-wider mb-2"
            >
              Your Pair Code
            </Text>
            <Heading
              size="2xl"
              className="text-primary-700 font-mono tracking-[4px]"
            >
              {myCode}
            </Heading>
            <Button variant="link" size="sm" className="mt-2">
              <ButtonIcon as={Share2} className="text-primary-500 mr-2" />
              <ButtonText className="text-primary-500 font-semibold">
                Share Code
              </ButtonText>
            </Button>
          </Box>

          <Box className="flex-row items-center py-4">
            <Divider className="flex-1" />
            <Text
              size="xs"
              className="px-4 text-typography-400 font-bold uppercase"
            >
              OR
            </Text>
            <Divider className="flex-1" />
          </Box>

          <VStack space="xs">
            <Text size="sm" className="font-medium text-typography-700 ml-1">
              Enter Partner's Code
            </Text>
            <Input variant="soft" size="xl">
              <InputSlot className="pl-4">
                <InputIcon as={LinkIcon} className="text-typography-400" />
              </InputSlot>
              <InputField
                placeholder="SYNC-XXXX"
                value={pairCode}
                onChangeText={setPairCode}
                autoCapitalize="characters"
              />
            </Input>
          </VStack>
        </VStack>

        <Button
          action="dark"
          size="xl"
          className="rounded-2xl mt-4 h-14"
          onPress={handleSync}
          disabled={!pairCode}
        >
          <ButtonText className="text-lg font-bold">Connect Partner</ButtonText>
          <ButtonIcon as={ArrowRight} className="ml-2" />
        </Button>

        <Button
          variant="link"
          size="md"
          onPress={() => router.push("/(auth)/login")}
        >
          <ButtonText className="text-typography-400 font-medium">
            Skip for now
          </ButtonText>
        </Button>
      </VStack>
    </AuthContainer>
  );
}
