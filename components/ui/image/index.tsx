import { createImage } from "@gluestack-ui/core/image/creator";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { tva } from "@gluestack-ui/utils/nativewind-utils";
import React from "react";
import { Platform, Image as RNImage } from "react-native";

const imageStyle = tva({
  base: "max-w-full rounded-3xl overflow-hidden aspect-[3/4] bg-background-100 dark:bg-background-900",
  variants: {
    size: {
      "2xs": "h-6 w-6",
      xs: "h-10 w-10",
      sm: "h-16 w-16",
      md: "h-20 w-20",
      lg: "h-24 w-24",
      xl: "h-32 w-32",
      "2xl": "h-64 w-64",
      full: "h-full w-full",
      none: "",
    },
  },
  defaultVariants: {
    size: "none",
  },
});

const UIImage = createImage({ Root: RNImage });

type ImageProps = VariantProps<typeof imageStyle> &
  React.ComponentProps<typeof UIImage>;
const Image = React.forwardRef<
  React.ComponentRef<typeof UIImage>,
  ImageProps & { className?: string }
>(function Image(
  { size = "none", className, resizeMode = "cover", ...props },
  ref,
) {
  return (
    <UIImage
      className={imageStyle({ size, class: className })}
      resizeMode={resizeMode}
      {...props}
      ref={ref}
      // @ts-expect-error : web only
      style={
        Platform.OS === "web"
          ? { height: "revert-layer", width: "revert-layer" }
          : undefined
      }
    />
  );
});

Image.displayName = "Image";
export { Image };
