import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View } from "react-native";
import { Avatar, AvatarFallbackText, AvatarImage } from "./ui/avatar";
import { Image } from "./ui/image";
import { Text } from "./ui/text";
import { VStack } from "./ui/vstack";

export interface IdentifiedImageProps {
  uri: string;
  avatarUri?: string;
  title?: string;
  subtitle?: string;
  isBlurred?: boolean;
}

export function IdentifiedImage({
  uri,
  avatarUri,
  title,
  subtitle,
  isBlurred = false,
}: IdentifiedImageProps) {
  return (
    <View className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden">
      <Image
        source={{ uri }}
        className="w-full h-full"
        blurRadius={isBlurred ? 20 : 0}
        alt={title || "Image"}
      />

      {/* Avatar Overlay - Top Right */}
      {avatarUri && (
        <View className="absolute top-3 right-3">
          <Avatar
            size="sm"
            className="border-2 border-background-0 dark:border-background-950"
          >
            <AvatarFallbackText>{title?.[0] || "U"}</AvatarFallbackText>
            <AvatarImage source={{ uri: avatarUri }} />
          </Avatar>
        </View>
      )}

      {/* Content Overlay - Bottom */}
      {(title || subtitle) && (
        <View className="absolute bottom-0 left-0 right-0 h-1/2 justify-end">
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            className="absolute inset-0"
          />
          <VStack className="p-4 z-10 gap-1">
            {title && (
              <Text className="text-white font-bold text-lg" numberOfLines={1}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                className="text-typography-200 font-medium text-xs"
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </VStack>
        </View>
      )}
    </View>
  );
}
