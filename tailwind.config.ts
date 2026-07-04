import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Палитра в духе meprod.ru: розовый + пастельно-голубой
        brand: {
          50: "#fff0fa",
          100: "#ffe3f6",
          200: "#ffc9ef",
          300: "#ffb0eb", // фирменный розовый
          400: "#ff8fdf",
          500: "#fb6ecb",
          600: "#ef47ae",
          700: "#d62e93",
          800: "#ab1f74",
          900: "#8a1a5e",
        },
        sky: {
          50: "#f2f9ff",
          100: "#e3f4fe", // бледно-голубой фон
          200: "#cdeafd",
          300: "#acdefc", // облачный голубой
          400: "#8ad2fd",
          500: "#67c6ff", // яркий голубой
          600: "#3fabf2",
          700: "#2b8cd6",
          800: "#2470ae",
          900: "#1f5c8d",
        },
        accent: {
          400: "#8ad2fd",
          500: "#67c6ff",
          600: "#3fabf2",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "system-ui", "sans-serif"],
      },
      container: {
        center: true,
        padding: "1rem",
      },
      boxShadow: {
        glow: "0 10px 30px -8px rgba(255, 143, 223, 0.55)",
        "glow-lg": "0 18px 50px -10px rgba(255, 143, 223, 0.6)",
        "glow-sky": "0 10px 30px -8px rgba(103, 198, 255, 0.5)",
        card: "0 1px 3px rgba(36, 99, 155, 0.05), 0 12px 32px -14px rgba(36, 99, 155, 0.18)",
        "card-hover": "0 4px 10px rgba(36, 99, 155, 0.06), 0 26px 54px -14px rgba(36, 99, 155, 0.3)",
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
          "0%": { boxShadow: "0 0 0 0 rgba(255, 143, 223, .5)" },
          "70%": { boxShadow: "0 0 0 10px rgba(255, 143, 223, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255, 143, 223, 0)" },
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
