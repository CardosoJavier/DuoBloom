import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkoutsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <Box className="flex-1 justify-center items-center">
        <Text size="2xl" className="font-bold text-typography-900">
          Workouts
        </Text>
        <Text className="text-typography-500 mt-2">Coming Soon</Text>
      </Box>
    </SafeAreaView>
  );
}
