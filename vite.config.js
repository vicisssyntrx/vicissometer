import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
          chartjs: ['chart.js'],
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
