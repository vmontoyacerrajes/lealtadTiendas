// app/index.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import THEME from "../constants/Colors";
import { BACKEND_URL } from "../constants/config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const Colors = THEME.colors;

type ClienteMin = { id_cliente: number; nombre: string; correo: string };
type Resumen = {
  cliente: string;
  puntos_acumulados: number;
  puntos_canjeados: number;
  puntos_disponibles: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const [cliente, setCliente] = useState<ClienteMin | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar sesión almacenada
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem("@cliente_id");
      const nombre = await AsyncStorage.getItem("@cliente_nombre");
      const correo = await AsyncStorage.getItem("@cliente_correo");
      if (!id || !nombre || !correo) {
        router.replace("/login-email");
        return;
      }
      setCliente({ id_cliente: Number(id), nombre, correo });
    })();
  }, []);

  const fetchPuntos = useCallback(async () => {
    if (!cliente) return;
    try {
      setLoading(true);
      const url = `${BACKEND_URL}/movimientos/resumen/${cliente.id_cliente}`;
      const { data } = await axios.get<Resumen>(url);
      setResumen(data);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      Alert.alert(
        "No se pudieron cargar tus puntos",
        status ? `HTTP ${status}: ${detail || "sin detalle"}` : err?.message || "Error de red"
      );
    } finally {
      setLoading(false);
    }
  }, [cliente]);

  // Cargar automáticamente al enfocarse la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchPuntos();
    }, [fetchPuntos])
  );

  const logout = async () => {
    await AsyncStorage.multiRemove([
      "@cliente_id",
      "@cliente_nombre",
      "@cliente_correo",
      "@reset_correo",
    ]);
    router.replace("/login-email");
  };

  return (
    <ImageBackground
      source={require("../assets/images/login-bg.png")}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <View style={styles.scrim} />

      <View style={styles.centerWrap}>
        <View style={styles.card}>
          {/* Banner dentro de la tarjeta */}
          <Image
            source={require("../assets/images/BannerLoyalty.png")}
            style={styles.logo}
          />

          {/* Encabezado con saludo */}
          {cliente ? (
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hello}>¡Hola, {cliente.nombre}!</Text>
                <Text style={styles.email}>{cliente.correo}</Text>
              </View>
              <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.85}>
                <Ionicons name="log-out-outline" size={18} color={Colors.gray700} />
                <Text style={styles.logoutText}>Salir</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Tarjeta de puntos */}
          <View style={styles.pointsCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons name="star-circle" size={28} color={Colors.brand} />
              <Text style={styles.pointsTitle}>Tus puntos</Text>
            </View>

            {loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator color={Colors.brand} />
                <Text style={styles.loaderText}>Cargando...</Text>
              </View>
            ) : resumen ? (
              <View style={styles.pointsGrid}>
                <View style={styles.pointsBox}>
                  <Text style={styles.pointsLabel}>Disponibles</Text>
                  <Text style={styles.pointsValue}>{resumen.puntos_disponibles}</Text>
                </View>
                <View style={styles.pointsBox}>
                  <Text style={styles.pointsLabel}>Acumulados</Text>
                  <Text style={styles.pointsValueMuted}>{resumen.puntos_acumulados}</Text>
                </View>
                <View style={styles.pointsBox}>
                  <Text style={styles.pointsLabel}>Canjeados</Text>
                  <Text style={styles.pointsValueMuted}>{resumen.puntos_canjeados}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.pointsEmpty}>Toca “Refrescar” para cargar tu saldo.</Text>
            )}
          </View>

          {/* Acciones con iconos */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.action}
              onPress={() => router.push("/mi-qr")}
              activeOpacity={0.9}
            >
              <Ionicons name="qr-code" size={28} color={Colors.brand} />
              <Text style={styles.actionText}>Mi QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.action}
              onPress={() => router.push("/historial")}
              activeOpacity={0.9}
            >
              <Ionicons name="time-outline" size={28} color={Colors.brand} />
              <Text style={styles.actionText}>Historial</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.action}
              onPress={fetchPuntos}
              activeOpacity={0.9}
            >
              <Ionicons name="refresh" size={28} color={Colors.brand} />
              <Text style={styles.actionText}>Refrescar</Text>
            </TouchableOpacity>
          </View>

          {/* CTA secundarias */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push("/registro")}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryText}>Editar perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push("/set-password")}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryText}>Cambiar contraseña</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    maxWidth: 620,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
    gap: 14,
  },
  logo: {
    alignSelf: "center",
    width: "76%",
    height: 64,
    resizeMode: "contain",
    marginBottom: 6,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hello: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.gray700,
  },
  email: {
    fontSize: 13,
    color: Colors.gray500,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: Colors.gray100,
    borderColor: Colors.gray200,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  logoutText: { color: Colors.gray700, fontWeight: "700" },

  pointsCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray200,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.gray700,
  },
  loaderWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loaderText: { color: Colors.gray500 },

  pointsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  pointsBox: {
    flex: 1,
    backgroundColor: Colors.gray50,
    borderColor: Colors.gray200,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  pointsLabel: {
    color: Colors.gray500,
    fontSize: 12,
    marginBottom: 4,
  },
  pointsValue: {
    color: Colors.brand,
    fontSize: 22,
    fontWeight: "900",
  },
  pointsValueMuted: {
    color: Colors.gray700,
    fontSize: 18,
    fontWeight: "800",
  },
  pointsEmpty: { color: Colors.gray500, fontStyle: "italic" },

  actionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  action: {
    flex: 1,
    backgroundColor: Colors.gray50,
    borderColor: Colors.gray200,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: Colors.gray700,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  secondaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderColor: Colors.gray200,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: Colors.gray700, fontWeight: "700" },
});