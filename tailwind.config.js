/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Mintari brand colors - Enhanced for better contrast
        lavender: "#9B7BFF",
        peach: "#FF8A5B", 
        sky: "#5BA3FF",
        pink: "#FF4D7A",
        soft: "#F0EBFF",
        "mintari-ink": "#1A0B4A",
        "mintari-lav": "#D4C7FF",
        // Additional vibrant colors
        "lavender-dark": "#7B5BFF",
        "peach-dark": "#FF6B3B",
        "sky-dark": "#3B8BFF",
        "pink-dark": "#FF2D5A",
        // Keep existing shadcn colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ["'Clash Display'", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "mintari": "linear-gradient(135deg, #9B7BFF 0%, #FF8A5B 50%, #5BA3FF 100%)",
        "gradient-text": "linear-gradient(135deg, #9B7BFF 0%, #FF8A5B 100%)",
        "gradient-pastel": "linear-gradient(135deg, #D4C7FF 0%, #FFD4C7 50%, #C7E4FF 100%)",
        "gradient-vibrant": "linear-gradient(135deg, #7B5BFF 0%, #FF6B3B 50%, #3B8BFF 100%)",
      },
      boxShadow: {
        "soft": "0 4px 20px rgba(155, 123, 255, 0.25)",
        "floating": "0 8px 32px rgba(155, 123, 255, 0.35), 0 2px 8px rgba(155, 123, 255, 0.2)",
        "glow": "0 0 25px rgba(255, 77, 122, 0.5), 0 4px 20px rgba(155, 123, 255, 0.25)",
        "storybook": "0 4px 20px rgba(155, 123, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        "vibrant": "0 6px 25px rgba(123, 91, 255, 0.3), 0 2px 10px rgba(255, 107, 59, 0.2)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
