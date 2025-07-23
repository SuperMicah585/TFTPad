import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure environment variables are loaded
  envDir: '.',
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
})
