import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // Serve brand_assets/ at the root so logo/favicon are accessible as /filename
  publicDir: 'brand_assets',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
