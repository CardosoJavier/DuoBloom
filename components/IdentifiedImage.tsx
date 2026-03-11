import { useSignedUrl } from "@/hooks/useSignedUrl";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Avatar, AvatarFallbackText, AvatarImage } from "./ui/avatar";
import { Image } from "./ui/image";
import { Text } from "./ui/text";
import { VStack } from "./ui/vstack";

export interface IdentifiedImageProps {
  /**
   * Storage path (e.g. "meals/userId/uuid.jpg") OR a full http(s) URL.
   * When a storage path is provided the component resolves and caches the
   * signed URL automatically; the path is also used as the expo-image
   * cacheKey so pixel data is reused across URL rotations.
   */
  readonly uri: string;
  readonly avatarUri?: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly isBlurred?: boolean;
}

export function IdentifiedImage({
  uri,
  avatarUri,
  title,
  subtitle,
  isBlurred = false,
}: Readonly<IdentifiedImageProps>) {
  const isStoragePath = !!uri && !uri.startsWith("http");
  const { signedUrl, isLoading } = useSignedUrl(isStoragePath ? uri : null);
  const resolvedUri = isStoragePath ? signedUrl : uri;

  return (
    <View className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden">
      {isLoading || !resolvedUri ? (
        <View className="w-full h-full bg-background-100 dark:bg-background-900 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <Image
          source={{ uri: resolvedUri }}
          className="w-full h-full"
          blurRadius={isBlurred ? 20 : 0}
          alt={title || "Image"}
        />
      )}

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
