import { Platform } from "react-native";

export const BACKEND_URL =
  Platform.select({
    ios: "http://192.168.2.90:8000",   // iOS Simulator
    android: "http://10.0.2.2:8000",// Android Emulator
    default: "http://192.168.2.90:8000", // cambia a la IP LAN de tu Mac si usas dispositivo físico
  }) as string;