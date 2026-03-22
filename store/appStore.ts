import i18n from "@/i18n";
import { Language } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { Appearance } from "react-native";
import { create } from "zustand";

type Theme = "light" | "dark" | "system";
type ColorScheme = "light" | "dark";

const SUPPORTED_LANGS = ["en", "es"];

function resolveLanguage(lang: Language): string {
  if (lang === "system") {
    const deviceLang = Localization.getLocales()[0]?.languageCode ?? "en";
    return SUPPORTED_LANGS.includes(deviceLang) ? deviceLang : "en";
  }
  return lang;
}

interface AppState {
  theme: Theme;
  language: Language;
  colorScheme: ColorScheme;
  isThemeHydrated: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  hydrate: () => Promise<void>;
}

const THEME_STORAGE_KEY = "app_theme";
const LANGUAGE_STORAGE_KEY = "app_language";

export const useAppStore = create<AppState>((set, get) => ({
  theme: "system",
  language: "system",
  colorScheme: Appearance.getColorScheme() ?? "light",
  isThemeHydrated: false,

  setTheme: async (theme: Theme) => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    const newColorScheme =
      theme === "system" ? (Appearance.getColorScheme() ?? "light") : theme;
    set({ theme, colorScheme: newColorScheme });
  },

  setLanguage: async (language: Language) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    i18n.changeLanguage(resolveLanguage(language));
    set({ language });
  },

  hydrate: async () => {
    try {
      const storedTheme = (await AsyncStorage.getItem(
        THEME_STORAGE_KEY,
      )) as Theme | null;
      const storedLanguage = (await AsyncStorage.getItem(
        LANGUAGE_STORAGE_KEY,
      )) as Language | null;

      const initialTheme = storedTheme || "system";
      const initialLanguage: Language = storedLanguage || "system";

      const initialColorScheme =
        initialTheme === "system"
          ? (Appearance.getColorScheme() ?? "light")
          : initialTheme;

      i18n.changeLanguage(resolveLanguage(initialLanguage));

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
