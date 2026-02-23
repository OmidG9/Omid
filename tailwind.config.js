/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#020617", // slate-950
        "bg-secondary": "#0f172a", // slate-900
        surface: "#1e293b", // slate-800
        border: "#334155", // slate-700
        "text-primary": "#f1f5f9", // slate-100
        "text-secondary": "#94a3b8", // slate-400
        accent: "#3b82f6", // blue-500
        "accent-dark": "#2563eb", // blue-600
        "accent-light": "#60a5fa", // blue-400
        highlight: "#22d3ee", // cyan-400
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient":
          "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(59,130,246,0.15), transparent)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.15)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.2)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
