// src/components/Login.jsx
import React, { useEffect, useState, useRef } from "react";
import { loginCaja, API_BASE } from "../api";
import logo from "../assets/tiendas-cerrajes.png";

export default function Login({ onLogged }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [viendoPass, setViendoPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const userRef = useRef(null);

  useEffect(() => {
    userRef.current?.focus();
    const last = localStorage.getItem("last_user_caja");
    if (last) setUsuario(last);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const u = usuario.trim();
    const p = password.trim();
    if (!u || !p) {
      setMsg({ type: "error", text: "Escribe usuario y contraseña." });
      return;
    }

    setLoading(true);
    try {
      await loginCaja(u, p);
      localStorage.setItem("last_user_caja", u);
      onLogged?.();
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (!status) {
        setMsg({
          type: "error",
          text: `No se pudo conectar a ${API_BASE}. Verifica backend y CORS.`,
        });
      } else if (status === 401) {
        setMsg({ type: "error", text: "Usuario o contraseña inválidos." });
      } else {
        setMsg({ type: "error", text: detail || `Error HTTP ${status}.` });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img src={logo} alt="Tiendas Cerrajes" style={styles.logo} />
        </div>

        <h1 style={styles.title}>Ingreso a Caja</h1>
        <p style={styles.subtitle}>
          Autentícate con tu usuario de <strong>Moving</strong> para continuar.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          {/* USUARIO */}
          <div>
            <label style={styles.label}>Usuario</label>
            <input
              ref={userRef}
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ej. VMONTOYA"
              autoComplete="username"
              disabled={loading}
              style={styles.input}
            />
          </div>

          {/* CONTRASEÑA (con botón Mostrar en layout flex) */}
          <div>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.inputRow}>
              <input
                type={viendoPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                autoComplete="current-password"
                disabled={loading}
                style={{ ...styles.input, flex: 1, margin: 0 }}
              />
              <button
                type="button"
                onClick={() => setViendoPass((v) => !v)}
                disabled={loading}
                style={styles.eyeBtn}
                aria-label={viendoPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {viendoPass ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        {msg.text ? (
          <div
            style={{
              ...styles.alert,
              ...(msg.type === "ok"
                ? styles.ok
                : msg.type === "error"
                ? styles.err
                : {}),
            }}
          >
            {msg.text}
          </div>
        ) : null}

        <div style={styles.footer}>
          <small>API: {API_BASE}</small>
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background:
      "radial-gradient(1200px 600px at 10% -10%, #f1f5f9 0%, transparent 60%), radial-gradient(800px 400px at 120% 10%, #e5e7eb 0%, transparent 50%), linear-gradient(180deg, #ffffff, #f8fafc)",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 20,
    overflow: "hidden", // evita que algo sobresalga
    boxShadow:
      "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)",
  },
  logoWrap: { display: "flex", justifyContent: "center", marginBottom: 8 },
  logo: { height: 54, objectFit: "contain" },
  title: { margin: "8px 0 0 0", textAlign: "center", fontSize: 22 },
  subtitle: {
    margin: "4px 0 16px 0",
    textAlign: "center",
    color: "#6b7280",
    fontSize: 14,
  },
  label: { display: "block", fontSize: 14, color: "#374151", marginBottom: 6 },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  input: {
    width: "100%",
    boxSizing: "border-box", // <- clave para que no se pase del card
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 16,
    outline: "none",
    margin: 0,
  },
  eyeBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
    cursor: "pointer",
    whiteSpace: "nowrap",
    height: 44,
  },
  primaryBtn: {
    marginTop: 4,
    padding: "12px 14px",
    background: "#111827",
    color: "#fff",
    border: 0,
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 16,
  },
  alert: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 14,
  },
  ok: { background: "#e6ffed", border: "1px solid #b7f5c2", color: "#065f46" },
  err: { background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b" },
  footer: {
    marginTop: 12,
    display: "flex",
    justifyContent: "center",
    color: "#6b7280",
  },
};