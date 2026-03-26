import { FoodSearchResult } from "@/types/food-log";
import { Search, X } from "lucide-react-native";
import React, { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, TextInput, View } from "react-native";
import { Card } from "../ui/card";
import { HStack } from "../ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "../ui/input";
import { Pressable } from "../ui/pressable";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";

export interface FoodSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  results: FoodSearchResult[];
  onSelectResult: (item: FoodSearchResult) => void;
  isSearching?: boolean;
}

export const FoodSearchBar = forwardRef<TextInput, FoodSearchBarProps>(
  function FoodSearchBar(
    {
      value,
      onChangeText,
      onClear,
      results,
      onSelectResult,
      isSearching = false,
    },
    ref,
  ) {
    const { t } = useTranslation();
    const showDropdown = value.length > 0;

    const renderDropdownContent = () => {
      if (isSearching) {
        return (
          <HStack className="justify-center py-4">
            <ActivityIndicator size="small" />
          </HStack>
        );
      }
      if (results.length === 0) {
        return (
          <HStack className="justify-center py-4">
            <Text className="text-typography-400 text-sm">
              {t("meals.search_no_results")}
            </Text>
          </HStack>
        );
      }
      return results.map((item, index) => (
        <Pressable
          key={item.id}
          onPress={() => onSelectResult(item)}
          className={`px-4 py-3 ${
            index < results.length - 1
              ? "border-b border-background-200 dark:border-background-700"
              : ""
          }`}
        >
          <HStack className="items-center justify-between">
            <VStack className="flex-1 gap-0.5">
              <Text className="text-typography-900 dark:text-typography-50 text-sm font-medium">
                {item.name}
              </Text>
              {item.brand && (
                <Text className="text-typography-400 text-xs">
                  {item.brand}
                </Text>
              )}
            </VStack>
            <Text className="text-typography-500 text-sm ml-3">
              {item.kcalPer100g} kcal
            </Text>
          </HStack>
        </Pressable>
      ));
    };

    return (
      <View className="relative z-10">
        <Input
          variant="outline"
          size="md"
          className="bg-background-50 dark:bg-background-100"
        >
          <InputSlot className="pl-3">
            <InputIcon as={Search} className="text-typography-400" />
          </InputSlot>
          <InputField
            ref={ref as React.Ref<any>}
            value={value}
            onChangeText={onChangeText}
            placeholder={t("meals.search_placeholder")}
            returnKeyType="search"
            autoCorrect={false}
          />
          {value.length > 0 && (
            <InputSlot className="pr-3" onPress={onClear}>
              <InputIcon as={X} className="text-typography-400" />
            </InputSlot>
          )}
        </Input>

        {showDropdown && (
          <Card
            variant="outline"
            className="absolute top-full left-0 right-0 mt-1 p-0 overflow-hidden z-50 shadow-md"
          >
            {renderDropdownContent()}
          </Card>
        )}
      </View>
    );
  },
);
