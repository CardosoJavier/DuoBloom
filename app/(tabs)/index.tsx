import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/store/authStore";
import { Box } from "@/components/ui/box";

export default function HomeScreen() {
  const { logout } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <Box className="flex-1 justify-center items-center p-6">
        <VStack space="lg" className="items-center">
          <Text size="2xl" className="font-bold">Welcome to Sync!</Text>
          <Text className="text-center text-typography-500">
            You are successfully logged in and ready to track your fitness with your partner.
          </Text>
          <Button action="negative" size="md" onPress={logout} className="mt-8">
            <ButtonText>Logout</ButtonText>
          </Button>
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
