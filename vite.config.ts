import { defineConfig } from "vite";
import { ConfigPlugin } from "@dxos/config/vite-plugin";
import { VaultPlugin } from "@dxos/vault/vite-plugin";
import react from "@vitejs/plugin-react";
import { ThemePlugin } from "@dxos/aurora-theme/plugin";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
  },
  build: {
    outDir: "out/dxos-templates",
  },

  plugins: [
    VaultPlugin(),
    ConfigPlugin(),
    react({ jsxRuntime: "classic" }),
    ThemePlugin({
      content: [
        resolve(__dirname, "./index.html"),
        resolve(__dirname, "./src/**/*.{js,ts,jsx,tsx}"),
        resolve(__dirname, "node_modules/@dxos/aurora/dist/**/*.mjs"),
        resolve(__dirname, "node_modules/@dxos/aurora-theme/dist/**/*.mjs"),
        resolve(
          __dirname,
          "./node_modules/@braneframe/plugin-*/dist/lib/**/*.mjs"
        ),
      ],
    }),
  ],
});
