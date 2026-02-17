import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { create } from "zustand";
import i18n from "@/i18n";

type Theme = "light" | "dark" | "system";
type ColorScheme = "light" | "dark";

interface AppState {
  theme: Theme;
  language: string;
  colorScheme: ColorScheme;
  isThemeHydrated: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: string) => void;
  hydrate: () => Promise<void>;
}

const THEME_STORAGE_KEY = "app_theme";
const LANGUAGE_STORAGE_KEY = "app_language";

export const useAppStore = create<AppState>((set, get) => ({
  theme: "system",
  language: "en",
  colorScheme: Appearance.getColorScheme() ?? "light",
  isThemeHydrated: false,

  setTheme: async (theme: Theme) => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    const newColorScheme =
      theme === "system" ? Appearance.getColorScheme() ?? "light" : theme;
    set({ theme, colorScheme: newColorScheme });
  },

  setLanguage: async (language: string) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    i18n.changeLanguage(language);
    set({ language });
  },

  hydrate: async () => {
    try {
      const storedTheme = (await AsyncStorage.getItem(THEME_STORAGE_KEY)) as Theme | null;
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      const initialTheme = storedTheme || "system";
      const initialLanguage = storedLanguage || "en";

      const initialColorScheme =
        initialTheme === "system"
          ? Appearance.getColorScheme() ?? "light"
          : initialTheme;

      i18n.changeLanguage(initialLanguage);

      set({
        theme: initialTheme,
        language: initialLanguage,
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
