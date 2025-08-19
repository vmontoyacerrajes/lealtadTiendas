import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const { setCliente } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!correo) {
      Alert.alert('Error', 'Por favor ingresa tu correo.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/clientes/email/${correo}`);
      const cliente = response.data;

      if (cliente) {
        setCliente(cliente);
        router.replace('/'); // Ir a la pantalla principal
      } else {
        Alert.alert('No encontrado', 'No se encontró un cliente con ese correo.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema al buscar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Correo electrónico:</Text>
      <TextInput
        style={styles.input}
        placeholder="cliente@correo.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={correo}
        onChangeText={setCorreo}
      />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Ingresar" onPress={handleLogin} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
  },
});