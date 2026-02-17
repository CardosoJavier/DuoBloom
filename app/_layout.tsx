import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { LoadingSplash } from "@/components/ui/LoadingSplash";
import "@/global.css";
import "@/i18n";
import { useAuthStore } from "@/store/authStore";

export const unstable_settings = {
  anchor: "(tabs)",
};

function InitialLayout() {
  const { isAuthenticated, isInitializing, checkAuth, checkSyncStatus } =
    useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const colorScheme = useColorScheme();

  const [isCheckingSync, setIsCheckingSync] = useState(true);

  useEffect(() => {
    checkAuth().finally(() => {
      // Once auth check is done, we can check sync status if authenticated
      setIsCheckingSync(false);
    });
  }, []);

  useEffect(() => {
    const handleNavigation = async () => {
      if (isInitializing || isCheckingSync) return;

      const inAuthGroup = segments[0] === "(auth)";

      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to the login page if not authenticated
        router.replace("/(auth)/login");
      } else if (isAuthenticated) {
        const isSynced = await checkSyncStatus();

        if (!isSynced) {
          // If not synced, force to bloom screen
          if (segments[1] !== "bloom") {
            router.replace("/(auth)/bloom");
          }
        } else if (inAuthGroup) {
          // If synced and in auth group, go to tabs
          router.replace("/(tabs)");
        }
      }
    };

    handleNavigation();
  }, [isAuthenticated, isInitializing, isCheckingSync, segments]);

  const backgroundColor = colorScheme === "dark" ? "#0E172A" : "#F8FAFC";

  if (isInitializing || (isAuthenticated && isCheckingSync)) {
    return <LoadingSplash />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor },
        headerShown: false,
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile/edit" options={{ presentation: "modal" }} />
      <Stack.Screen name="profile/settings" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GluestackUIProvider mode={colorScheme === "dark" ? "dark" : "light"}>
      <ThemeProvider value={DefaultTheme}>
        <InitialLayout />
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
