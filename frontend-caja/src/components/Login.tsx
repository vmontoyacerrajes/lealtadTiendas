import React, { useState } from "react";
import api from "../api";

type Props = { onLogged: () => void };

export default function Login({ onLogged }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/login", {
        username,
        password,
        origin: "caja",
      });
      localStorage.setItem("token_caja", data.access_token);
      onLogged();
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Error de autenticación");
    }
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 360, margin: "40px auto" }}>
      <h2>Login Caja</h2>
      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="Usuario caja"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <button type="submit">Entrar</button>
    </form>
  );
}