import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast as useGluestackToast,
} from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { useCallback } from "react";
import { useWindowDimensions } from "react-native";

type ToastType = "error" | "success" | "warning" | "info";

export const useAppToast = () => {
  const toast = useGluestackToast();
  const { width } = useWindowDimensions();

  const show = useCallback(
    (title: string, description?: string, type: ToastType = "info") => {
      const toastId = "toast-" + title + "-" + (description || "");

      toast.show({
        id: toastId,
        placement: "top",
        duration: 4000,
        render: ({ id }) => {
          const uniqueToastId = "toast-" + id;
          return (
            <Toast
              style={{ width: width * 0.9, marginTop: 10 }}
              nativeID={uniqueToastId}
              action={type}
              variant="solid"
            >
              <VStack space="xs">
                <ToastTitle className="text-white font-bold">
                  {title}
                </ToastTitle>
                {description && (
                  <ToastDescription className="text-white">
                    {description}
                  </ToastDescription>
                )}
              </VStack>
            </Toast>
          );
        },
      });
    },
    [toast, width],
  );

  return {
    show,
    success: (title: string, description?: string) =>
      show(title, description, "success"),
    error: (title: string, description?: string) =>
      show(title, description, "error"),
    warning: (title: string, description?: string) =>
      show(title, description, "warning"),
    info: (title: string, description?: string) =>
      show(title, description, "info"),
  };
};
