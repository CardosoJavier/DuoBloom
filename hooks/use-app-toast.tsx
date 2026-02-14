import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast as useGluestackToast,
} from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { useCallback, useRef } from "react";
import { useWindowDimensions } from "react-native";

type ToastType = "error" | "success" | "warning" | "info";

export const useAppToast = () => {
  const toast = useGluestackToast();
  const toastIdRef = useRef<string | null>(null);
  const { width } = useWindowDimensions();

  const show = useCallback(
    (title: string, description?: string, type: ToastType = "info") => {
      // Prevent duplicate toasts if the same message is shown rapidly
      if (toastIdRef.current) {
        toast.close(toastIdRef.current);
      }

      const newId = Math.random().toString();
      toastIdRef.current = newId;

      toast.show({
        id: newId,
        placement: "top",
        duration: 3000,
        render: ({ id }) => {
          const uniqueToastId = "toast-" + id;
          return (
            <Toast
              style={{ width: width * 0.8 }}
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
