// app/mi-qr.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QRCode from "react-native-qrcode-svg";
import THEME from "../constants/Colors";

export default function MiQRScreen() {
  const [id, setId] = useState<number | null>(null);
  const [nombre, setNombre] = useState<string>("");
  const [correo, setCorreo] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sid, snombre, scorreo] = await Promise.all([
          AsyncStorage.getItem("@cliente_id"),
          AsyncStorage.getItem("@cliente_nombre"),
          AsyncStorage.getItem("@cliente_correo"),
        ]);
        if (!sid) {
          Alert.alert("Sesión", "No encontramos tu sesión. Inicia nuevamente.");
        } else {
          setId(Number(sid));
          setNombre(snombre || "");
          setCorreo(scorreo || "");
        }
      } catch {
        Alert.alert("Error", "No se pudo cargar tu información.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const qrValue = id ? `CLI:${id}` : "";

  return (
    <ImageBackground
      source={require("../assets/images/login-bg.png")} // <- usa el mismo fondo del login
      style={styles.bg}
      resizeMode="cover"
    >
      {/* capa sutil para mejorar legibilidad */}
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, THEME.shadow]}>
          {/* Logo dentro de la tarjeta */}
          <Image
            source={require("../assets/images/BannerLoyalty.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Datos del cliente */}
          <View style={styles.infoBox}>
            <Text style={styles.name} numberOfLines={1}>
              {nombre || "—"}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {correo || "—"}
            </Text>
          </View>

          <View style={styles.sep} />

          {/* QR */}
          <View style={styles.qrWrap}>
            {loading ? (
              <ActivityIndicator />
            ) : id ? (
              <>
                <QRCode value={qrValue} size={220} />
                <Text style={styles.qrText}>{qrValue}</Text>
                <Text style={styles.helper}>
                  Presenta este código en caja para acumular o canjear puntos.
                </Text>
              </>
            ) : (
              <Text style={styles.noId}>No hay ID de cliente.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    minHeight: "100%",
  },
  card: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: THEME.colors.gray200,
  },
  logo: {
    width: "80%",
    height: 64,
    alignSelf: "center",
    marginBottom: 16,
  },
  infoBox: {
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.colors.ink,
  },
  email: {
    fontSize: 14,
    color: THEME.colors.gray500,
    marginTop: 2,
  },
  sep: {
    height: 1,
    backgroundColor: THEME.colors.gray200,
    marginVertical: 12,
  },
  qrWrap: {
    alignItems: "center",
    paddingVertical: 10,
  },
  qrText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.gray700,
  },
  helper: {
    marginTop: 6,
    fontSize: 13,
    color: THEME.colors.gray500,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  noId: {
    fontSize: 16,
    color: THEME.colors.danger,
  },
});