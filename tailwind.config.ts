import type { Config } from "tailwindcss";

/**
 * Corporate HEX palette - mirrored in `app/globals.css` (@theme) for Tailwind v4.
 * Primary Base: #031F82 | Panel: #BDE9FB | Secondary: #0CC1E0
 * CTA Accent: #FFA503 | Design Accent: #DCB766
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nga: {
          primary: "#031F82",
          "primary-hover": "#021554",
          panel: "#BDE9FB",
          secondary: "#0CC1E0",
          cta: "#FFA503",
          "cta-hover": "#E89400",
          "cta-shadow": "#C88202",
          "secondary-shadow": "#099FB8",
          accent: "#DCB766",
          ink: "#031F82",
          slate: "#1E3A5F",
          surface: "#FFFFFF",
          mist: "#E8F6FC",
          explorer: "#8B5CF6",
          pathfinder: "#0CC1E0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      zIndex: {
        base: "var(--z-index-base)",
        raised: "var(--z-index-raised)",
        sticky: "var(--z-index-sticky)",
        chrome: "var(--z-index-chrome)",
        overlay: "var(--z-index-overlay)",
        modal: "var(--z-index-modal)",
        toast: "var(--z-index-toast)",
        dev: "var(--z-index-dev)",
      },
    },
  },
};

export default config;
