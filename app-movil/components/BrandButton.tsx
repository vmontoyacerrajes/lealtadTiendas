import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";
import THEME from "../constants/Colors";

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  variant?: "primary" | "outline";
};

export default function BrandButton({
  title,
  onPress,
  disabled,
  style,
  variant = "primary",
}: Props) {
  const base = {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: THEME.radius,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const primary = {
    backgroundColor: disabled ? THEME.colors.gray300 : THEME.colors.brand,
  };

  const outline = {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: THEME.colors.brand,
  };

  const textBase = { fontWeight: "600" as const };
  const textPrimary = { color: THEME.colors.white };
  const textOutline = { color: THEME.colors.brand };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        base,
        variant === "primary" ? primary : outline,
        THEME.shadow,
        style,
      ]}
    >
      <Text style={[textBase, variant === "primary" ? textPrimary : textOutline]}>
        {title}
      </Text>
    </Pressable>
  );
}