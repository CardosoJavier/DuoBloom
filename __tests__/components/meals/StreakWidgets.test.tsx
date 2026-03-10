import { StreakWidgets } from "@/components/meals/StreakWidgets";
import { render } from "@testing-library/react-native";
import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// StreakWidgets
// ─────────────────────────────────────────────────────────────────────────────

describe("StreakWidgets", () => {
  it("renders the current streak day count", () => {
    const { getByText } = render(
      <StreakWidgets currentStreakDays={7} completionPercent={85} />,
    );
    expect(getByText("7")).toBeTruthy();
  });

  it("renders the completion percentage value", () => {
    const { getByText } = render(
      <StreakWidgets currentStreakDays={7} completionPercent={85} />,
    );
    expect(getByText("85")).toBeTruthy();
  });

  it("renders the percent symbol alongside completion value", () => {
    const { getByText } = render(
      <StreakWidgets currentStreakDays={7} completionPercent={85} />,
    );
    expect(getByText("%")).toBeTruthy();
  });

  it("renders i18n label keys for headers", () => {
    const { getByText } = render(
      <StreakWidgets currentStreakDays={7} completionPercent={85} />,
    );
    // useTranslation returns (key) => key in test env
    expect(getByText("streak.current_streak")).toBeTruthy();
    expect(getByText("streak.total_completion")).toBeTruthy();
  });

  it("renders the streak.days label", () => {
    const { getByText } = render(
      <StreakWidgets currentStreakDays={7} completionPercent={85} />,
    );
    // The component calls t("streak.days").toLowerCase()
    // In test env t() returns the key unchanged, so toLowerCase() → "streak.days"
    expect(getByText("streak.days")).toBeTruthy();
  });

  it("renders zero values without crashing or special-casing", () => {
    // Both currentStreakDays=0 and completionPercent=0 render — expect two "0" nodes.
    const { getAllByText } = render(
      <StreakWidgets currentStreakDays={0} completionPercent={0} />,
    );
    const zeros = getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });

  it("renders large numbers without truncation", () => {
    const { getByText } = render(
      <StreakWidgets currentStreakDays={365} completionPercent={100} />,
    );
    expect(getByText("365")).toBeTruthy();
    expect(getByText("100")).toBeTruthy();
  });
});
