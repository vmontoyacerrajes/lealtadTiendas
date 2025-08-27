import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../api";

export default function QrScanner() {
  const refScanner = useRef<Html5QrcodeScanner | null>(null);
  const [decoded, setDecoded] = useState<string>("");
  const [puntos, setPuntos] = useState<string>("100");
  const [referencia, setReferencia] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("Compra en caja");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    });
    refScanner.current = scanner;

    const onSuccess = (text: string) => {
      setDecoded(text);
      // Detener el escaneo para no disparar múltiples lecturas
      refScanner.current?.clear().catch(() => {});
      refScanner.current = null;
    };

    const onError = (_: string) => {};
    scanner.render(onSuccess, onError);

    return () => {
      refScanner.current?.clear().catch(() => {});
      refScanner.current = null;
    };
  }, []);

  const reintentar = () => {
    // Volver a iniciar el scanner
    if (refScanner.current) return; // ya está activo
    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    });
    refScanner.current = scanner;
    scanner.render((text) => {
      setDecoded(text);
      refScanner.current?.clear().catch(() => {});
      refScanner.current = null;
    }, () => {});
  };

  const acumular = async () => {
    if (!decoded) {
      alert("Escanea un QR primero.");
      return;
    }
    if (!referencia.trim()) {
      alert("Referencia (folio/ticket) es obligatoria.");
      return;
    }
    try {
      const payload = {
        qr_data: decoded,                 // p.ej. "CLI:7"
        puntos: Number(puntos),          // > 0
        descripcion: descripcion || null,
        referencia,                      // evita doble acumulación por ticket
      };
      const { data } = await api.post("/caja/acumular-qr", payload);
      alert(`OK. Movimiento #${data.id} por ${data.puntos} puntos.`);
      // Limpia para siguiente operación
      setDecoded("");
      setReferencia("");
      reintentar();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Error al acumular";
      alert(String(msg));
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "20px auto" }}>
      <h2>Escanear QR cliente</h2>
      <div id="qr-reader" style={{ width: "100%" }} />
      <div style={{ marginTop: 12 }}>
        <div>QR leído: <b>{decoded || "(pendiente)"}</b></div>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="Puntos a acumular"
          value={puntos}
          onChange={(e) => setPuntos(e.target.value)}
        />
        <input
          placeholder="Referencia (ticket único)"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
        />
        <input
          placeholder="Descripción (opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <button onClick={acumular}>Acumular</button>
        <button onClick={reintentar}>Reintentar escaneo</button>
      </div>
    </div>
  );
}