import { AddMealModal } from "@/components/meals/AddMealModal";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import { Alert } from "react-native";

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: "Images",
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("AddMealModal", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows an alert when camera permission is denied", async () => {
    const mockRequestCameraPermissionsAsync =
      ImagePicker.requestCameraPermissionsAsync as jest.Mock;
    mockRequestCameraPermissionsAsync.mockResolvedValueOnce({
      status: "denied",
    });

    // spy on alert
    const alertSpy = jest.spyOn(Alert, "alert");

    const { getByText } = render(
      <AddMealModal isOpen={true} onClose={jest.fn()} onSave={jest.fn()} />,
    );

    const cameraButton = getByText("Camera");
    fireEvent.press(cameraButton);

    await waitFor(() => {
      expect(mockRequestCameraPermissionsAsync).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        "common.error",
        "meals.camera_permission_required",
      );
    });

    alertSpy.mockRestore();
  });
});
