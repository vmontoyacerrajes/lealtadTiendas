import React, { createContext, useContext, useState } from 'react';

type Movimiento = {
  id: number;
  tipo: string;
  puntos: number;
  descripcion: string;
  fecha: string;
};

type Cliente = {
  id_cliente: number;
  nombre: string;
  correo: string;
  telefono?: string;
  codigo_sap?: string;
  movimientos: Movimiento[];
};

interface AuthContextType {
  cliente: Cliente | null;
  setCliente: (cliente: Cliente | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  cliente: null,
  setCliente: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cliente, setCliente] = useState<Cliente | null>(null);

  return (
    <AuthContext.Provider value={{ cliente, setCliente }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);