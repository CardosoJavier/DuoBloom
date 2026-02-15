import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { logout } = useAuthStore();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <Box className="flex-1 justify-center items-center p-6">
        <VStack space="lg" className="items-center">
          <Text size="2xl" className="font-bold">
            {t("common.welcome")}
          </Text>
          <Text className="text-center text-typography-500">
            {t("habits.strike_count", { count: 5 })}
          </Text>
          <Button action="negative" size="md" onPress={logout} className="mt-8">
            <ButtonText>Logout</ButtonText>
          </Button>
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
