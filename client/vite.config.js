import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  if (command === "serve") {
    return {
      plugins: [react()],
      server: {
        proxy: {
          "/api": {
            target: "http://localhost:3001",
          },
        },
      },
    };
  } else {
    return {
      plugins: [react()],
    };
  }
});
