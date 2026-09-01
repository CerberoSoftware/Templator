/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: false,
  base: '/static/',
  build: {
    outDir: 'public/static',
    assetsDir: '',
    emptyOutDir: true,
    manifest: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('zustand')) return 'vendor-react'
            if (id.includes('@dnd-kit')) return 'vendor-dnd'
            if (id.includes('codemirror') || id.includes('@codemirror') || id.includes('@uiw')) return 'vendor-codemirror'
            if (id.includes('lucide-react')) return 'vendor-icons'
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8181',
      '/uploads': 'http://localhost:8181',
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.spec.ts'],
  },
})
