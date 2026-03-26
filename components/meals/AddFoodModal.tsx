import { FoodSearchResult, MealType } from "@/types/food-log";
import { Search, X } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, TextInput } from "react-native";
import { Divider } from "../ui/divider";
import { Heading } from "../ui/heading";
import { HStack } from "../ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "../ui/input";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
} from "../ui/modal";
import { Pressable } from "../ui/pressable";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";

// ── Dummy data ─────────────────────────────────────────────────────────────────

const DUMMY_RESULTS: FoodSearchResult[] = [
  {
    id: "d1",
    name: "Chicken Breast",
    brand: "Generic",
    kcalPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
  },
  {
    id: "d2",
    name: "Brown Rice (cooked)",
    brand: "Generic",
    kcalPer100g: 112,
    proteinPer100g: 2.6,
    carbsPer100g: 23.5,
    fatPer100g: 0.9,
  },
  {
    id: "d3",
    name: "Greek Yogurt",
    brand: "Chobani",
    kcalPer100g: 97,
    proteinPer100g: 9,
    carbsPer100g: 3.6,
    fatPer100g: 5,
  },
  {
    id: "d4",
    name: "Whole Egg",
    brand: "Generic",
    kcalPer100g: 143,
    proteinPer100g: 13,
    carbsPer100g: 1.1,
    fatPer100g: 9.5,
  },
  {
    id: "d5",
    name: "Avocado",
    kcalPer100g: 160,
    proteinPer100g: 2,
    carbsPer100g: 9,
    fatPer100g: 15,
  },
  {
    id: "d6",
    name: "Almond Butter",
    brand: "Justin's",
    kcalPer100g: 614,
    proteinPer100g: 21,
    carbsPer100g: 19,
    fatPer100g: 56,
  },
  {
    id: "d7",
    name: "Oat Milk",
    brand: "Oatly",
    kcalPer100g: 46,
    proteinPer100g: 1,
    carbsPer100g: 6.6,
    fatPer100g: 1.5,
  },
  {
    id: "d8",
    name: "Sweet Potato (baked)",
    kcalPer100g: 90,
    proteinPer100g: 2,
    carbsPer100g: 20.7,
    fatPer100g: 0.1,
  },
  {
    id: "d9",
    name: "Salmon Fillet",
    brand: "Wild Catch",
    kcalPer100g: 208,
    proteinPer100g: 20,
    carbsPer100g: 0,
    fatPer100g: 13,
  },
  {
    id: "d10",
    name: "Banana",
    kcalPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 23,
    fatPer100g: 0.3,
  },
  {
    id: "d11",
    name: "Oatmeal (cooked)",
    brand: "Quaker",
    kcalPer100g: 71,
    proteinPer100g: 2.5,
    carbsPer100g: 12,
    fatPer100g: 1.5,
  },
  {
    id: "d12",
    name: "Whole Milk",
    brand: "Organic Valley",
    kcalPer100g: 61,
    proteinPer100g: 3.2,
    carbsPer100g: 4.8,
    fatPer100g: 3.3,
  },
];

function mockSearch(query: string): FoodSearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return DUMMY_RESULTS.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      (item.brand?.toLowerCase().includes(q) ?? false),
  );
}

// ── ResultRow ──────────────────────────────────────────────────────────────────

interface ResultRowProps {
  readonly item: FoodSearchResult;
  readonly isLast: boolean;
  readonly onPress: (item: FoodSearchResult) => void;
}

function ResultRow({ item, isLast, onPress }: ResultRowProps) {
  return (
    <>
      <Pressable onPress={() => onPress(item)} className="py-3 px-1">
        <HStack className="items-center justify-between">
          <VStack className="flex-1 gap-0.5">
            <Text className="text-typography-900 dark:text-typography-50 text-sm font-medium">
              {item.name}
            </Text>
            {item.brand && (
              <Text className="text-typography-400 text-xs">{item.brand}</Text>
            )}
          </VStack>
          <Text className="text-typography-500 text-sm ml-4">
            {item.kcalPer100g} kcal
          </Text>
        </HStack>
      </Pressable>
      {!isLast && (
        <Divider className="bg-background-100 dark:bg-background-700" />
      )}
    </>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export interface AddFoodModalProps {
  readonly isOpen: boolean;
  readonly mealType: MealType | null;
  readonly onClose: () => void;
  readonly onSelectFood: (item: FoodSearchResult, mealType: MealType) => void;
}

export function AddFoodModal({
  isOpen,
  mealType,
  onClose,
  onSelectFood,
}: AddFoodModalProps) {
  const { t } = useTranslation();
  const searchRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const mealLabel = mealType ? t(`meals.${mealType}`) : "";

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    // Simulate async latency; replace with real API call later
    setTimeout(() => {
      setResults(mockSearch(text));
      setIsSearching(false);
    }, 300);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    searchRef.current?.focus();
  };

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setIsSearching(false);
    onClose();
  };

  const handleSelect = (item: FoodSearchResult) => {
    if (!mealType) return;
    onSelectFood(item, mealType);
    handleClose();
  };

  const renderBody = () => {
    if (isSearching) {
      return (
        <HStack className="justify-center py-10">
          <ActivityIndicator size="small" />
        </HStack>
      );
    }
    if (!query.trim()) {
      return (
        <Text className="text-typography-400 text-sm text-center mt-10">
          {t("meals.search_placeholder")}
        </Text>
      );
    }
    if (results.length === 0) {
      return (
        <Text className="text-typography-400 text-sm text-center mt-10">
          {t("meals.search_no_results")}
        </Text>
      );
    }
    return results.map((item, index) => (
      <ResultRow
        key={item.id}
        item={item}
        isLast={index === results.length - 1}
        onPress={handleSelect}
      />
    ));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full">
      <ModalBackdrop />
      <ModalContent className="bg-background-0 border border-outline-100 rounded-t-3xl mt-auto mb-0 h-[80%] dark:border-outline-800">
        <ModalHeader className="pb-3">
          <HStack className="flex-1 items-center justify-between">
            <Heading
              size="md"
              className="text-typography-900 dark:text-typography-50"
            >
              {t("meals.add_food_to", { meal: mealLabel })}
            </Heading>
            <ModalCloseButton>
              <Pressable onPress={handleClose} className="p-1">
                <X size={20} color="#6b7280" />
              </Pressable>
            </ModalCloseButton>
          </HStack>
        </ModalHeader>

        {/* Search input sits outside ModalBody so it stays pinned while results scroll */}
        <Input
          variant="outline"
          size="md"
          className="mx-4 mb-3 bg-background-50 dark:bg-background-100"
        >
          <InputSlot className="pl-3">
            <InputIcon as={Search} className="text-typography-400" />
          </InputSlot>
          <InputField
            ref={searchRef as React.Ref<any>}
            value={query}
            onChangeText={handleChangeText}
            placeholder={t("meals.search_placeholder")}
            returnKeyType="search"
            autoCorrect={false}
            autoFocus
          />
          {query.length > 0 && (
            <InputSlot className="pr-3" onPress={handleClear}>
              <InputIcon as={X} className="text-typography-400" />
            </InputSlot>
          )}
        </Input>

        <Divider className="bg-background-100 dark:bg-background-700" />

        <ModalBody className="flex-1 px-4 pt-2 pb-6">{renderBody()}</ModalBody>
      </ModalContent>
    </Modal>
  );
}
