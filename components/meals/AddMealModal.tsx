import { Camera, Utensils, X } from "lucide-react-native";
import React, { useState } from "react";
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

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mealInfo: { name: string; calories: number; uri: string }) => void;
}

export function AddMealModal({ isOpen, onClose, onSave }: AddMealModalProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleSave = () => {
    onSave({
      name,
      calories: parseInt(calories, 10) || 0,
      uri:
        imageUri ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80", // Fallback placeholder
    });
    setName("");
    setCalories("");
    setImageUri(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent className="bg-background-0 dark:bg-background-dark border border-outline-100 dark:border-outline-800 rounded-3xl p-6 relative">
        <ModalHeader className="mb-4">
          <HStack className="items-center gap-2">
            <Icon as={Utensils} size="md" className="text-primary-500" />
            <Heading size="md" className="text-typography-900 dark:text-white">
              Add Meal
            </Heading>
          </HStack>
          <ModalCloseButton onPress={onClose}>
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
                className="text-typography-900 dark:text-white"
              />
            </Input>
          </FormControl>

          <FormControl>
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
                className="text-typography-900 dark:text-white"
              />
            </Input>
          </FormControl>

          <Button
            variant="outline"
            className="w-full mt-2 border-outline-200 dark:border-outline-700 rounded-xl py-3 justify-center items-center flex-row"
            onPress={() => {
              // Simulate taking photo for now
              setImageUri(
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
              );
            }}
          >
            <Icon
              as={Camera}
              className="mr-2 text-typography-700 dark:text-typography-300"
            />
            <ButtonText className="text-typography-700 dark:text-typography-300">
              Take Photo
            </ButtonText>
          </Button>
        </ModalBody>

        <ModalFooter className="mt-4 p-0">
          <Button
            onPress={handleSave}
            className="w-full bg-primary-500 hover:bg-primary-600 rounded-xl py-3 flex-1"
          >
            <ButtonText className="text-white font-bold w-full text-center">
              Save Entry
            </ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
