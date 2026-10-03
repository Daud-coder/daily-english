import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#eef8ff",
          100: "#d9eeff",
          200: "#bce2ff",
          300: "#8fd1ff",
          400: "#59b5ff",
          500: "#2f94ff",
          600: "#1874f5",
          700: "#125ee1",
          800: "#154bb6",
          900: "#17428f",
        },
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
        },
      },
      animation: {
        "pulse-slow": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "wave": "wave 1.2s ease-in-out infinite",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
