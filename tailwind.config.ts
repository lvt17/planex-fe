import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Background colors
        page: "var(--bg-page)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        hover: "var(--bg-hover)",

        // Border colors
        border: "var(--border)",
        "border-light": "var(--border-light)",
        "border-focus": "var(--border-focus)",

        // Text colors
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",

        // Accent
        accent: "var(--accent-blue)",
        "accent-hover": "var(--accent-blue-hover)",

        // Syntax highlighting
        "syntax-green": "var(--syntax-green)",
        "syntax-purple": "var(--syntax-purple)",
        "syntax-orange": "var(--syntax-orange)",
        "syntax-cyan": "var(--syntax-cyan)",
        "syntax-red": "var(--syntax-red)",
        "syntax-yellow": "var(--syntax-yellow)",

        // Semantic
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        handwriting: ["var(--font-handwriting)", "Nanum Brush Script", "cursive"],
        elegant: ["var(--font-elegant)", "Bad Script", "cursive"],
        script: ["var(--font-script)", "Dancing Script", "cursive"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
