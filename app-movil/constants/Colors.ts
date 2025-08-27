// constants/colors.ts
export const THEME = {
  colors: {
    // Marca (verde)
    brand: "#76BC21",
    brandDark: "#5A9A18",   // ~20% más oscuro
    brandLight: "#A3D85B",  // ~20% más claro
    brandSoft: "#EDF7E6",   // fondo muy suave con tinte verde

    // Escala de grises / texto / fondos
    white: "#FFFFFF",
    black: "#0A0A0A",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",

    text: "#111827",
    textMuted: "#6B7280",
    bg: "#FFFFFF",      // fondo principal claro
    card: "#FFFFFF",    // tarjetas claras
    border: "#E5E7EB",

    // Estados (manteniendo consistencia)
    success: "#16A34A",
    danger: "#DC2626",
    warning: "#D97706",

    // Por conveniencia, usa el mismo verde como acento
    accent: "#76BC21",
  },

  // UI tokens
  radius: 16,
  spacing: { sm: 8, md: 12, lg: 16 },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
} as const;

// Alias cómodo para imports existentes: Colors.brand, Colors.bg, etc.
export const Colors = THEME.colors;

export default THEME;