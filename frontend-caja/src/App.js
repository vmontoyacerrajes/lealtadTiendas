// src/App.js
import React, { useEffect, useState } from "react";
import Login from "./components/Login";
import EscanerHID from "./EscanerHID";
import api from "./api";
import HeaderCaja from "./components/HeaderCaja";

export default function App() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(Boolean(localStorage.getItem("token_caja")));
  }, []);

  const logout = () => {
    localStorage.removeItem("token_caja");
    setIsAuth(false);
  };

  const checkPerfil = async () => {
    try {
      const { data } = await api.get("/perfil");
      alert(`Conectado como ${data.usuario || data.user || "—"} (${data.role || "—"})`);
    } catch {
      alert("Token inválido o expirado. Inicia sesión de nuevo.");
      logout();
    }
  };

  if (!isAuth) return <Login onLogged={() => setIsAuth(true)} />;

  return (
    <>
      {/* Header global con logo (de tu componente HeaderCaja) */}
      <HeaderCaja />

      {/* Contenido de la caja */}
      <main style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={checkPerfil}>Perfil</button>
          <button onClick={logout}>Cerrar sesión</button>
        </div>

        <EscanerHID />
      </main>
    </>
  );
}