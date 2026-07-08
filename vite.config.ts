import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function copyToBackendPlugin() {
  return {
    name: 'copy-to-backend',
    closeBundle() {
      const BACKEND_PATH = path.resolve(__dirname, '../backend/src/main/assert/static')
      const src = path.resolve(__dirname, 'dist')
      if (!fs.existsSync(src)) return
      if (!fs.existsSync(BACKEND_PATH)) {
        fs.mkdirSync(BACKEND_PATH, { recursive: true })
      }
      function copyRecursive(srcDir: string, destDir: string) {
        const entries = fs.readdirSync(srcDir, { withFileTypes: true })
        for (const entry of entries) {
          const srcPath = path.join(srcDir, entry.name)
          const destPath = path.join(destDir, entry.name)
          if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true })
            copyRecursive(srcPath, destPath)
          } else {
            fs.copyFileSync(srcPath, destPath)
          }
        }
      }
      copyRecursive(src, BACKEND_PATH)
      console.log(`[copy-to-backend] 已复制前端产物到 ${BACKEND_PATH}`)
    }
  }
}

export default defineConfig({
  base: '/ext/sfc-ext-ai-assistant/',
  plugins: [vue(), copyToBackendPlugin()],
  define: { 'process.env': {} },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'sfc-ext-ai-assistant',
      fileName: () => 'index.umd.js',
      formats: ['umd']
    },
    rollupOptions: {
      external: ['vue', 'vuetify', 'sfc-common', 'sfc-common/components'],
      output: {
        globals: {
          vue: 'Vue',
          vuetify: 'Vuetify',
          'sfc-common': 'SfcCommon',
          'sfc-common/components': 'Components'
        }
      }
    },
    outDir: 'dist'
  }
})
