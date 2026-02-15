import { Box } from "@/components/ui/box";
import { Spinner } from "@/components/ui/spinner";
import { VStack } from "@/components/ui/vstack";
import React from "react";
import { Image } from "react-native";

export const LoadingSplash = () => {
  return (
    <Box className="flex-1 justify-center items-center bg-background-0">
      <VStack space="xl" className="items-center">
        <Image
          source={require("@/assets/images/react-logo.png")}
          style={{ width: 120, height: 120, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Spinner size="large" color="$primary500" />
      </VStack>
    </Box>
  );
};
