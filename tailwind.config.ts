import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pastel: {
          blue: "#CFE8FF",
          pink: "#FFD7E5",
          mint: "#CFF5E7",
          lavender: "#E6E0FF",
        },
        surface: "#F8FAFC",
        ink: "#1F2937",
        muted: "#6B7280",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;

