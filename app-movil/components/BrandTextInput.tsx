import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import THEME from "../constants/Colors";

type Props = TextInputProps & { label?: string };

export default function BrandTextInput({ label, style, ...rest }: Props) {
  return (
    <View style={{ marginBottom: THEME.spacing.md }}>
      {label ? (
        <Text
          style={{
            marginBottom: 6,
            color: THEME.colors.gray700,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        style={[
          {
            backgroundColor: THEME.colors.white,
            borderColor: THEME.colors.gray200,
            borderWidth: 1,
            borderRadius: THEME.radius,
            paddingHorizontal: 14,
            paddingVertical: 12,
          },
          style,
        ]}
        placeholderTextColor={THEME.colors.gray500}
      />
    </View>
  );
}