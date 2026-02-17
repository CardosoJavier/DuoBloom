import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { create } from "zustand";

type Theme = "light" | "dark" | "system";
type ColorScheme = "light" | "dark";

interface AppState {
  theme: Theme;
  colorScheme: ColorScheme;
  isThemeHydrated: boolean;
  setTheme: (theme: Theme) => void;
  hydrateTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = "app_theme";

export const useAppStore = create<AppState>((set, get) => ({
  theme: "system",
  colorScheme: Appearance.getColorScheme() ?? "light",
  isThemeHydrated: false,

  setTheme: async (theme: Theme) => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    const newColorScheme =
      theme === "system" ? Appearance.getColorScheme() ?? "light" : theme;
    set({ theme, colorScheme: newColorScheme });
  },

  hydrateTheme: async () => {
    try {
      const storedTheme = (await AsyncStorage.getItem(THEME_STORAGE_KEY)) as Theme | null;
      const initialTheme = storedTheme || "system";
      const initialColorScheme =
        initialTheme === "system"
          ? Appearance.getColorScheme() ?? "light"
          : initialTheme;

      set({
        theme: initialTheme,
        colorScheme: initialColorScheme,
        isThemeHydrated: true,
      });
    } catch (e) {
      // An error occurred, so we'll just use defaults
      set({ isThemeHydrated: true });
    }
  },
}));

// Listen to system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { theme } = useAppStore.getState();
  if (theme === "system") {
    useAppStore.setState({ colorScheme: colorScheme ?? "light" });
  }
});
