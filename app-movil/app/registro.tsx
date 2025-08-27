// app/registro.tsx
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
import THEME from "../constants/Colors";
import { BACKEND_URL } from "../constants/config";

const Colors = THEME.colors;

export default function RegistroScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const registrar = async () => {
    if (!nombre.trim() || !correo.trim() || !password.trim() || !confirm.trim()) {
      Alert.alert("Faltan datos", "Nombre, correo y contraseñas son obligatorios.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Contraseña débil", "Usa al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("No coincide", "La confirmación de contraseña no coincide.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(`${BACKEND_URL}/app/register`, {
        nombre,
        correo,
        telefono: telefono || null,
        password,
      });

      await AsyncStorage.multiSet([
        ["@cliente_id", String(data.id_cliente)],
        ["@cliente_correo", data.correo],
        ["@cliente_nombre", data.nombre],
      ]);

      Alert.alert("¡Cuenta creada!", "Tu registro se completó correctamente.");
      router.replace("/");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "No se pudo registrar.";
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

            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>
              Regístrate para consultar tu saldo y usar tu QR.
            </Text>

            <View style={styles.fields}>
              <TextInput
                placeholder="Nombre completo"
                placeholderTextColor={Colors.gray500}
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
              />
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
                placeholder="Teléfono (opcional)"
                placeholderTextColor={Colors.gray500}
                keyboardType="phone-pad"
                style={styles.input}
                value={telefono}
                onChangeText={setTelefono}
              />
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor={Colors.gray500}
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                placeholder="Confirmar contraseña"
                placeholderTextColor={Colors.gray500}
                secureTextEntry
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={registrar}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Registrarme</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignSelf: "center" }}
                onPress={() => router.push("/login-email")}
              >
                <Text style={styles.linkText}>
                  ¿Ya tienes cuenta?{" "}
                  <Text style={styles.linkStrong}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
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
  linkText: { color: Colors.gray700, fontSize: 15, marginTop: 6 },
  linkStrong: { color: Colors.brand, fontWeight: "800" },
});