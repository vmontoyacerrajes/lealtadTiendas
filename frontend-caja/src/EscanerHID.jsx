// src/EscanerHID.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import api from "./api";

// Normaliza (“CLIÑ123” -> “CLI:123”) y limpia CR/LF
function normalizeQR(raw) {
  if (!raw) return "";
  return raw.replace(/Ñ/g, ":").replace(/ñ/g, ":").replace(/\r?\n/g, "").trim();
}

// Extrae id numérico de "CLI:123"
function parseClienteId(qr) {
  if (!qr) return null;
  const m = qr.toUpperCase().match(/^CLI:(\d+)$/);
  return m ? Number(m[1]) : null;
}

export default function EscanerHID() {
  const inputRef = useRef(null);

  // Estados base
  const [buffer, setBuffer] = useState("");
  const [qr, setQr] = useState("");
  const [clienteId, setClienteId] = useState(null);

  const [referencia, setReferencia] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Importe y puntos
  const [importe, setImporte] = useState("");
  const importeNumber = useMemo(() => {
    const n = Number(importe);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [importe]);

  // Acumulación (1% redondeado)
  const puntosAcum = useMemo(() => {
    if (!importeNumber) return 0;
    const calc = Math.round(importeNumber * 0.01);
    return calc > 0 ? calc : 0;
  }, [importeNumber]);

  // Datos del cliente/saldo
  const [clienteNombre, setClienteNombre] = useState("");
  const [saldoDisp, setSaldoDisp] = useState(null);

  // Canje sugerido según saldo e importe
  const sugeridoCanje = useMemo(() => {
    if (!saldoDisp || !importeNumber) return 0;
    const maxPorImporte = Math.floor(importeNumber); // 1 punto = $1
    return Math.max(0, Math.min(saldoDisp, maxPorImporte));
  }, [saldoDisp, importeNumber]);

  const [puntosCanje, setPuntosCanje] = useState(0);
  const [canjeEditado, setCanjeEditado] = useState(false);

  // Historial
  const [showHistorial, setShowHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");

  // Status y último movimiento
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [ultimoMovimiento, setUltimoMovimiento] = useState(null);

  // Foco para el lector
  useEffect(() => {
    const el = inputRef.current;
    if (el) el.focus();
    const onWindowFocus = () => setTimeout(() => el && el.focus(), 0);
    window.addEventListener("focus", onWindowFocus);
    return () => window.removeEventListener("focus", onWindowFocus);
  }, []);

  // Autollenar canje sugerido si no lo editó el cajero
  useEffect(() => {
    if (!canjeEditado) setPuntosCanje(sugeridoCanje || 0);
  }, [sugeridoCanje, canjeEditado]);

  const handleKeyDown = async (e) => {
    if (e.key === "Enter") {
      const norm = normalizeQR(buffer);
      setQr(norm);
      setBuffer("");

      const id = parseClienteId(norm);
      setClienteId(id);

      if (!referencia) setReferencia(`TCK-${Date.now()}`);

      await fetchClienteYSaldo(norm);
      setShowHistorial(false);
      setHistorial([]);
      setErrorHistorial("");
    }
  };

  const fetchClienteYSaldo = async (qrStr) => {
    setClienteNombre("");
    setSaldoDisp(null);
    setStatus({ type: "", msg: "" });

    const id = parseClienteId(qrStr);
    if (!id) {
      setStatus({
        type: "error",
        msg: "Formato QR inválido. Esperado: CLI:<id_cliente>",
      });
      return;
    }

    try {
      const { data } = await api.get(`/movimientos/resumen/${id}`);
      setClienteNombre(data.cliente || "");
      setSaldoDisp(Number(data.puntos_disponibles) || 0);
    } catch {
      setStatus({
        type: "error",
        msg: "No se pudo cargar el saldo del cliente (resumen).",
      });
    }
  };

  const cargarHistorial = async () => {
    setErrorHistorial("");
    if (!clienteId) {
      setErrorHistorial("Primero escanea un QR válido (CLI:<id>).");
      setShowHistorial(true);
      return;
    }
    setCargandoHistorial(true);
    setShowHistorial(true);
    try {
      const { data } = await api.get(`/movimientos/historial/${clienteId}`);
      setHistorial(Array.isArray(data) ? data : []);
    } catch {
      setErrorHistorial("No se pudo obtener el historial de movimientos.");
    } finally {
      setCargandoHistorial(false);
    }
  };

  const acumular = async () => {
    setStatus({ type: "", msg: "" });
    setUltimoMovimiento(null);

    if (!qr) return setStatus({ type: "error", msg: "Primero escanea un QR válido." });
    if (!qr.toUpperCase().startsWith("CLI:")) {
      return setStatus({ type: "error", msg: "Formato QR inválido. Esperado: CLI:<id_cliente>" });
    }
    if (!referencia?.trim()) {
      return setStatus({ type: "error", msg: "La referencia (folio/ticket) es obligatoria." });
    }
    if (!importeNumber) {
      return setStatus({ type: "error", msg: "Captura el importe del ticket para calcular los puntos." });
    }
    if (!puntosAcum || puntosAcum <= 0) {
      return setStatus({ type: "error", msg: "El cálculo de puntos debe ser mayor a 0." });
    }

    try {
      const payload = {
        qr_data: qr,
        puntos: Number(puntosAcum),
        descripcion: descripcion || null,
        referencia: referencia.trim(),
      };
      const { data } = await api.post("/caja/acumular-qr", payload);
      setUltimoMovimiento(data);
      setStatus({ type: "ok", msg: `Puntos acumulados correctamente. (+${data.puntos})` });
      setDescripcion("");
      await fetchClienteYSaldo(qr);
    } catch (err) {
      const code = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (code === 409) {
        setStatus({ type: "warn", msg: "Este ticket ya fue acumulado para este cliente." });
      } else if (code === 404) {
        setStatus({ type: "error", msg: "Cliente no encontrado." });
      } else if (code === 400) {
        setStatus({ type: "error", msg: detail || "Solicitud inválida." });
      } else {
        setStatus({ type: "error", msg: detail || "Error inesperado al acumular." });
      }
    } finally {
      inputRef.current?.focus();
    }
  };

  const canjear = async () => {
    setStatus({ type: "", msg: "" });
    setUltimoMovimiento(null);

    if (!qr) return setStatus({ type: "error", msg: "Primero escanea un QR válido." });
    if (!qr.toUpperCase().startsWith("CLI:")) {
      return setStatus({ type: "error", msg: "Formato QR inválido. Esperado: CLI:<id_cliente>" });
    }
    if (!referencia?.trim()) {
      return setStatus({ type: "error", msg: "La referencia (folio/ticket) es obligatoria." });
    }
    if (!importeNumber) {
      return setStatus({ type: "error", msg: "Captura el importe del ticket para sugerir el canje." });
    }
    const pts = Number(puntosCanje);
    if (!pts || pts <= 0) {
      return setStatus({ type: "error", msg: "Indica los puntos a canjear (mayor a 0)." });
    }
    if (saldoDisp != null && pts > saldoDisp) {
      return setStatus({ type: "error", msg: "Los puntos a canjear exceden el saldo disponible." });
    }
    const maxPorImporte = Math.floor(importeNumber);
    if (pts > maxPorImporte) {
      return setStatus({ type: "error", msg: `Para este ticket, el máximo canjeable es ${maxPorImporte} pts.` });
    }

    try {
      const payload = {
        qr_data: qr,
        puntos: pts,
        descripcion: descripcion || null,
        referencia: referencia.trim(),
      };
      const { data } = await api.post("/caja/canjear-qr", payload);
      setUltimoMovimiento(data);
      setStatus({ type: "ok", msg: `Canje realizado correctamente. (-${data.puntos} pts)` });
      setDescripcion("");
      await fetchClienteYSaldo(qr);
      setCanjeEditado(false);
    } catch (err) {
      const code = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (code === 400) {
        setStatus({ type: "error", msg: detail || "Solicitud inválida para canje." });
      } else if (code === 404) {
        setStatus({ type: "error", msg: "Cliente no encontrado." });
      } else if (code === 409) {
        setStatus({ type: "warn", msg: "Movimiento duplicado (índice único)." });
      } else {
        setStatus({ type: "error", msg: detail || "Error inesperado al canjear." });
      }
    } finally {
      inputRef.current?.focus();
    }
  };

  const limpiar = () => {
    setBuffer("");
    setQr("");
    setClienteId(null);
    setReferencia("");
    setDescripcion("");
    setImporte("");
    setPuntosCanje(0);
    setCanjeEditado(false);
    setUltimoMovimiento(null);
    setStatus({ type: "", msg: "" });
    setClienteNombre("");
    setSaldoDisp(null);
    setShowHistorial(false);
    setHistorial([]);
    setErrorHistorial("");
    inputRef.current?.focus();
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerBar}>
          <h2 style={styles.title}>Caja · Escaneo HID</h2>
        </div>

        {/* Campo “captura” del lector */}
        <div style={styles.card}>
          <label style={styles.label}>Entrada del lector (auto-enfocado)</label>
          <input
            ref={inputRef}
            type="text"
            value={buffer}
            onChange={(e) => setBuffer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escanee el QR del cliente y presione Enter"
            style={styles.input}
          />
          <small style={{ color: "#6B7280" }}>
            Si ves “CLIÑ…” se normaliza automáticamente a “CLI:…”.
          </small>
        </div>

        {/* Info cliente / saldo */}
        <div style={styles.card}>
          <div style={styles.rowBetween}>
            <div>
              <label style={styles.label}>QR leído (normalizado)</label>
              <code style={styles.code}>{qr || "—"}</code>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={styles.subtle}>
                <strong>Cliente:</strong> {clienteNombre || "—"}
              </div>
              <div style={styles.subtle}>
                <strong>Saldo disponible:</strong>{" "}
                {saldoDisp != null ? `${saldoDisp} pts` : "—"}
              </div>
            </div>
          </div>

          {/* Importe / referencia */}
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Importe del ticket</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                placeholder="Ej. 1500.50"
                style={styles.input}
              />
              <small style={{ color: "#6B7280" }}>
                Para acumulación calculamos el 1% redondeado.
              </small>
            </div>

            <div>
              <label style={styles.label}>Referencia (folio/ticket)</label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej. F123456"
                style={styles.input}
              />
            </div>
          </div>

          {/* Acumular y Canjear */}
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Puntos a acumular (1% redondeado)</label>
              <input
                type="number"
                min={0}
                value={puntosAcum}
                readOnly
                style={{ ...styles.input, background: "#F9FAFB" }}
              />
            </div>

            <div>
              <label style={styles.label}>Puntos a canjear</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  min={0}
                  value={puntosCanje}
                  onChange={(e) => {
                    setPuntosCanje(Number(e.target.value || 0));
                    setCanjeEditado(true);
                  }}
                  placeholder={sugeridoCanje ? String(sugeridoCanje) : "0"}
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => {
                    setPuntosCanje(sugeridoCanje || 0);
                    setCanjeEditado(false);
                  }}
                  style={{ ...styles.btnBase, ...styles.btnSuggested }}
                  title="Usar el máximo sugerido"
                >
                  ⭐ Usar sugerido
                </button>
              </div>
              <small style={{ color: "#6B7280" }}>
                Sugerencia: {sugeridoCanje} pts (máx. por importe y saldo).
              </small>
            </div>
          </div>

          <label style={styles.label}>Descripción (opcional)</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Compra mostrador"
            style={styles.input}
          />

          {/* Botones de acción (todos SOLID) */}
          <div style={styles.actionsRow}>
            <button onClick={acumular} style={{ ...styles.btnBase, ...styles.btnPrimary }}>
              ➕ Acumular
            </button>
            <button onClick={canjear} style={{ ...styles.btnBase, ...styles.btnDark }}>
              🔁 Canjear
            </button>
            <button onClick={limpiar} style={{ ...styles.btnBase, ...styles.btnGrey }}>
              🧹 Limpiar
            </button>
            <button
              style={{ ...styles.btnBase, ...styles.btnSteel }}
              onClick={() => fetchClienteYSaldo(qr)}
              disabled={!clienteId}
              title="Actualizar saldo desde backend"
            >
              ↻ Refrescar saldo
            </button>
            <button
              style={{ ...styles.btnBase, ...styles.btnAccent }}
              onClick={cargarHistorial}
              disabled={!clienteId}
              title="Ver historial de movimientos"
            >
              📜 Ver historial
            </button>
          </div>

          {status.msg ? (
            <div
              style={{
                ...styles.alert,
                ...(status.type === "ok"
                  ? styles.ok
                  : status.type === "warn"
                  ? styles.warn
                  : status.type === "error"
                  ? styles.err
                  : {}),
              }}
            >
              {status.msg}
            </div>
          ) : null}

          {ultimoMovimiento ? (
            <div style={styles.lastBox}>
              <strong>Último movimiento</strong>
              <div style={{ fontSize: 14, color: "#444" }}>
                #{ultimoMovimiento.id} — {ultimoMovimiento.tipo}{" "}
                {ultimoMovimiento.tipo === "acumulado" ? "+" : "-"}
                {ultimoMovimiento.puntos} pts
                <br />
                {ultimoMovimiento.descripcion || "—"} · Ref:{" "}
                {ultimoMovimiento.referencia || "—"}
                <br />
                {new Date(ultimoMovimiento.fecha).toLocaleString()}
              </div>
            </div>
          ) : null}
        </div>

        {/* Sección inferior: Historial */}
        {showHistorial && (
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Historial de movimientos</h3>
              <button style={{ ...styles.btnBase, ...styles.btnGrey }} onClick={() => setShowHistorial(false)}>
                Ocultar
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              {!clienteId ? (
                <div style={styles.empty}>Escanea primero un QR para ver el historial.</div>
              ) : cargandoHistorial ? (
                <div style={styles.empty}>Cargando…</div>
              ) : errorHistorial ? (
                <div style={{ ...styles.alert, ...styles.err }}>{errorHistorial}</div>
              ) : historial.length === 0 ? (
                <div style={styles.empty}>Sin movimientos registrados.</div>
              ) : (
                <div style={styles.historyList}>
                  {historial.map((m) => (
                    <div key={m.id} style={styles.historyItem}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={styles.badge(m.tipo)}>
                          {m.tipo === "acumulado" ? "Acumulado" : "Canjeado"}
                        </span>
                        <strong style={{ color: m.tipo === "acumulado" ? "#065f46" : "#991b1b" }}>
                          {m.tipo === "acumulado" ? "+" : "-"}
                          {m.puntos} pts
                        </strong>
                      </div>
                      <div style={styles.historyMeta}>
                        <span>Ref: {m.referencia || "—"}</span>
                        <span>{new Date(m.fecha).toLocaleString()}</span>
                      </div>
                      <div style={{ color: "#374151" }}>{m.descripcion || "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const BRAND_PRIMARY = "#4F8A10";  // verde menos brillante (mejor legibilidad)
const BRAND_PRIMARY_DARK = "#3F6E0C";
const ACCENT_DARK = "#343839";
const STEEL = "#374151";
const GREY = "#4B5563";
const DARK = "#111827";

const styles = {
  page: {
    background: "#F3F4F6",
    minHeight: "100vh",
    padding: "16px 12px",
    boxSizing: "border-box",
  },
  container: { maxWidth: 980, margin: "0 auto" },
  headerBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { margin: 0, color: "#111827", fontWeight: 700 },
  card: {
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    background: "#FFFFFF",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  rowBetween: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  grid2: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    marginTop: 8,
  },
  label: { display: "block", fontSize: 14, color: "#374151", marginBottom: 6, fontWeight: 600 },
  subtle: { fontSize: 14, color: "#374151" },
  input: {
    width: "100%",
    maxWidth: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #CBD5E1",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
  },

  // Botones (SOLID)
  actionsRow: { display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" },
  btnBase: {
    padding: "11px 16px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
    border: "1px solid transparent",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    whiteSpace: "nowrap",
    color: "#fff",
  },
  btnPrimary: {
    background: BRAND_PRIMARY,
    borderColor: BRAND_PRIMARY,
  },
  btnSuggested: {
    background: "#5AA317",
    borderColor: "#5AA317",
  },
  btnDark: {
    background: DARK,
    borderColor: DARK,
  },
  btnGrey: {
    background: GREY,
    borderColor: GREY,
  },
  btnSteel: {
    background: STEEL,
    borderColor: STEEL,
  },
  btnAccent: {
    background: ACCENT_DARK,
    borderColor: ACCENT_DARK,
  },

  code: {
    background: "#F3F4F6",
    padding: "3px 8px",
    borderRadius: 6,
    fontFamily: "ui-monospace,SFMono-Regular,Menlo,Monaco",
  },
  alert: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 14,
  },
  ok: { background: "#e6ffed", border: "1px solid #b7f5c2", color: "#065f46" },
  warn: { background: "#fff7ed", border: "1px solid #fed7aa", color: "#92400e" },
  err: { background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b" },
  lastBox: {
    marginTop: 12,
    padding: 12,
    background: "#F9FAFB",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
  },

  // Historial embebido
  historyList: { display: "grid", gap: 10, marginTop: 10 },
  historyItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
  },
  historyMeta: {
    display: "flex",
    justifyContent: "space-between",
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 6,
  },
  badge: (tipo) => ({
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    color: tipo === "acumulado" ? "#065f46" : "#991b1b",
    background: tipo === "acumulado" ? "#e6ffed" : "#fee2e2",
    border: `1px solid ${tipo === "acumulado" ? "#b7f5c2" : "#fecaca"}`,
  }),
  empty: {
    textAlign: "center",
    padding: "24px 12px",
    color: "#6B7280",
    background: "#F9FAFB",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
  },
};