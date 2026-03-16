import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { AlertTriangle, X } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputCode: string;
  onInputChange: (value: string) => void;
  canDelete: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  inputCode,
  onInputChange,
  canDelete,
  isDeleting,
  onConfirm,
}: Readonly<DeleteAccountModalProps>) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" useRNModal>
      <ModalBackdrop />
      <ModalContent className="rounded-[32px] bg-background-0 dark:bg-background-dark border border-outline-100 dark:border-outline-800 mx-6">
        <ModalCloseButton
          className="absolute top-4 right-4 z-10 p-1"
          disabled={isDeleting}
          onPress={onClose}
        >
          <Icon
            as={X}
            className="text-typography-400 dark:text-typography-500 w-5 h-5"
          />
        </ModalCloseButton>

        <ModalBody contentContainerClassName="py-8 px-6">
          <VStack className="gap-5">
            {/* Icon + title */}
            <VStack className="items-center gap-3">
              <Icon
                as={AlertTriangle}
                className="text-red-500 w-10 h-10"
                size="xl"
              />
              <Heading className="text-typography-900 dark:text-white text-xl text-center">
                {t("profile.delete_account_modal_title")}
              </Heading>
            </VStack>

            {/* Warning text */}
            <Text className="text-typography-500 dark:text-typography-400 text-sm text-center">
              {t("profile.delete_account_warning")}
            </Text>

            {/* Pair-code confirmation input */}
            <VStack className="gap-2">
              <Text className="text-typography-700 dark:text-typography-300 text-sm font-medium">
                {t("profile.delete_account_confirm_label")}
              </Text>
              <Input
                size="xl"
                className="border-red-500/50 bg-background-50 dark:bg-background-100 rounded-xl h-14"
              >
                <InputField
                  className="text-typography-900 dark:text-white uppercase"
                  placeholder={t("profile.delete_account_confirm_placeholder")}
                  value={inputCode}
                  onChangeText={onInputChange}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isDeleting}
                />
              </Input>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter className="px-6 pb-6 pt-0 gap-3 flex-col">
          <Button
            className="w-full bg-red-600 rounded-xl h-14"
            onPress={onConfirm}
            isDisabled={!canDelete || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="white" />
            ) : (
              <ButtonText className="text-white font-bold">
                {t("profile.delete_account_confirm_button")}
              </ButtonText>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full border-outline-300 dark:border-outline-700 rounded-xl h-12"
            onPress={onClose}
            isDisabled={isDeleting}
          >
            <ButtonText className="text-typography-700 dark:text-typography-300">
              {t("common.cancel")}
            </ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
