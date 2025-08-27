// app/recuperar.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import THEME from "../constants/Colors";
import { BACKEND_URL } from "../constants/config";

const Colors = THEME.colors;

export default function RecuperarPasswordScreen() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [loading, setLoading] = useState(false);

  const verificarYContinuar = async () => {
    const email = correo.trim().toLowerCase();

    if (!email) {
      Alert.alert("Faltan datos", "Escribe tu correo.");
      return;
    }
    // Validación ligera de email
    const re = /\S+@\S+\.\S+/;
    if (!re.test(email)) {
      Alert.alert("Correo inválido", "Revisa el formato del correo.");
      return;
    }

    try {
      setLoading(true);

      // ⬇️ Endpoint esperado en el backend: POST /app/check-email
      // Debe responder 200 { exists: true } si el correo está registrado
      // o 404 { detail: "Cliente no encontrado" } en caso contrario.
      const { data } = await axios.post(`${BACKEND_URL}/app/check-email`, { correo: email });

      if (data?.exists) {
        // Opcional: guarda el correo para usarlo luego en set-password
        await AsyncStorage.setItem("@reset_correo", email);
        // Redirigimos a la pantalla donde el usuario define su nueva contraseña.
        router.push({ pathname: "/set-password", params: { correo: email } });
      } else {
        Alert.alert("No encontrado", "Este correo no está registrado.");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 404) {
        Alert.alert("No encontrado", detail || "Este correo no está registrado.");
      } else {
        Alert.alert("Error", detail || "No se pudo verificar el correo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/login-bg.png")}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <View style={styles.scrim} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.centerWrap}>
          <View style={styles.card}>
            {/* Banner dentro de la tarjeta */}
            <Image
              source={require("../assets/images/BannerLoyalty.png")}
              style={styles.logo}
            />

            <Text style={styles.title}>Recuperar contraseña</Text>
            <Text style={styles.subtitle}>
              Escribe tu correo para verificar que estás registrado y continuar con la recuperación.
            </Text>

            <View style={styles.fields}>
              <TextInput
                placeholder="Correo"
                placeholderTextColor={Colors.gray500}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                value={correo}
                onChangeText={setCorreo}
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={verificarYContinuar}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verificar y continuar</Text>
                )}
              </TouchableOpacity>

              <View style={styles.linksRow}>
                <TouchableOpacity onPress={() => router.replace("/login-email")}>
                  <Text style={styles.linkText}>
                    ¿Ya la recordaste? <Text style={styles.linkStrong}>Inicia sesión</Text>
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.replace("/registro")}>
                  <Text style={styles.linkText}>
                    ¿Sin cuenta? <Text style={styles.linkStrong}>Regístrate</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.brand },
  bgImage: { resizeMode: "cover" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "96%",
    maxWidth: 560,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    padding: 26,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
  },
  logo: {
    alignSelf: "center",
    width: "80%",
    height: 72,
    resizeMode: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.gray700,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray500,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  fields: { gap: 18 },
  input: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray200,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.gray700,
  },
  primaryBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 2,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.2,
  },
  linksRow: {
    marginTop: 6,
    gap: 8,
    alignItems: "center",
  },
  linkText: { color: Colors.gray700, fontSize: 15 },
  linkStrong: { color: Colors.brand, fontWeight: "800" },
});