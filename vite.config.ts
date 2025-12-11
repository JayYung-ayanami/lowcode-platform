import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // 是否添加 global, process, Buffer 等 polyfill
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // 是否 polyfill node 内置模块 (如 fs, path 等)
      protocolImports: true,
    }),
  ],
})