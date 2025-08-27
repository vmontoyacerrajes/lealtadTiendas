// frontend-caja/src/EscanerQR.Jsx
import React, { useRef, useState, useEffect } from "react";

// Lee la URL del backend desde .env.local (REACT_APP_API_BASE)
const API = process.env.REACT_APP_API_BASE || "http://localhost:8000";

// Parser tolerante: acepta "CLI:123", "CLI;123", "CLIÑ123", "CLI-123", etc.
function parseClient(raw) {
  const s = (raw || "").trim();
  const m = s.toUpperCase().match(/^CLI[^0-9]*([0-9]+)$/);
  if (!m) throw new Error("Formato inválido. Esperado CLI:<id_cliente>.");
  const id = parseInt(m[1], 10);
  if (Number.isNaN(id)) throw new Error("id_cliente no numérico.");
  // Normalizamos a CLI:<id>
  return { qr_data: `CLI:${id}`, id_cliente: id };
}

export default function EscanerQR() {
  const inputRef = useRef(null);

  const [ultimoLeido, setUltimoLeido] = useState("");
  const [idCliente, setIdCliente] = useState(null);

  const [puntos, setPuntos] = useState(100);
  const [descripcion, setDescripcion] = useState("");
  const [referencia, setReferencia] = useState("");

  const [status, setStatus] = useState(null); // { type: 'ok' | 'error', msg: string }

  // Autofocus permanente para trabajar como “caja”
  useEffect(() => {
    const focus = () => inputRef.current && inputRef.current.focus();
    focus();
    const t = setInterval(focus, 1500);
    return () => clearInterval(t);
  }, []);

  const onKeyDown = async (e) => {
    if (e.key !== "Enter") return;

    const raw = e.currentTarget.value;
    e.currentTarget.value = ""; // limpia el input para siguiente lectura
    setStatus(null);

    try {
      const parsed = parseClient(raw);
      setUltimoLeido(raw);
      setIdCliente(parsed.id_cliente);
      setStatus({ type: "ok", msg: `QR ok: id_cliente=${parsed.id_cliente}` });
    } catch (err) {
      setUltimoLeido(raw);
      setIdCliente(null);
      setStatus({ type: "error", msg: err.message || "QR inválido" });
    }
  };

  const acumular = async () => {
    if (!idCliente) {
      setStatus({ type: "error", msg: "Primero escanea un QR válido." });
      return;
    }
    if (!referencia.trim()) {
      setStatus({ type: "error", msg: "Referencia (folio/ticket) es requerida." });
      return;
    }

    try {
      const payload = {
        qr_data: `CLI:${idCliente}`,     // ya normalizado
        puntos: Number(puntos),
        descripcion: descripcion || null,
        referencia: referencia.trim(),   // folio único (anti duplicidad)
      };

      const res = await fetch(`${API}/caja/acumular-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Error HTTP ${res.status}`);
      }

      const data = await res.json();
      setStatus({
        type: "ok",
        msg: `Acumulado ✔ (${data.puntos} puntos) – cliente ${data.id_cliente}`,
      });
      // Limpieza parcial (dejamos puntos por comodidad)
      setDescripcion("");
      setReferencia("");
    } catch (err) {
      setStatus({ type: "error", msg: String(err.message || err) });
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "32px auto", fontFamily: "system-ui, sans-serif" }}>
      <h2>Escáner de QR (Caja)</h2>

      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          type="text"
          placeholder='Enfoca aquí y escanea (espera "Enter")'
          onKeyDown={onKeyDown}
          style={{ flex: 1, padding: 12, fontSize: 16 }}
        />
      </div>

      {ultimoLeido ? (
        <div style={{ marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
          Último leído: <code>{ultimoLeido}</code>
        </div>
      ) : null}

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginTop: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Puntos a acumular
          </label>
          <input
            type="number"
            min={1}
            value={puntos}
            onChange={(e) => setPuntos(e.target.value)}
            style={{ width: 160, padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Referencia (folio/ticket) *
          </label>
          <input
            type="text"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej. F123456"
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Descripción (opcional)
          </label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción breve"
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <button onClick={acumular} style={{ padding: "10px 16px", fontWeight: 600 }}>
          Acumular
        </button>
      </div>

      {status ? (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 6,
            color: status.type === "ok" ? "#064e3b" : "#7f1d1d",
            background: status.type === "ok" ? "#d1fae5" : "#fee2e2",
            border: `1px solid ${status.type === "ok" ? "#10b981" : "#ef4444"}`,
          }}
        >
          {status.msg}
        </div>
      ) : null}

      {idCliente ? (
        <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
          Cliente detectado: <strong>{idCliente}</strong>
        </div>
      ) : null}
    </div>
  );
}