// src/api.js
import axios from "axios";

export const API_BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8000").replace(/\/+$/, "");

// Log sólo en desarrollo (y sin molestar al linter)
/* eslint-disable no-console */
if (process.env.NODE_ENV === "development") {
  console.log("API base:", API_BASE);
}
/* eslint-enable no-console */

/** Instancia pública (sin Authorization) — para /login u otros endpoints sin token */
export const apiPublic = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/** Instancia autenticada */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token_caja");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const method = (config.method || "get").toLowerCase();
  if (!config.headers["Content-Type"] && method !== "get") {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token_caja");
    }
    return Promise.reject(err);
  }
);

export default api;

/** Helper de login (usa la instancia pública) */
export async function loginCaja(username, password) {
  try {
    const { data } = await apiPublic.post("/login", { username, password, origin: "caja" });
    localStorage.setItem("token_caja", data.access_token);
    return data;
  } catch (err) {
    /* eslint-disable no-console */
    console.error("loginCaja error:", err?.response?.status, err?.response?.data || err.message);
    /* eslint-enable no-console */
    throw err;
  }
}

/** Helper para obtener perfil con token */
export async function getPerfil() {
  const { data } = await api.get("/perfil");
  return data;
}