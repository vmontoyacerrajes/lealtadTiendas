import { useState, useRef, useEffect } from "react";

function App() {
  const [codigo, setCodigo] = useState("");
  const inputRef = useRef(null);

  // Enfoca el input al cargar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Detectar "Enter" después de escanear
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && codigo !== "") {
      console.log("QR recibido del escáner:", codigo);
      // Aquí puedes hacer fetch al backend o navegar a otra vista
      // luego limpiar
      setCodigo("");
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Escaneo de QR - Caja</h1>
      <input
        ref={inputRef}
        type="text"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Escanea un código QR"
        style={{ fontSize: "1.5rem", padding: "1rem", width: "300px" }}
      />
    </div>
  );
}

export default App;
