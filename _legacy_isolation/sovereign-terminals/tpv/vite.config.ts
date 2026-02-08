import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3002, // Different port from KDS (3001)
    fs: {
      // Allow importing files from outside the tpv root
      allow: ["..", "../../merchant-portal", "../../core-engine"],
    },
  },
});
