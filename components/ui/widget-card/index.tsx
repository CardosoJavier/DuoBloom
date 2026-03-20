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
  readonly footer?: React.ReactNode;
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly style?: ViewStyle;
}

export function WidgetCard({
  title,
  subtitle,
  icon,
  footer,
  children,
  className,
  style,
}: WidgetCardProps) {
  const hasHeader = !!(title ?? subtitle ?? icon);

  // p-0 overrides the Card widget base p-6; inner VStack controls the padding
  const baseClass = "p-0 overflow-hidden";
  const combinedClass = className
    ? [baseClass, className].join(" ")
    : baseClass;

  return (
    <Card variant="widget" className={combinedClass} style={style}>
      <VStack className="pt-6 px-6 pb-6 gap-3 flex-1">
        {hasHeader && (
          <VStack className="gap-1">
            <HStack className="items-center gap-2">
              {icon}
              {!!title && (
                <Text className="text-typography-500 uppercase font-bold tracking-wider text-xs">
                  {title}
                </Text>
              )}
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
