import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['aqua-canary-facial.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:5176',
        changeOrigin: true,
      },
    },
  },
})
