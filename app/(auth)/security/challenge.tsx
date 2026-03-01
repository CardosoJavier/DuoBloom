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
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { ArrowRight, LockKeyhole } from "lucide-react-native";
import React, { useEffect, useState } from "react";

export default function ChallengeScreen() {
  const router = useRouter();
  const toast = useAppToast();

  const { pendingSecurityData, setPendingSecurityData, updateUser } =
    useAuthStore();
  const { finalizeEncryption, isProcessing } = useOnboarding();

  const mnemonic = pendingSecurityData?.mnemonic || "";
  const words = mnemonic.split(" ").filter(Boolean);

  const [indices, setIndices] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    // Basic verification of route injection bounds
    if (words.length !== 12) {
      router.replace("/(auth)/login");
      return;
    }

    // Pick 3 random indices between 0 and 11
    const shuffled = [...Array(12).keys()].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).sort((a, b) => a - b);
    setIndices(selected);
  }, []);

  const handleVerify = async () => {
    let isValid = true;
    for (const i of indices) {
      if ((answers[i] || "").trim().toLowerCase() !== words[i]) {
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      toast.error("Incorrect", "One or more words do not match your phrase.");
      return;
    }

    try {
      // User passed the challenge! Now we commit the payload to memory and DB
      await finalizeEncryption(pendingSecurityData);

      // Force context state updates instantly so router Layout allows user in
      updateUser({ publicKey: pendingSecurityData.publicKey });
      setPendingSecurityData(null); // Clear from memory

      toast.success("Verified", "Your device is secured!");

      // Check if synced? The root _layout auto-redirects them appropriately
      router.replace("/");
    } catch (e: any) {
      toast.error(
        "Database Error",
        e.message || "Failed to save secure backup.",
      );
    }
  };

  const handleBackToWords = () => {
    router.replace("/(auth)/security/recovery");
  };

  if (indices.length === 0) return null;

  return (
    <AuthContainer>
      <VStack space="xl" className="items-center w-full pt-4">
        <Box className="w-16 h-16 bg-lavender-500/10 rounded-full justify-center items-center mb-2">
          <LockKeyhole size={32} color="#9FA0FF" />
        </Box>

        <VStack space="xs" className="items-center w-full mb-6">
          <Heading
            size="xl"
            className="text-slate-900 dark:text-typography-0 font-bold text-center"
          >
            Verify Phrase
          </Heading>
          <Text className="text-slate-500 dark:text-typography-400 text-center px-4">
            Just to be sure, please enter the requested words from your recovery
            phrase.
          </Text>
        </VStack>

        <VStack space="lg" className="w-full">
          {indices.map((index) => (
            <VStack key={index} space="sm" className="w-full">
              <Text className="text-slate-700 dark:text-typography-200 font-semibold mb-1">
                Word #{index + 1}
              </Text>
              <Input
                size="xl"
                variant="outline"
                className="w-full dark:bg-background-0 rounded-xl"
              >
                <InputField
                  placeholder={`Enter word #${index + 1}`}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={answers[index] || ""}
                  onChangeText={(val) =>
                    setAnswers((prev) => ({ ...prev, [index]: val }))
                  }
                  className="dark:text-typography-0"
                />
              </Input>
            </VStack>
          ))}
        </VStack>

        <Button
          size="xl"
          action="primary"
          onPress={handleVerify}
          className="w-full mt-8 bg-lavender-500"
          isDisabled={Object.keys(answers).length !== 3 || isProcessing}
        >
          {isProcessing ? (
            <ButtonSpinner color="white" />
          ) : (
            <>
              <ButtonText className="font-bold text-lg">
                Verify & Secure Profile
              </ButtonText>
              <ButtonIcon as={ArrowRight} className="ml-2" />
            </>
          )}
        </Button>

        <Button
          size="md"
          variant="link"
          action="secondary"
          onPress={handleBackToWords}
          className="mt-2"
        >
          <ButtonText className="text-slate-500">
            I need to see the phrase again
          </ButtonText>
        </Button>
      </VStack>
    </AuthContainer>
  );
}
