import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"]
      },
      boxShadow: {
        soft: "0 24px 60px rgba(15, 23, 42, 0.08)",
        card: "0 12px 32px rgba(15, 23, 42, 0.06)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(253, 230, 138, 0.35), transparent 30%), radial-gradient(circle at top right, rgba(251, 191, 36, 0.18), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;
