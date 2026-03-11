import {
  logNutritionDay,
  updateLastCheckInDate,
  updateStreakState,
} from "@/api/streak-api";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
} from "@/components/ui/modal";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useQueryClient } from "@tanstack/react-query";
import { Leaf, ThumbsDown, ThumbsUp, X } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface DailyCheckInModalProps {
  readonly isOpen: boolean;
  readonly userId: string;
  readonly onClose: () => void;
  /** Called when the user makes an explicit choice (Yes or No). NOT called on X-close. */
  readonly onAnswered: () => void;
}

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterdayKey = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toLocalDateString(yesterday);
};

export function DailyCheckInModal({
  isOpen,
  userId,
  onClose,
  onAnswered,
}: DailyCheckInModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleYes = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const yesterday = getYesterdayKey();

    try {
      await logNutritionDay(userId, yesterday);
      await updateStreakState(userId, yesterday);
      await updateLastCheckInDate(userId, yesterday);

      queryClient.invalidateQueries({ queryKey: ["streak-month"] });
      queryClient.invalidateQueries({ queryKey: ["streak-state", userId] });
    } catch (err) {
      console.warn("[DailyCheckInModal] Streak update failed:", err);
    } finally {
      setIsSubmitting(false);
      onAnswered();
      onClose();
    }
  };

  const handleNo = async () => {
    const yesterday = getYesterdayKey();
    try {
      await updateLastCheckInDate(userId, yesterday);
    } catch (err) {
      console.warn("[DailyCheckInModal] Check-in date update failed:", err);
    } finally {
      onAnswered();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent className="rounded-[32px] bg-background-0 dark:bg-background-dark border border-outline-100 dark:border-outline-800 mx-6">
        <ModalCloseButton className="absolute top-4 right-4 z-10 p-1">
          <Icon
            as={X}
            className="text-typography-400 dark:text-typography-500 w-5 h-5"
          />
        </ModalCloseButton>

        <ModalBody contentContainerClassName="py-8 px-6">
          <VStack className="items-center gap-4">
            {/* Icon */}
            <Box className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-2">
              <Icon
                as={Leaf}
                className="text-green-600 dark:text-green-400 w-8 h-8"
              />
            </Box>

            {/* Title + Subtitle */}
            <VStack className="items-center gap-1">
              <Text className="text-typography-900 dark:text-white font-bold text-xl text-center">
                {t("check_in.title")}
              </Text>
              <Text className="text-typography-500 dark:text-typography-400 text-sm text-center mt-1">
                {t("check_in.subtitle")}
              </Text>
            </VStack>

            {/* Option cards */}
            <HStack className="gap-3 w-full pt-2">
              {/* Not quite */}
              <Pressable
                onPress={handleNo}
                className="flex-1 rounded-2xl bg-background-50 dark:bg-background-100 border border-outline-100 dark:border-outline-700 p-4 items-center gap-2 active:opacity-70"
              >
                <Icon
                  as={ThumbsDown}
                  className="text-typography-500 dark:text-typography-400 w-6 h-6"
                />
                <Text className="text-typography-500 dark:text-typography-400 text-xs font-bold">
                  {t("check_in.no")}
                </Text>
              </Pressable>

              {/* Yes, I did! */}
              <Pressable
                onPress={handleYes}
                disabled={isSubmitting}
                className="flex-1 rounded-2xl bg-primary-50 dark:bg-primary-950 border border-primary-100 dark:border-primary-800 p-4 items-center gap-2 active:opacity-70 disabled:opacity-50"
              >
                <Icon
                  as={ThumbsUp}
                  className="text-primary-600 dark:text-primary-300 w-6 h-6"
                />
                <Text className="text-primary-600 dark:text-primary-300 text-xs font-bold">
                  {t("check_in.yes")}
                </Text>
              </Pressable>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
