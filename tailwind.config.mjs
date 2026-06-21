/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Warm Minimal — Claude/Anthropic inspired
        warm: {
          DEFAULT: "#FAF8F5",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          50: "#FAFAF9",
          100: "#F5F3F0",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
          950: "#0C0A09",
        },
      },
      fontFamily: {
        display: ['"Source Serif 4"', '"Georgia"', '"Noto Serif"', "serif"],
        body: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
        hero: ["clamp(2.5rem, 1rem + 6vw, 3.75rem)", { lineHeight: "1.15" }],
      },
      borderRadius: {
        card: "10px",
        btn: "8px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
        "card-hover": "0 4px 20px rgba(0,0,0,0.06)",
        glow: "0 2px 8px rgba(217,119,6,0.08)",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: "none",
            "--tw-prose-body": "#44403C",
            "--tw-prose-headings": "#1C1917",
            "--tw-prose-links": "#D97706",
            "--tw-prose-code": "#DC5B3E",
            "--tw-prose-pre-bg": "#F5F3F0",
            "--tw-prose-pre-code": "#1C1917",
            "--tw-prose-pre-border": "#E7E5E4",
          },
        },
      }),
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
  ],
  daisyui: {
    themes: [
      {
        warm: {
          "primary": "#D97706",
          "secondary": "#DC5B3E",
          "accent": "#4B8B5E",
          "neutral": "#F5F3F0",
          "base-100": "#FAF8F5",
          "base-200": "#FFFFFF",
          "base-300": "#F5F3F0",
          "base-content": "#1C1917",
          "info": "#D97706",
          "success": "#4B8B5E",
          "warning": "#D9A44A",
          "error": "#DC5B3E",
        },
      },
    ],
    darkTheme: "warm",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
  },
};
