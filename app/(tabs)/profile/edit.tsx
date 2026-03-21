import { syncApi } from "@/api/sync-api";
import { DeleteAccountModal } from "@/components/profile/DeleteAccountModal";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { WidgetCard } from "@/components/ui/widget-card";
import { useAccountDeletion } from "@/hooks/useAccountDeletion";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { AlertTriangle, Camera, Mail, User, X } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuthStore();
  const { t } = useTranslation();
  const router = useRouter();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);

  const {
    isModalOpen,
    inputCode,
    setInputCode,
    isDeleting,
    canDelete,
    openModal,
    closeModal,
    handleDelete,
  } = useAccountDeletion();

  const handleSave = async () => {
    // TODO: Implement update profile API
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert("Success", "Profile updated successfully");
      router.back();
    }, 1000);
  };

  const handleUnlink = () => {
    Alert.alert(t("profile.unlink_partner"), t("common.are_you_sure"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        style: "destructive",
        onPress: async () => {
          if (!user?.id) return;
          const result = await syncApi.unlinkPartner(user.id);
          if (result.success) {
            await refreshUser();
            router.back();
            Alert.alert(
              t("common.success"),
              t("profile.unlink_success_message"),
            );
          } else {
            Alert.alert(t("common.error"), result.error?.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <VStack className="flex-1 p-6" space="xl">
        {/* Header */}
        <HStack className="justify-between items-center">
          <HStack space="sm" className="items-center">
            <Icon
              as={User}
              className="text-typography-900 dark:text-typography-0"
            />
            <Heading className="text-typography-900 dark:text-typography-0 text-xl">
              {t("profile.edit_profile")}
            </Heading>
          </HStack>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon as={X} className="text-typography-500" />
          </TouchableOpacity>
        </HStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack space="2xl" className="mt-4 pb-10">
            {/* Avatar */}
            <Box className="self-center relative">
              <Box className="h-32 w-32 rounded-full bg-background-100 dark:bg-background-800 items-center justify-center border-4 border-background-200 dark:border-background-700 overflow-hidden">
                <Icon as={User} size="xl" className="text-typography-400" />
              </Box>
              <TouchableOpacity className="absolute bottom-0 right-0 bg-background-0 dark:bg-background-900 p-2 rounded-full border-4 border-background-0 dark:border-background-900">
                <Icon
                  as={Camera}
                  size="sm"
                  className="text-typography-700 dark:text-typography-200"
                />
              </TouchableOpacity>
            </Box>

            {/* Form */}
            <WidgetCard>
              <VStack space="lg">
                <VStack space="xs">
                  <Text className="text-typography-500 font-medium text-sm ml-1">
                    {t("auth.full_name")}
                  </Text>
                  <Input variant="soft" size="xl" isDisabled={true}>
                    <InputSlot className="pl-4">
                      <InputIcon as={User} className="text-typography-400" />
                    </InputSlot>
                    <InputField
                      placeholder="Alex Doe"
                      value={`${firstName} ${lastName}`}
                      onChangeText={(text) => {
                        const parts = text.split(" ");
                        setFirstName(parts[0]);
                        setLastName(parts.slice(1).join(" "));
                      }}
                    />
                  </Input>
                </VStack>

                <VStack space="xs">
                  <Text className="text-typography-500 font-medium text-sm ml-1">
                    {t("auth.email_address")}
                  </Text>
                  <Input variant="soft" size="xl">
                    <InputSlot className="pl-4">
                      <InputIcon as={Mail} className="text-typography-400" />
                    </InputSlot>
                    <InputField
                      placeholder="alex@example.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </Input>
                  <Text className="text-typography-400 text-xs ml-1 mt-1">
                    {t("profile.email_update_warning")}
                  </Text>
                </VStack>

                <HStack className="justify-between items-center">
                  <Text className="text-typography-900 dark:text-typography-0 font-medium">
                    {t("profile.change_password")}
                  </Text>
                  <Button variant="link" size="sm">
                    <ButtonText className="text-primary-500 font-medium">
                      {t("common.edit")}
                    </ButtonText>
                  </Button>
                </HStack>

                <Button
                  size="xl"
                  action="primary"
                  className="rounded-2xl mt-2 h-14"
                  onPress={handleSave}
                  isDisabled={isSaving}
                >
                  <ButtonText className="font-bold">
                    {isSaving ? t("common.saving") : t("profile.save_changes")}
                  </ButtonText>
                </Button>
              </VStack>
            </WidgetCard>

            {/* Danger Zone */}
            <WidgetCard
              title={t("profile.danger_zone")}
              icon={
                <Icon as={AlertTriangle} className="text-error-500" size="sm" />
              }
            >
              <VStack space="md">
                <Button
                  variant="outline"
                  action="negative"
                  className="rounded-xl h-12 justify-start pl-4"
                  onPress={handleUnlink}
                >
                  <ButtonText className="text-error-600 dark:text-error-400 text-sm">
                    {t("profile.unlink_partner")}
                  </ButtonText>
                </Button>
                <Button
                  variant="outline"
                  action="negative"
                  className="rounded-xl h-12 justify-start pl-4"
                  onPress={openModal}
                >
                  <ButtonText className="text-error-600 dark:text-error-400 text-sm">
                    {t("profile.delete_account")}
                  </ButtonText>
                </Button>
              </VStack>
            </WidgetCard>
          </VStack>
        </ScrollView>

        <DeleteAccountModal
          isOpen={isModalOpen}
          onClose={closeModal}
          inputCode={inputCode}
          onInputChange={setInputCode}
          canDelete={canDelete}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
        />
      </VStack>
    </SafeAreaView>
  );
}
