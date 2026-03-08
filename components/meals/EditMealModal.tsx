import { Trash2, Utensils, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { deleteConsumedMeal, updateConsumedMeal } from "../../api/meals-api";
import { useAppToast } from "../../hooks/use-app-toast";
import { ConsumedMeal } from "../../types/meals";
import { Button, ButtonText } from "../ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "../ui/form-control";
import { Heading } from "../ui/heading";
import { HStack } from "../ui/hstack";
import { Icon } from "../ui/icon";
import { Input, InputField } from "../ui/input";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "../ui/modal";

interface EditMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: ConsumedMeal | null;
  onSuccess: () => void;
}

export function EditMealModal({
  isOpen,
  onClose,
  meal,
  onSuccess,
}: Readonly<EditMealModalProps>) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useAppToast();

  useEffect(() => {
    if (meal) {
      setName(meal.name);
      setCalories(meal.kcal ? meal.kcal.toString() : "");
    }
  }, [meal]);

  const handleUpdate = async () => {
    if (!meal) return;
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("meals.require_name_image"));
      return;
    }

    setIsLoading(true);
    try {
      const kcalValue = calories ? Number.parseInt(calories, 10) : null;
      const { success, data, error } = await updateConsumedMeal(meal.id, {
        name,
        kcal: kcalValue,
      });

      if (success) {
        console.log("[EditMealModal] Successfully updated meal:", data);
        toast.success(t("common.success"), t("meals.update_success"));
        onSuccess();
        onClose();
      } else {
        console.error("[EditMealModal] Error updating meal:", error);
        toast.error(t("common.error"), t("meals.update_error"));
      }
    } catch (error) {
      console.error("[EditMealModal] Unexpected error updating meal:", error);
      toast.error(t("common.error"), t("meals.update_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!meal) return;

    Alert.alert(
      t("meals.delete_confirm_title"),
      t("meals.delete_confirm_message"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.confirm"),
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const { success, error } = await deleteConsumedMeal(meal.id);
              if (success) {
                console.log(
                  "[EditMealModal] Successfully deleted meal:",
                  meal.id,
                );
                toast.success(t("common.success"), t("meals.delete_success"));
                onSuccess();
                onClose();
              } else {
                console.error("[EditMealModal] Error deleting meal:", error);
                toast.error(t("common.error"), t("meals.delete_error"));
              }
            } catch (error) {
              console.error(
                "[EditMealModal] Unexpected error deleting meal:",
                error,
              );
              toast.error(t("common.error"), t("meals.delete_error"));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  if (!meal) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent className="bg-background-0 dark:bg-background-dark border border-outline-100 dark:border-outline-800 rounded-3xl p-6 relative">
        <ModalHeader className="mb-4">
          <HStack className="items-center gap-2">
            <Icon as={Utensils} size="md" className="text-primary-500" />
            <Heading size="md" className="text-typography-900 dark:text-white">
              {t("meals.edit_title")}
            </Heading>
          </HStack>
          <ModalCloseButton onPress={onClose} disabled={isLoading}>
            <Icon as={X} size="md" className="text-typography-500" />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody className="gap-4">
          <FormControl>
            <FormControlLabel className="mb-1">
              <FormControlLabelText className="text-typography-700 dark:text-typography-300">
                Meal Name
              </FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="md">
              <InputField
                placeholder="e.g., Avocado Toast"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
                className="text-typography-900 dark:text-white"
              />
            </Input>
          </FormControl>

          <FormControl className="flex-1">
            <FormControlLabel className="mb-1">
              <FormControlLabelText className="text-typography-700 dark:text-typography-300">
                Calories (kcal)
              </FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="md">
              <InputField
                placeholder="0"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                editable={!isLoading}
                className="text-typography-900 dark:text-white"
              />
            </Input>
          </FormControl>
        </ModalBody>

        <ModalFooter className="flex-col mt-4 p-0 gap-3">
          <Button
            onPress={handleUpdate}
            disabled={isLoading}
            className="w-full bg-primary-500 hover:bg-primary-600 rounded-xl py-3 h-12 flex-1 justify-center items-center"
          >
            <ButtonText className="text-white font-bold text-center">
              {t("common.edit")}
            </ButtonText>
          </Button>

          <Button
            onPress={handleDelete}
            disabled={isLoading}
            variant="outline"
            className="w-full border-error-500 rounded-xl py-3 h-12 flex-1 justify-center items-center"
          >
            <Icon as={Trash2} className="mr-2 text-error-500" />
            <ButtonText className="text-error-500 font-bold text-center">
              {t("common.delete") || "Delete"}
            </ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
