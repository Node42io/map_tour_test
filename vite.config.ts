import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Self-contained mockup: the @node42/ui-kit source lives inside this folder
// (./ui-kit/src), copied from New-UIKit, and is compiled directly by Vite so the
// value-network / needs panels render in the real product's design language.
export default defineConfig({
  // Served from a GitHub Pages project site: https://node42io.github.io/map_tour_test/
  base: '/map_tour_test/',
  plugins: [react()],
  resolve: {
    alias: {
      '@node42/ui-kit': path.resolve(__dirname, './ui-kit/src/index.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
})
