import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { Camera } from "expo-camera";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function IndexScreen() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [puntos, setPuntos] = useState<any>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const login = async () => {
    try {
      const res = await axios.post("http://localhost:8000/login", {
        username: user,
        password: pass,
      });
      setToken(res.data.access_token);
      await AsyncStorage.setItem("token", res.data.access_token);
      Alert.alert("Login exitoso");
    } catch {
      Alert.alert("Error de autenticación");
    }
  };

  const getPuntos = async () => {
    const storedToken = await AsyncStorage.getItem("token");
    try {
      const perfil = await axios.get("http://localhost:8000/perfil", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const res = await axios.get(
        `http://localhost:8000/saldo/${perfil.data.id_cliente}`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
      setPuntos(res.data);
    } catch {
      Alert.alert("No se pudo consultar puntos");
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setCameraOn(false);
    Alert.alert(`QR leído: ${data}`);
    // Aquí puedes hacer POST a /acumular/desde-caja si deseas
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi App de Lealtad</Text>

      {!token ? (
        <View style={styles.form}>
          <TextInput
            placeholder="Usuario"
            style={styles.input}
            value={user}
            onChangeText={setUser}
          />
          <TextInput
            placeholder="Contraseña"
            secureTextEntry
            style={styles.input}
            value={pass}
            onChangeText={setPass}
          />
          <Button title="Iniciar sesión" onPress={login} />
        </View>
      ) : (
        <View>
          <Button title="Consultar puntos" onPress={getPuntos} />
          {puntos && (
            <View style={styles.info}>
              <Text>Puntos disponibles: {puntos.puntos_disponibles}</Text>
              <Text>Acumulados: {puntos.puntos_acumulados}</Text>
              <Text>Canjeados: {puntos.puntos_canjeados}</Text>
            </View>
          )}
          <Button title="Escanear QR" onPress={() => setCameraOn(true)} />
        </View>
      )}

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
  form: { gap: 10, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
  },
  info: { marginVertical: 20 },
});