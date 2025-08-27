// app/historial.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  ImageBackground,
  RefreshControl,
  Image,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import THEME from "../constants/Colors";
import { BACKEND_URL } from "../constants/config";

type Movimiento = {
  id: number;
  tipo: "acumulado" | "canjeado";
  puntos: number;
  descripcion?: string | null;
  referencia?: string | null;
  fecha: string; // ISO
};

export default function HistorialScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Movimiento[]>([]);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clienteId, setClienteId] = useState<number | null>(null);

  const fetchHistorial = useCallback(async () => {
    if (!clienteId) return;
    try {
      const { data } = await axios.get<Movimiento[]>(
        `${BACKEND_URL}/movimientos/historial/${clienteId}`
      );
      setItems(data);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      Alert.alert(
        "No se pudo cargar el historial",
        status ? `HTTP ${status}: ${detail || "sin detalle"}` : (err?.message || "Error de red")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clienteId]);

  useEffect(() => {
    (async () => {
      const [sid, snombre, scorreo] = await Promise.all([
        AsyncStorage.getItem("@cliente_id"),
        AsyncStorage.getItem("@cliente_nombre"),
        AsyncStorage.getItem("@cliente_correo"),
      ]);
      if (!sid) {
        Alert.alert("Sesión", "No encontramos tu sesión. Inicia nuevamente.");
        setLoading(false);
        return;
      }
      setClienteId(Number(sid));
      setNombre(snombre || "");
      setCorreo(scorreo || "");
    })();
  }, []);

  useEffect(() => {
    if (clienteId) fetchHistorial();
  }, [clienteId, fetchHistorial]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistorial();
  };

  const renderItem = ({ item }: { item: Movimiento }) => {
    const isAcc = item.tipo === "acumulado";
    return (
      <View style={styles.row}>
        <View
          style={[
            styles.dot,
            { backgroundColor: isAcc ? THEME.colors.success : THEME.colors.danger },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>
            {isAcc ? "Acumulado" : "Canjeado"} · {isAcc ? "+" : "-"}
            {item.puntos} pts
          </Text>
          <Text style={styles.rowSub}>
            {item.descripcion || "—"} · Ref: {item.referencia || "—"}
          </Text>
          <Text style={styles.rowDate}>
            {new Date(item.fecha).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("../assets/images/login-bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        <View style={[styles.card, THEME.shadow]}>
          <Image
            source={require("../assets/images/BannerLoyalty.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.headerBox}>
            <Text style={styles.title}>Historial de movimientos</Text>
            <Text style={styles.clientName} numberOfLines={1}>
              {nombre || "—"}
            </Text>
            <Text style={styles.clientEmail} numberOfLines={1}>
              {correo || "—"}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 16 }} />
          ) : items.length === 0 ? (
            <Text style={styles.empty}>Aún no hay movimientos.</Text>
          ) : (
            <FlatList
              style={{ flex: 1 }}               // <- ocupa todo el alto disponible
              data={items}
              keyExtractor={(it) => String(it.id)}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={{ paddingTop: 4, paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
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
    flex: 1,
    padding: 20,
    // Dejamos que la tarjeta crezca: no centramos verticalmente
    justifyContent: "flex-start",
  },
  card: {
    flex: 1, // <- HACE QUE LA TARJETA OCUPE LA MAYORÍA DE LA PANTALLA
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.gray200,
  },
  logo: {
    width: "72%",
    height: 56,
    alignSelf: "center",
    marginBottom: 10,
  },
  headerBox: {
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.colors.ink,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.gray700,
  },
  clientEmail: {
    fontSize: 13,
    color: THEME.colors.gray500,
  },
  sep: {
    height: 1,
    backgroundColor: THEME.colors.gray200,
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    marginTop: 6,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.colors.ink,
  },
  rowSub: {
    fontSize: 13,
    color: THEME.colors.gray600 ?? THEME.colors.gray500,
    marginTop: 2,
  },
  rowDate: {
    fontSize: 12,
    color: THEME.colors.gray500,
    marginTop: 2,
  },
  empty: {
    textAlign: "center",
    color: THEME.colors.gray500,
    marginTop: 16,
  },
});