import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        accent: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      container: {
        center: true,
        padding: "1rem",
      },
      boxShadow: {
        glow: "0 10px 30px -8px rgba(5, 150, 105, 0.45)",
        "glow-lg": "0 18px 50px -10px rgba(5, 150, 105, 0.5)",
        card: "0 1px 3px rgba(24, 24, 27, 0.06), 0 10px 30px -12px rgba(24, 24, 27, 0.12)",
        "card-hover": "0 4px 10px rgba(24, 24, 27, 0.06), 0 24px 50px -12px rgba(24, 24, 27, 0.22)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "none" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(3deg)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-8deg)" },
          "75%": { transform: "rotate(8deg)" },
        },
        shine: {
          from: { transform: "translateX(-120%) skewX(-18deg)" },
          to: { transform: "translateX(240%) skewX(-18deg)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, .45)" },
          "70%": { boxShadow: "0 0 0 10px rgba(16, 185, 129, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up .6s cubic-bezier(.21,.61,.35,1) both",
        "fade-in": "fade-in .5s ease both",
        "scale-in": "scale-in .45s cubic-bezier(.21,.61,.35,1) both",
        float: "float 7s ease-in-out infinite",
        "float-slow": "float 11s ease-in-out infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        marquee: "marquee 22s linear infinite",
        pop: "pop .45s cubic-bezier(.3,1.6,.5,1)",
        wiggle: "wiggle .5s ease-in-out",
        "pulse-ring": "pulse-ring 2.2s cubic-bezier(.4,0,.6,1) infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
