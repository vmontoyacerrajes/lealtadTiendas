// app/set-password.tsx
import React, { useEffect, useState } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import THEME from "../constants/Colors";
import { BACKEND_URL } from "../constants/config";

const Colors = THEME.colors;

export default function SetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ correo?: string }>();

  const [correo, setCorreo] = useState("");
  const [correoVerificado, setCorreoVerificado] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [verPwd, setVerPwd] = useState(false);
  const [verPwd2, setVerPwd2] = useState(false);

  // Si llega ?correo=... por params, saltamos verificación manual
  useEffect(() => {
    const bootstrap = async () => {
      const pCorreo = (params?.correo || "").toString().trim().toLowerCase();
      if (pCorreo) {
        setCorreo(pCorreo);
        setCorreoVerificado(true);
        await AsyncStorage.setItem("@reset_correo", pCorreo);
        return;
      }
      // Si no hay param, intenta usar el almacenado (si venimos de "Recuperar")
      const saved = (await AsyncStorage.getItem("@reset_correo")) || "";
      if (saved) {
        setCorreo(saved);
        setCorreoVerificado(true);
      }
    };
    bootstrap();
  }, [params?.correo]);

  const verificarCorreo = async () => {
    const email = correo.trim().toLowerCase();
    if (!email) {
      Alert.alert("Faltan datos", "Escribe tu correo.");
      return;
    }
    const re = /\S+@\S+\.\S+/;
    if (!re.test(email)) {
      Alert.alert("Correo inválido", "Revisa el formato del correo.");
      return;
    }
    try {
      setVerificando(true);
      const { data } = await axios.post(`${BACKEND_URL}/app/check-email`, { correo: email });
      if (data?.exists) {
        setCorreoVerificado(true);
        await AsyncStorage.setItem("@reset_correo", email);
        Alert.alert("Correo verificado", "Ahora define tu nueva contraseña.");
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
      setVerificando(false);
    }
  };

  const guardarPassword = async () => {
    if (!correoVerificado) {
      Alert.alert("Verifica tu correo", "Primero debes verificar un correo registrado.");
      return;
    }
    const pwd = password.trim();
    const pwd2 = password2.trim();

    if (!pwd || !pwd2) {
      Alert.alert("Faltan datos", "Escribe y confirma tu nueva contraseña.");
      return;
    }
    if (pwd.length < 6) {
      Alert.alert("Contraseña débil", "Debe tener al menos 6 caracteres.");
      return;
    }
    if (pwd !== pwd2) {
      Alert.alert("No coincide", "La confirmación no coincide con la contraseña.");
      return;
    }

    try {
      setGuardando(true);
      await axios.post(`${BACKEND_URL}/app/set-password`, { correo, password: pwd });
      await AsyncStorage.removeItem("@reset_correo");
      Alert.alert("Listo", "Tu contraseña fue actualizada.", [
        { text: "OK", onPress: () => router.replace("/login-email") },
      ]);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 401) {
        Alert.alert("No autorizado", detail || "Correo no verificado.");
      } else {
        Alert.alert("Error", detail || "No se pudo guardar la contraseña.");
      }
    } finally {
      setGuardando(false);
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
        {/* Botón de regresar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>← Regresar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerWrap}>
          <View style={styles.card}>
            {/* Banner dentro de la tarjeta */}
            <Image
              source={require("../assets/images/BannerLoyalty.png")}
              style={styles.logo}
            />

            <Text style={styles.title}>Restablecer contraseña</Text>
            <Text style={styles.subtitle}>
              Primero verifica tu correo registrado y luego define tu nueva contraseña.
            </Text>

            {/* Paso 1: Verificar correo */}
            {!correoVerificado && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>1) Verifica tu correo</Text>
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
                  onPress={verificarCorreo}
                  disabled={verificando}
                  activeOpacity={0.85}
                >
                  {verificando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verificar correo</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Paso 2: Nueva contraseña */}
            {correoVerificado && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>2) Define tu nueva contraseña</Text>

                <View style={{ gap: 10 }}>
                  <View style={styles.pwdRow}>
                    <TextInput
                      placeholder="Nueva contraseña"
                      placeholderTextColor={Colors.gray500}
                      secureTextEntry={!verPwd}
                      style={[styles.input, { flex: 1 }]}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setVerPwd((v) => !v)}
                      style={styles.eyeBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eyeText}>{verPwd ? "🙈" : "👁️"}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pwdRow}>
                    <TextInput
                      placeholder="Confirmar contraseña"
                      placeholderTextColor={Colors.gray500}
                      secureTextEntry={!verPwd2}
                      style={[styles.input, { flex: 1 }]}
                      value={password2}
                      onChangeText={setPassword2}
                    />
                    <TouchableOpacity
                      onPress={() => setVerPwd2((v) => !v)}
                      style={styles.eyeBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eyeText}>{verPwd2 ? "🙈" : "👁️"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 8 }]}
                  onPress={guardarPassword}
                  disabled={guardando}
                  activeOpacity={0.85}
                >
                  {guardando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Guardar contraseña</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Links inferiores */}
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => router.replace("/login-email")}>
                <Text style={styles.linkText}>
                  ¿Ya tienes cuenta? <Text style={styles.linkStrong}>Inicia sesión</Text>
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
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.brand },
  bgImage: { resizeMode: "cover" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },

  topBar: {
    paddingTop: Platform.OS === "ios" ? 52 : 28,
    paddingHorizontal: 16,
  },
  backBtn: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backBtnText: { color: Colors.gray700, fontWeight: "700" },

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
    width: "78%",
    height: 68,
    resizeMode: "contain",
    marginBottom: 8,
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

  block: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray200,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.gray700,
    marginBottom: 8,
  },

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

  pwdRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  eyeText: { fontSize: 16 },

  primaryBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
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