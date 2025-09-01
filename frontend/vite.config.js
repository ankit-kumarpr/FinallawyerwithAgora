import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   build: {
    outDir: 'build', // 👈 This is what Vercel wants
    chunkSizeWarningLimit: 1000 // optional: to suppress 500kB warning
  }
})
