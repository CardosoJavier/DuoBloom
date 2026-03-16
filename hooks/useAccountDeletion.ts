import { userApi } from "@/api/user-api";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";

export function useAccountDeletion() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useAppToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete =
    inputCode.trim().toUpperCase() === (user?.pairCode ?? "").toUpperCase() &&
    inputCode.trim().length > 0;

  const openModal = () => {
    setInputCode("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isDeleting) return;
    setInputCode("");
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!canDelete || !user?.id) return;

    Keyboard.dismiss();
    setIsDeleting(true);
    const result = await userApi.deleteAccount(user.id);
    setIsDeleting(false);

    if (result.success) {
      await logout();
      router.replace("/(auth)/login");
    } else {
      setIsModalOpen(false); // close before toast — useRNModal renders above toast layer
      toast.error(
        t("profile.delete_account"),
        t("profile.delete_account_error"),
      );
    }
  };

  return {
    isModalOpen,
    inputCode,
    setInputCode,
    isDeleting,
    canDelete,
    openModal,
    closeModal,
    handleDelete,
  };
}
