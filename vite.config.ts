import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

const isAnalyze = process.env.ANALYZE === 'true'

// https://vite.dev/config/
export default defineConfig(() => {
  const plugins = [react()]

  if (isAnalyze) {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: false,
      })
    )
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@pkg': path.resolve(__dirname, 'package.json'),
      },
    },
  }
})
