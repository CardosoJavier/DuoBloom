import { addConsumedMeal } from "@/api/meals-api";
import { MealsView } from "@/components/meals/MealsView";
import { supabase } from "@/util/supabase";
import { act, render } from "@testing-library/react-native";
import * as FileSystem from "expo-file-system";
import React from "react";

// Mock everything need for MealsView
jest.mock("@/util/supabase", () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        createSignedUploadUrl: jest.fn(),
        uploadToSignedUrl: jest.fn(),
        remove: jest.fn(),
        createSignedUrl: jest.fn(),
      })),
    },
  },
}));

jest.mock("@/api/meals-api", () => ({
  getConsumedMeals: jest.fn().mockResolvedValue({ success: true, data: [] }),
  addConsumedMeal: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn().mockReturnValue("mock-uuid"),
}));

jest.mock("expo-file-system", () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: "base64",
  },
}));

jest.mock("base64-arraybuffer", () => ({
  decode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
}));

jest.mock("@/store/authStore", () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: "user-1" },
    partner: { id: "partner-1" },
  })),
}));

jest.mock("@/hooks/use-app-toast", () => ({
  useAppToast: () => ({
    error: jest.fn(),
    success: jest.fn(),
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// We need to test the component's internal function, but since it's hard to access directly
// without triggering the entire tree, we test it through the modal save
jest.mock("@/components/meals/AddMealModal", () => ({
  AddMealModal: ({ onSave, isOpen }: any) => {
    // Expose a button to easily trigger onSave for testing
    const { Button, Text } = require("react-native");
    if (!isOpen) return null;
    return (
      <Button
        title="Mock Save"
        testID="mock-save"
        onPress={() =>
          onSave({ name: "Test", calories: 100, uri: "file://test.jpg" })
        }
      />
    );
  },
}));

describe("MealsView Upload & Rollback Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rolls back storage upload if database save fails", async () => {
    // Setup successful storage methods
    const fromMock = supabase.storage.from as jest.Mock;

    const mockCreateSignedUploadUrl = jest.fn().mockResolvedValue({
      data: { token: "mock-token" },
      error: null,
    });

    const mockUploadToSignedUrl = jest.fn().mockResolvedValue({
      data: { path: "meals/user-1/mock-uuid.jpg" },
      error: null,
    });

    const mockRemove = jest.fn().mockResolvedValue({ error: null });

    // We only need the createSignedUrl for the initial fetch that runs on mount
    const mockCreateSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: "http://example.com/mock.jpg" },
      error: null,
    });

    fromMock.mockImplementation(() => ({
      createSignedUploadUrl: mockCreateSignedUploadUrl,
      uploadToSignedUrl: mockUploadToSignedUrl,
      remove: mockRemove,
      createSignedUrl: mockCreateSignedUrl,
    }));

    // Setup base file system and decode mocks
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      "mock-base64",
    );

    // Setup failing database save
    (addConsumedMeal as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: { message: "Database constraint failed" },
    });

    const { getByTestId, getByAccessibilityHint } = render(<MealsView />);

    // Open the modal by clicking the FAB
    await act(async () => {
      // Fab doesn't have an easy label, let's just trigger it directly by forcing state or adding a testID if needed.
      // Wait, let me adjust the mock to just be open to simplify
    });
  });
});
