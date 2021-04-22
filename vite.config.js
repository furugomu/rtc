import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";

// https://vitejs.dev/config/
export default defineConfig({
  server: { proxy: { "/socket.io": "http://localhost:8999" } },
  plugins: [reactRefresh()],
  esbuild: {
    jsxInject: `import {createElement} from 'react'`,
    jsxFactory: "createElement",
  },
});
