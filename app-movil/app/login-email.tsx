// app/login-email.tsx
// app/login-email.tsx
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import THEME from "../constants/Colors";         // usamos THEME
import { BACKEND_URL } from "../constants/config";

const Colors = THEME.colors; // atajo

export default function LoginEmail() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!correo.trim() || !password.trim()) {
      Alert.alert("Faltan datos", "Escribe tu correo y contraseña.");
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.post(`${BACKEND_URL}/app/login`, {
        correo,
        password,
      });
      await AsyncStorage.multiSet([
        ["@cliente_id", String(data.id_cliente)],
        ["@cliente_correo", data.correo],
        ["@cliente_nombre", data.nombre],
      ]);
      router.replace("/");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "No se pudo iniciar sesión.";
      Alert.alert("Error", String(msg));
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

            <Text style={styles.title}>Ingresar</Text>
            <Text style={styles.subtitle}>
              Usa tu correo y contraseña para continuar
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
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor={Colors.gray500}
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={login}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Ingresar</Text>
                )}
              </TouchableOpacity>

              {/* Acciones secundarias */}
              <View style={styles.linksCol}>
                <TouchableOpacity onPress={() => router.push("/registro")}>
                  <Text style={styles.linkText}>
                    ¿No tienes cuenta?{" "}
                    <Text style={styles.linkStrong}>Regístrate</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/set-password")}>
                  <Text style={styles.linkText}>
                    ¿Olvidaste tu contraseña?{" "}
                    <Text style={styles.linkStrong}>Recupérala</Text>
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
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
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
    width: "80%",    // se adapta al ancho de la tarjeta
    height: 72,
    resizeMode: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.gray800,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray600,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  fields: {
    gap: 18,
  },
  input: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray200,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.gray900,
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
  linksCol: {
    marginTop: 4,
    gap: 8,
    alignItems: "center",
  },
  linkText: {
    color: Colors.gray700,
    fontSize: 15,
  },
  linkStrong: {
    color: Colors.brand,
    fontWeight: "800",
  },
});