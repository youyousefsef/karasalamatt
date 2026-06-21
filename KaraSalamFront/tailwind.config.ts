import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8F8F8",
        accent: "#8163F4",
        dark: "#0D0D0D",
      },
    },
  },
  plugins: [],
};

export default config;
