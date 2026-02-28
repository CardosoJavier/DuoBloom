import React from "react";
import { Button, ButtonGroup, ButtonText } from "./ui/button";

export interface SegmentedControlProps {
  options: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  containerStyle?: any; // Allow for layout overrides
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedValue,
  onValueChange,
  containerStyle,
}) => {
  return (
    <ButtonGroup
      space="xs"
      flexDirection="row"
      className={`bg-slate-800 p-1 rounded-2xl w-full items-center ${
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
              isActive ? "bg-slate-600 shadow-sm" : "bg-transparent shadow-none"
            }`}
          >
            <ButtonText
              className={`${
                isActive ? "text-white font-bold" : "text-slate-400 font-medium"
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
