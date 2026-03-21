import { Check } from "lucide-react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import { HStack } from "../hstack";
import { Icon } from "../icon";
import { Text } from "../text";
import { VStack } from "../vstack";

export interface SelectionOption {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface SelectionGroupProps {
  readonly title: string;
  readonly titleIcon?: React.ElementType;
  readonly options: SelectionOption[];
  readonly selected: string | string[];
  readonly onSelect: (id: string) => void;
  readonly direction?: "horizontal" | "vertical";
}

export function SelectionGroup({
  title,
  titleIcon,
  options,
  selected,
  onSelect,
  direction = "vertical",
}: SelectionGroupProps) {
  const isActive = (id: string) =>
    Array.isArray(selected) ? selected.includes(id) : selected === id;

  const renderOption = (option: SelectionOption, flex1: boolean) => {
    const active = isActive(option.id);
    return (
      <TouchableOpacity
        key={option.id}
        onPress={() => onSelect(option.id)}
        className={`${flex1 ? "flex-1 " : ""}p-4 rounded-xl border ${
          active
            ? "border-primary-500"
            : "border-slate-200 dark:border-slate-600"
        } bg-background-widget flex-row justify-between items-center`}
      >
        <HStack space="md" className="items-center">
          {option.icon && (
            <Icon
              as={option.icon}
              size="sm"
              className={active ? "text-primary-500" : "text-typography-500"}
            />
          )}
          <Text
            className={
              active
                ? "text-primary-500 font-bold"
                : "text-typography-700 dark:text-typography-50"
            }
          >
            {option.label}
          </Text>
        </HStack>
        {active && <Icon as={Check} size="sm" className="text-primary-500" />}
      </TouchableOpacity>
    );
  };

  return (
    <VStack space="md">
      <HStack space="sm" className="items-center ml-1">
        {titleIcon && (
          <Icon as={titleIcon} size="xs" className="text-typography-500" />
        )}
        <Text className="text-typography-500 font-medium text-xs uppercase tracking-wider">
          {title}
        </Text>
      </HStack>
      {direction === "horizontal" ? (
        <HStack space="md">
          {options.map((option) => renderOption(option, true))}
        </HStack>
      ) : (
        <VStack space="sm">
          {options.map((option) => renderOption(option, false))}
        </VStack>
      )}
    </VStack>
  );
}
