import { AuthContainer } from "@/components/auth/AuthContainer";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuthStore } from "@/store/authStore";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { ArrowRight, Copy, ShieldAlert } from "lucide-react-native";
import React, { useEffect, useState } from "react";

export default function RecoveryScreen() {
  const router = useRouter();
  const toast = useAppToast();

  const { pendingSecurityData } = useAuthStore();
  const mnemonic = pendingSecurityData?.mnemonic || "";

  // Split mnemonic into words, defaulting to empty array if somehow missing
  const words = mnemonic.split(" ").filter(Boolean);

  const [counter, setCounter] = useState(5);

  useEffect(() => {
    // If we land here without mnemonic, boot them out
    if (!words || words.length !== 12) {
      toast.error("Error", "Invalid secure session. Please log in again.");
      router.replace("/(auth)/login");
      return;
    }

    const interval = setInterval(() => {
      setCounter((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(mnemonic);
    toast.success("Copied", "Recovery phrase copied to clipboard");
  };

  const handleContinue = () => {
    // Navigate to challenge
    router.replace("/(auth)/security/challenge");
  };

  return (
    <AuthContainer>
      <VStack space="xl" className="items-center w-full pt-4">
        <Box className="w-16 h-16 bg-red-500/10 rounded-full justify-center items-center mb-2">
          <ShieldAlert size={32} color="#ef4444" />
        </Box>

        <VStack space="xs" className="items-center w-full">
          <Heading
            size="xl"
            className="text-slate-900 dark:text-typography-0 font-bold text-center"
          >
            Your Recovery Phrase
          </Heading>
          <Text className="text-slate-500 dark:text-typography-400 text-center px-4">
            If you lose this device, you will lose access to all your encrypted
            data. Write these 12 words down and keep them safe.
          </Text>
        </VStack>

        <Box className="w-full bg-slate-100 dark:bg-background-0 rounded-2xl p-6 border border-slate-200 dark:border-background-100">
          <VStack className="w-full flex-wrap flex-row gap-y-4 gap-x-2 justify-between">
            {words.map((word: string, index: number) => (
              <Box
                key={index}
                className="w-[30%] bg-white dark:bg-background-50 rounded-lg p-2 items-center flex-row shadow-sm"
                style={{ width: "31%" }} // 3 columns
              >
                <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold w-6">
                  {index + 1}.
                </Text>
                <Text
                  className="text-slate-800 dark:text-typography-0 font-semibold text-sm flex-1 text-center"
                  numberOfLines={1}
                >
                  {word}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>

        <Button
          size="lg"
          variant="outline"
          action="secondary"
          onPress={handleCopy}
          className="w-full border-slate-300 dark:border-slate-700"
        >
          <ButtonIcon
            as={Copy}
            className="mr-2 text-slate-600 dark:text-slate-300"
          />
          <ButtonText className="text-slate-600 dark:text-slate-300">
            Copy to Clipboard
          </ButtonText>
        </Button>

        <Button
          size="xl"
          action="primary"
          onPress={handleContinue}
          className="w-full mt-4 bg-lavender-500"
          isDisabled={counter > 0}
        >
          <ButtonText className="font-bold text-lg">
            {counter > 0
              ? `I have saved my words (${counter}s)`
              : "I have saved my words"}
          </ButtonText>
          {counter === 0 && <ButtonIcon as={ArrowRight} className="ml-2" />}
        </Button>
      </VStack>
    </AuthContainer>
  );
}
