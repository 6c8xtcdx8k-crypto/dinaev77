import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          purple: "#a855f7",
          blue: "#3b82f6",
          cyan: "#06b6d4",
          green: "#10b981",
          yellow: "#f59e0b",
          pink: "#ec4899",
          orange: "#f97316",
        },
        dark: {
          900: "#080b14",
          800: "#0d1120",
          700: "#131929",
          600: "#1a2236",
          500: "#1e2a40",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "neon-purple": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "neon-blue": "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
        "neon-green": "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
        "neon-gold": "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
      },
      boxShadow: {
        "neon-purple": "0 0 20px rgba(168,85,247,0.5), 0 0 60px rgba(168,85,247,0.2)",
        "neon-blue": "0 0 20px rgba(59,130,246,0.5), 0 0 60px rgba(59,130,246,0.2)",
        "neon-green": "0 0 20px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.2)",
        "neon-cyan": "0 0 20px rgba(6,182,212,0.5), 0 0 60px rgba(6,182,212,0.2)",
        "neon-pink": "0 0 20px rgba(236,72,153,0.5), 0 0 60px rgba(236,72,153,0.2)",
        "neon-gold": "0 0 20px rgba(245,158,11,0.5), 0 0 60px rgba(245,158,11,0.2)",
        "glow-sm": "0 0 10px rgba(168,85,247,0.4)",
        "glow-lg": "0 0 40px rgba(168,85,247,0.3), 0 0 80px rgba(59,130,246,0.2)",
        "card": "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "bounce-slow": "bounce 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "particle": "particle 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(168,85,247,0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(168,85,247,0.9), 0 0 80px rgba(168,85,247,0.4)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        particle: {
          "0%, 100%": { transform: "translateY(0) scale(1)", opacity: "0.7" },
          "50%": { transform: "translateY(-30px) scale(1.2)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
