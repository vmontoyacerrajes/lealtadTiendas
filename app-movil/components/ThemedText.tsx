// components/ThemedText.tsx
import React from "react";
import { Text, TextProps } from "react-native";
import THEME from "../constants/Colors";

export default function ThemedText({ style, ...rest }: TextProps) {
  return <Text style={[{ color: THEME.colors.ink }, style]} {...rest} />;
}