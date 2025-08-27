// src/components/HeaderCaja.jsx
import React from "react";
import logo from "../assets/tiendas-cerrajes.png";

export default function HeaderCaja({ title = "Caja" }) {
  return (
    <header style={styles.bar}>
      <img src={logo} alt="Tiendascerrajes" style={styles.logo} />
      <div style={{ lineHeight: 1.1 }}>
        <div style={styles.brand}>tiendascerrajes</div>
        <div style={styles.section}>{title}</div>
      </div>
    </header>
  );
}

const styles = {
  bar: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
  },
  logo: {
    height: 36, // ajusta si lo quieres más grande
    width: "auto",
    display: "block",
  },
  brand: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  section: {
    fontSize: 12,
    color: "#6b7280",
  },
};