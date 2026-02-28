import { useAppStore } from "@/store/appStore";
import React from "react";
import { Button, ButtonGroup, ButtonText } from "./ui/button";

export interface SegmentedControlProps {
  options: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  containerStyle?: any;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedValue,
  onValueChange,
  containerStyle,
}) => {
  const { theme } = useAppStore();

  return (
    <ButtonGroup
      space="xs"
      flexDirection="row"
      className={`
        p-1 rounded-2xl w-full items-center 
        ${theme === "light" ? `bg-[#EEF0F6] ` : `bg-[#162032]`}
        ${
          containerStyle?.className ||
          (typeof containerStyle === "string" ? containerStyle : "")
        }`}
      style={
        containerStyle?.style
          ? containerStyle.style
          : typeof containerStyle === "object" && !containerStyle.className
            ? containerStyle
            : undefined
      }
    >
      {options.map((option) => {
        const isActive = selectedValue === option;

        return (
          <Button
            key={option}
            size="md"
            action={isActive ? "dark" : "default"}
            onPress={() => onValueChange(option)}
            className={`flex-1 rounded-xl h-11 border-0 ${
              isActive
                ? theme === "light"
                  ? "bg-white"
                  : "bg-[#334156]"
                : "bg-transparent"
            }`}
          >
            <ButtonText
              className={`${
                isActive
                  ? theme === "light"
                    ? "text-slate-800 font-bold"
                    : ""
                  : "text-slate-400 font-medium"
              }`}
            >
              {option}
            </ButtonText>
          </Button>
        );
      })}
    </ButtonGroup>
  );
};
