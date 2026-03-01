import { Box } from "@/components/ui/box";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Text } from "@/components/ui/text";
import { Plus } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { DateNavigator } from "../DateNavigator";
import { IdentifiedImage } from "../IdentifiedImage";
import { AddMealModal } from "./AddMealModal";

export function MealsView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meals, setMeals] = useState<any[]>([
    {
      id: "1",
      userId: "1", // current user
      name: "Oatmeal Bowl",
      calories: 350,
      uri: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&q=80",
      timestamp: "8:30 AM",
    },
    {
      id: "2",
      userId: "partner123", // partner
      name: "Avocado Toast",
      calories: 420,
      uri: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=800&q=80",
      timestamp: "9:00 AM",
    },
  ]);

  const handleAddMeal = (mealInfo: {
    name: string;
    calories: number;
    uri: string;
  }) => {
    setMeals((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        userId: "1", // newly added is always by current user
        name: mealInfo.name,
        calories: mealInfo.calories,
        uri: mealInfo.uri,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const getAvatarForUser = (userId: string) => {
    return userId === "1"
      ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&q=80" // User Avatar
      : "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80"; // Partner Avatar
  };

  return (
    <Box className="flex-1 bg-background-0 relative">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <DateNavigator
          date={selectedDate}
          onDateChange={(newDate) => setSelectedDate(newDate)}
          className="mb-8"
        />

        <Text
          size="xl"
          className="font-bold text-typography-900 dark:text-white mb-4"
        >
          Shared Meals
        </Text>

        <View className="flex-row flex-wrap justify-between">
          {meals.map((meal) => (
            <View key={meal.id} className="w-[48%] mb-4">
              <IdentifiedImage
                uri={meal.uri}
                avatarUri={getAvatarForUser(meal.userId)}
                title={meal.name}
                subtitle={`${meal.calories} kcal | ${meal.timestamp}`}
              />
            </View>
          ))}
          {meals.length === 0 && (
            <Text className="text-typography-500 w-full text-center mt-10">
              No meals logged today yet.
            </Text>
          )}
        </View>
      </ScrollView>

      <Fab
        size="lg"
        placement="bottom right"
        className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 shadow-lg absolute bottom-6 right-6"
        onPress={() => setIsModalOpen(true)}
      >
        <FabIcon as={Plus} className="text-white" />
      </Fab>

      <AddMealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddMeal}
      />
    </Box>
  );
}
