import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {},
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },

      fontFamily: {
        galindo: "var(--font-galindo)",
        adLib: ["AdLib"],
      },

      backgroundImage: {
        textGradient:
          "linear-gradient(90deg, #9A44FF 0%, #579BCC 50%, #15F094 95%)",
        buttonGradient:
          "radial-gradient(98.55% 98.55% at 1.45% 57.79%, #9747FF 0%, #579ACE 50%, #15F094 95%)",
        loaderGradient:
          "linear-gradient(90deg, #9945FF 0%, #5E90D2 50%, #15F094 95%)",
      },

      container: {
        center: true,
        padding: "16px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
