import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,   // expose ke jaringan lokal — HP bisa akses via IP (192.168.x.x:5173)
    port: 5173,
  }
})

