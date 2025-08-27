// app/_layout.tsx
import { Stack } from "expo-router";
import { Colors } from "../constants/Colors"; // ajusta si tu archivo está en otra ruta

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.brand },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      {/* Pantallas con header */}
      <Stack.Screen name="index" options={{ title: "Inicio" }} />
      <Stack.Screen name="mi-qr" options={{ title: "Mi QR" }} />
      <Stack.Screen name="historial" options={{ title: "Historial" }} />

      {/* 👇 Login y auth sin header */}
      <Stack.Screen name="login-email" options={{ headerShown: false }} />
      <Stack.Screen name="registro" options={{ headerShown: false }} />
      <Stack.Screen name="set-password" options={{ headerShown: false }} />
    </Stack>
  );
}