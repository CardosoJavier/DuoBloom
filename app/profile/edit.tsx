import { syncApi } from "@/api/sync-api";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
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

  const handleSave = async () => {
    // TODO: Implement update profile API
    setIsSaving(true);
    // Simulate API call
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
            ); // Assuming this key exists
          } else {
            Alert.alert(t("common.error"), result.error?.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <VStack className="flex-1 p-6" space="xl">
        {/* Header */}
        <HStack className="justify-between items-center">
          <HStack space="sm" className="items-center">
            <Icon as={User} className="text-white" />
            <Heading className="text-white text-xl">
              {t("profile.edit_profile")}
            </Heading>
          </HStack>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon as={X} className="text-slate-400" />
          </TouchableOpacity>
        </HStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack space="2xl" className="mt-4 pb-10">
            {/* Avatar */}
            <Box className="self-center relative">
              <Box className="h-32 w-32 rounded-full bg-slate-800 items-center justify-center border-4 border-slate-700 overflow-hidden">
                <Icon as={User} size="xl" className="text-slate-500" />
              </Box>
              <TouchableOpacity className="absolute bottom-0 right-0 bg-white p-2 rounded-full border-4 border-slate-900">
                <Icon as={Camera} size="sm" className="text-slate-900" />
              </TouchableOpacity>
            </Box>

            {/* Form */}
            <VStack space="lg">
              <VStack space="xs">
                <Text className="text-slate-400 font-medium ml-1">
                  {t("auth.full_name")}
                </Text>
                <Input
                  size="xl"
                  className="border-slate-700 bg-slate-800/50 rounded-xl h-14"
                >
                  <InputSlot className="pl-4">
                    <InputIcon as={User} className="text-slate-500" />
                  </InputSlot>
                  <InputField
                    className="placeholder:text-slate-600"
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
                <Text className="text-slate-400 font-medium ml-1">
                  {t("auth.email_address")}
                </Text>
                <Input
                  size="xl"
                  className="border-slate-700 bg-slate-800/50 rounded-xl h-14"
                >
                  <InputSlot className="pl-4">
                    <InputIcon as={Mail} className="text-slate-500" />
                  </InputSlot>
                  <InputField
                    className="text-white placeholder:text-slate-600"
                    placeholder="alex@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Input>
                <Text className="text-slate-500 text-xs ml-1 mt-1">
                  {t("profile.email_update_warning")}
                </Text>
              </VStack>

              <VStack space="xs" className="mt-2">
                <HStack className="justify-between items-center mb-2">
                  <Text className="text-white font-medium text-lg">
                    {t("profile.change_password")}
                  </Text>
                  <Button variant="link" size="sm">
                    <ButtonText className="text-indigo-400 font-medium">
                      {t("common.edit")}
                    </ButtonText>
                  </Button>
                </HStack>
              </VStack>

              <Button
                size="xl"
                className="bg-indigo-500 rounded-xl mt-4 h-14"
                onPress={handleSave}
                isDisabled={isSaving}
              >
                {isSaving ? (
                  <ButtonText>{t("common.saving")}</ButtonText>
                ) : (
                  <ButtonText className="font-bold">
                    {t("profile.save_changes")}
                  </ButtonText>
                )}
              </Button>
            </VStack>

            {/* Danger Zone */}
            <VStack space="md" className="border-t border-slate-800 pt-6 mt-2">
              <HStack space="sm" className="items-center">
                <Icon as={AlertTriangle} className="text-red-500" size="sm" />
                <Text className="text-red-500 font-bold">
                  {t("profile.danger_zone")}
                </Text>
              </HStack>
              <Button
                variant="outline"
                action="negative"
                onPress={handleUnlink}
                className="border-red-500/50 rounded-xl h-12 justify-start pl-4"
              >
                <ButtonText className="text-red-500 text-sm">
                  {t("profile.unlink_partner")}
                </ButtonText>
              </Button>
              <Button
                variant="outline"
                action="negative"
                className="border-red-500/50 rounded-xl h-12 justify-start pl-4"
              >
                <ButtonText className="text-red-500 text-sm">
                  {t("profile.delete_account")}
                </ButtonText>
              </Button>
            </VStack>
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
}
