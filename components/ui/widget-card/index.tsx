import React from "react";
import { ViewStyle } from "react-native";
import { Card } from "../card";
import { HStack } from "../hstack";
import { Text } from "../text";
import { VStack } from "../vstack";

interface WidgetCardProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly icon?: React.ReactNode;
  readonly headerRight?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly style?: ViewStyle;
}

export function WidgetCard({
  title,
  subtitle,
  icon,
  headerRight,
  footer,
  children,
  className,
  style,
}: WidgetCardProps) {
  const hasHeader = !!(title ?? subtitle ?? icon ?? headerRight);

  const baseClass = "p-0 overflow-hidden";
  const combinedClass = className
    ? [baseClass, className].join(" ")
    : baseClass;
  const innerClass = footer
    ? "pt-6 px-6 pb-6 gap-3 flex-1"
    : "pt-6 px-6 pb-6 gap-3";

  return (
    <Card variant="widget" className={combinedClass} style={style}>
      <VStack className={innerClass}>
        {hasHeader && (
          <VStack className="gap-1">
            <HStack className="items-center justify-between gap-2">
              <HStack className="items-center gap-2">
                {icon}
                {!!title && (
                  <Text className="text-typography-500 uppercase font-bold tracking-wider text-xs">
                    {title}
                  </Text>
                )}
              </HStack>
              {!!headerRight && headerRight}
            </HStack>
            {!!subtitle && (
              <Text className="text-typography-400 text-xs">{subtitle}</Text>
            )}
          </VStack>
        )}
        {children}
      </VStack>
      {!!footer && footer}
    </Card>
  );
}
