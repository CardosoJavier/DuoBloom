import { Plus } from "lucide-react-native";
import React from "react";
import { Fab, FabIcon } from "../fab";

interface FabButtonProps {
  readonly onPress: () => void;
  readonly icon?: React.ElementType;
}

export function FabButton({ onPress, icon = Plus }: FabButtonProps) {
  return (
    <Fab
      size="lg"
      className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 shadow-lg absolute bottom-6 right-6"
      onPress={onPress}
    >
      <FabIcon as={icon} className="text-white" />
    </Fab>
  );
}
