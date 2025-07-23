import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Ensure environment variables are loaded
  envDir: '.',
  server: command === 'serve' ? {
    proxy: {
      '/api': process.env.VITE_API_SERVER_URL || 'http://localhost:5001',
    },
  } : undefined,
}))
