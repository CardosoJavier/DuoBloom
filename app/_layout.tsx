import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import "react-native-reanimated";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import "@/i18n";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

export const unstable_settings = {
  anchor: "(tabs)",
};

function InitialLayout() {
  const { isAuthenticated, isInitializing, checkAuth, checkSyncStatus } =
    useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [isCheckingSync, setIsCheckingSync] = useState(true);

  useEffect(() => {
    checkAuth().finally(() => {
      setIsCheckingSync(false);
    });
  }, []);

  useEffect(() => {
    const handleNavigation = async () => {
      if (isInitializing || isCheckingSync) return;

      const inAuthGroup = segments[0] === "(auth)";

      if (!isAuthenticated && !inAuthGroup) {
        router.replace("/(auth)/login");
      } else if (isAuthenticated) {
        // Check if user is synced (Partner Requirement)
        const isSynced = await checkSyncStatus();

        if (!isSynced) {
          if (segments[1] !== "bloom") {
            router.replace("/(auth)/bloom");
          }
        } else if (inAuthGroup) {
          router.replace("/(tabs)");
        }
      }
    };

    handleNavigation();
  }, [isAuthenticated, isInitializing, isCheckingSync, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationTypeForReplace: "push",
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile/edit" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="profile/settings"
        options={{ presentation: "modal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const { colorScheme, isThemeHydrated, hydrate } = useAppStore();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30 s — avoids redundant refetches within the same session
            gcTime: 5 * 60_000, // 5 min garbage-collect
            refetchOnWindowFocus: true, // works once focusManager is wired below
            retry: 1,
          },
        },
      }),
  );

  // Wire TanStack focusManager to React Native's AppState so
  // refetchOnWindowFocus fires when the app comes back to the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        focusManager.setFocused(status === "active");
      },
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    hydrate();
  }, []);

  if (!isThemeHydrated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider mode={colorScheme}>
        <ThemeProvider value={DefaultTheme}>
          <InitialLayout />
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </ThemeProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
