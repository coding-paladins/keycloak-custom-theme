import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { keycloakify } from "keycloakify/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    keycloakify({
      accountThemeImplementation: "Multi-Page"
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/lucide-react")) return "lucide";
          if (id.includes("node_modules/@radix-ui")) return "radix";
          if (id.includes("node_modules/oidc-spa")) return "oidc";
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
