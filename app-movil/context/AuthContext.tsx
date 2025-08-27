import React, { createContext, useContext, useState } from "react";

type Cliente = {
  id_cliente: number;
  nombre: string;
  correo: string;
};

type AuthContextType = {
  cliente: Cliente | null;
  setCliente: React.Dispatch<React.SetStateAction<Cliente | null>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cliente, setCliente] = useState<Cliente | null>(null);

  return (
    <AuthContext.Provider value={{ cliente, setCliente }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
};