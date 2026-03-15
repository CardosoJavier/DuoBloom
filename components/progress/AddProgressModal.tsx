import * as ImagePicker from "expo-image-picker";
import { Camera, TrendingUp, X } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, ScrollView } from "react-native";

import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { ProgressPhotoInput } from "@/types/progress";

type PhotoView = "front" | "side" | "back";

interface AddProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: ProgressPhotoInput) => Promise<void>;
  capturedDate: string;
  isSaving: boolean;
}

export function AddProgressModal({
  isOpen,
  onClose,
  onSave,
  capturedDate,
  isSaving,
}: Readonly<AddProgressModalProps>) {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<Record<PhotoView, string | null>>({
    front: null,
    side: null,
    back: null,
  });
  const [weightKg, setWeightKg] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [bodyFat, setBodyFat] = useState("");

  const reset = () => {
    setPhotos({ front: null, side: null, back: null });
    setWeightKg("");
    setWeightLb("");
    setBodyFat("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickImage = async (view: PhotoView, fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert(
        t("common.error"),
        fromCamera
          ? t("meals.camera_permission_required")
          : t("meals.gallery_permission_required"),
      );
      return;
    }

    const picker = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await picker({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setPhotos((prev) => ({ ...prev, [view]: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (!photos.front || !photos.side || !photos.back) {
      Alert.alert(t("common.error"), t("progress.photo_required"));
      return;
    }

    await onSave({
      frontUri: photos.front,
      sideUri: photos.side,
      backUri: photos.back,
      capturedDate,
      weightKg: weightKg ? Number.parseFloat(weightKg) : undefined,
      weightLb: weightLb ? Number.parseFloat(weightLb) : undefined,
      bodyFat: bodyFat ? Number.parseFloat(bodyFat) : undefined,
    });

    reset();
  };

  const photoSlots: { label: string; view: PhotoView }[] = [
    { label: t("progress.front"), view: "front" },
    { label: t("progress.side"), view: "side" },
    { label: t("progress.back"), view: "back" },
  ];

  const allPhotosSelected = !!(photos.front && photos.side && photos.back);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalBackdrop />
      <ModalContent className="bg-background-0 border border-outline-100 dark:border-outline-800 rounded-3xl relative">
        <ModalHeader className="px-6 pt-6 pb-3">
          <HStack className="items-center gap-2">
            <Icon as={TrendingUp} size="md" className="text-primary-500" />
            <Heading size="md" className="text-typography-900 dark:text-white">
              {t("progress.add_photo_title")}
            </Heading>
          </HStack>
          <ModalCloseButton onPress={handleClose}>
            <Icon as={X} size="md" className="text-typography-500" />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody className="px-6">
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack className="gap-5 pb-2">
              {/* Three photo slots */}
              <HStack className="gap-3">
                {photoSlots.map(({ label, view }) => {
                  const uri = photos[view];
                  return (
                    <VStack key={view} className="flex-1 items-center gap-1">
                      <Text className="text-typography-500 text-xs font-semibold uppercase tracking-wide">
                        {label}
                      </Text>
                      <Pressable
                        onPress={() =>
                          Alert.alert(label, "", [
                            {
                              text: t("progress.take_photo"),
                              onPress: () => {
                                void pickImage(view, true);
                              },
                            },
                            {
                              text: t("progress.pick_image"),
                              onPress: () => {
                                void pickImage(view, false);
                              },
                            },
                            { text: t("common.cancel"), style: "cancel" },
                          ])
                        }
                        className={`w-full rounded-2xl border-2 border-dashed overflow-hidden items-center justify-center ${
                          uri
                            ? "border-transparent"
                            : "border-outline-300 dark:border-outline-700"
                        }`}
                        style={{ aspectRatio: 3 / 4 }}
                      >
                        {uri ? (
                          <Image
                            source={{ uri }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <VStack className="items-center gap-1">
                            <Icon
                              as={Camera}
                              size="lg"
                              className="text-typography-400"
                            />
                            <Text className="text-typography-400 text-xs">
                              {t("progress.pick_image")}
                            </Text>
                          </VStack>
                        )}
                      </Pressable>
                    </VStack>
                  );
                })}
              </HStack>

              {/* Measurement inputs */}
              <HStack className="gap-3">
                <FormControl className="flex-1">
                  <FormControlLabel className="mb-1">
                    <FormControlLabelText className="text-typography-600 dark:text-typography-300 text-xs">
                      {t("progress.weight_kg")}
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input size="sm" className="rounded-xl">
                    <InputField
                      keyboardType="decimal-pad"
                      value={weightKg}
                      onChangeText={setWeightKg}
                      placeholder="—"
                    />
                  </Input>
                </FormControl>
                <FormControl className="flex-1">
                  <FormControlLabel className="mb-1">
                    <FormControlLabelText className="text-typography-600 dark:text-typography-300 text-xs">
                      {t("progress.weight_lb")}
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input size="sm" className="rounded-xl">
                    <InputField
                      keyboardType="decimal-pad"
                      value={weightLb}
                      onChangeText={setWeightLb}
                      placeholder="—"
                    />
                  </Input>
                </FormControl>
                <FormControl className="flex-1">
                  <FormControlLabel className="mb-1">
                    <FormControlLabelText className="text-typography-600 dark:text-typography-300 text-xs">
                      {t("progress.body_fat")}
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input size="sm" className="rounded-xl">
                    <InputField
                      keyboardType="decimal-pad"
                      value={bodyFat}
                      onChangeText={setBodyFat}
                      placeholder="—"
                    />
                  </Input>
                </FormControl>
              </HStack>
            </VStack>
          </ScrollView>
        </ModalBody>

        <ModalFooter className="px-6 pb-6 pt-3 gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            onPress={handleClose}
            isDisabled={isSaving}
          >
            <ButtonText>{t("common.cancel")}</ButtonText>
          </Button>
          <Button
            className="flex-1 rounded-2xl bg-primary-500"
            onPress={handleSave}
            isDisabled={isSaving || !allPhotosSelected}
          >
            <ButtonText className="text-white">
              {isSaving ? t("common.saving") : t("progress.save")}
            </ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
