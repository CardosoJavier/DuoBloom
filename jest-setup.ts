import "react-native-reanimated";

// Mock env vars
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_KEY = "mock-key";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock Expo Router
jest.mock("expo-router", () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: jest.fn().mockReturnValue([]),
  Link: "Link",
  Stack: {
    Screen: "Screen",
  },
}));

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock Gluestack UI Provider to avoid issues in tests if not needed or provide simple wrapper
// Actually, RNTL works best if we wrap components with providers.
// But for unit tests, we might mock specific UI components if they are heavy.
// For now, let's keep it simple.

// Mock Lucide Icons
jest.mock("lucide-react-native", () => ({
  Eye: "Eye",
  EyeOff: "EyeOff",
  Mail: "Mail",
  Lock: "Lock",
  User: "User",
  ArrowRight: "ArrowRight",
  Heart: "Heart",
  Share2: "Share2",
  Link: "Link",
  CheckCircle: "CheckCircle",
  AlertTriangle: "AlertTriangle",
  XCircle: "XCircle",
}));

// Mock Reanimated
require("react-native-reanimated").setUpTests();

// Mock Supabase
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    verifyOtp: jest.fn(),
    resend: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
};

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => mockSupabase),
}));

jest.mock("@/util/supabase", () => ({
  supabase: mockSupabase,
}));

// Mock use-app-toast hook
jest.mock("@/hooks/use-app-toast", () => ({
  useAppToast: jest.fn().mockReturnValue({
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  }),
}));

// Mock AuthStore
jest.mock("@/store/authStore", () => ({
  useAuthStore: jest.fn(() => ({
    login: jest.fn(),
    signUp: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    isAuthenticated: false,
    needsEmailConfirmation: false,
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  })),
}));
