// components/ThemedView.tsx
import React from "react";
import { View, ViewProps } from "react-native";
import THEME from "../constants/Colors";

export default function ThemedView({ style, ...rest }: ViewProps) {
  // No forzamos flex:1; solo aplicamos el color de fondo del tema.
  return <View style={[{ backgroundColor: THEME.colors.gray50 }, style]} {...rest} />;
}