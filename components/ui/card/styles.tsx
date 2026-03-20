import { isWeb, tva } from "@gluestack-ui/utils/nativewind-utils";
const baseStyle = isWeb ? "flex flex-col relative z-0" : "";

export const cardStyle = tva({
  base: baseStyle,
  variants: {
    size: {
      sm: "p-3 rounded",
      md: "p-4 rounded-md",
      lg: "p-6 rounded-xl",
    },
    variant: {
      elevated: "bg-background-0",
      outline: "border border-outline-200 ",
      ghost: "rounded-none",
      filled: "bg-background-50",
      bento:
        "bg-white dark:bg-background-900 rounded-[32px] shadow-sm border border-outline-50",
      widget:
        "bg-background-widget border border-slate-200 p-6 rounded-3xl shadow-sm shadow-slate-200",
    },
  },
});
