import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, Utensils, X } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image } from "react-native";
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
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleSave = () => {
    if (!name || !imageUri) {
      Alert.alert(t("common.error"), t("meals.require_name_image"));
      return;
    }

    onSave({
      name,
      calories: parseInt(calories, 10) || 0,
      uri: imageUri,
    });
    setName("");
    setCalories("");
    setImageUri(null);
    onClose();
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(t("common.error"), t("meals.camera_permission_required"));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(t("common.error"), t("meals.gallery_permission_required"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
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
                className="text-typography-900 dark:text-white"
              />
            </Input>
          </FormControl>

          <HStack className="w-full mt-2 gap-3 mb-4">
            <Button
              variant="outline"
              className="flex-1 border-outline-200 dark:border-outline-700 rounded-xl py-3 h-12 justify-center items-center"
              onPress={takePhoto}
            >
              <Icon
                as={Camera}
                className="mr-2 text-typography-700 dark:text-typography-300"
              />
              <ButtonText className="text-typography-700 dark:text-typography-300">
                Camera
              </ButtonText>
            </Button>

            <Button
              variant="outline"
              className="flex-1 border-outline-200 dark:border-outline-700 rounded-xl py-3 h-12 justify-center items-center"
              onPress={pickImage}
            >
              <Icon
                as={ImageIcon}
                className="mr-2 text-typography-700 dark:text-typography-300"
              />
              <ButtonText className="text-typography-700 dark:text-typography-300">
                Gallery
              </ButtonText>
            </Button>
          </HStack>

          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 12,
                marginTop: 8,
              }}
              resizeMode="cover"
            />
          )}
        </ModalBody>

        <ModalFooter className="mt-4 p-0">
          <Button
            onPress={handleSave}
            className="w-full bg-primary-500 hover:bg-primary-600 rounded-xl py-3 h-12 flex-1 justify-center items-center"
          >
            <ButtonText className="text-white font-bold text-center">
              Save Entry
            </ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
