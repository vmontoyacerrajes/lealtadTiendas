import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert, StyleSheet } from "react-native";
import { Camera } from "expo-camera";
import { useRouter } from "expo-router";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function IndexScreen() {
  const router = useRouter();
  const { token, loading } = useAuth();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [puntos, setPuntos] = useState<any>(null);

  // ✅ Redirigir si no hay token
  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [loading, token]);

  // ✅ Solicitar permisos de cámara
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // ✅ Consultar puntos del cliente autenticado
  const getPuntos = async () => {
    try {
      const perfil = await axios.get("http://localhost:8000/perfil", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await axios.get(
        `http://localhost:8000/saldo/${perfil.data.id_cliente}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPuntos(res.data);
    } catch (err) {
      Alert.alert("No se pudo consultar puntos");
    }
  };

  // ✅ Escaneo de QR
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setCameraOn(false);
    Alert.alert(`QR leído: ${data}`);
    // Aquí puedes enviar un POST a /acumular/desde-caja si es necesario
  };

  if (loading) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi App de Lealtad</Text>

      <Button title="Consultar puntos" onPress={getPuntos} />

      {puntos && (
        <View style={styles.info}>
          <Text>Puntos disponibles: {puntos.puntos_disponibles}</Text>
          <Text>Acumulados: {puntos.puntos_acumulados}</Text>
          <Text>Canjeados: {puntos.puntos_canjeados}</Text>
        </View>
      )}

      <Button title="Escanear QR" onPress={() => setCameraOn(true)} />

      {cameraOn && hasPermission && (
        <Camera
          style={{ width: "100%", height: 300 }}
          onBarCodeScanned={handleBarCodeScanned}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  info: { marginVertical: 20 },
});