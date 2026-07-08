/**
 * vite closeBundle 钩子脚本。
 * 构建完成后将前端 UMD 产物拷贝到后端 assert/static 目录，
 * 确保 Maven 构建时能将前端产物打入 jar classpath。
 *
 * 使用方式（给 package.json scripts 用）：
 *   node scripts/copy-to-backend.mjs
 */
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const SRC = resolve(ROOT, 'dist')
const DEST = resolve(ROOT, '..', 'backend', 'src', 'main', 'assert', 'static')

function copyRecursive(srcDir, destDir) {
  if (!existsSync(srcDir)) return
  mkdirSync(destDir, { recursive: true })
  const entries = readdirSync(srcDir, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = resolve(srcDir, entry.name)
    const destPath = resolve(destDir, entry.name)
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

copyRecursive(SRC, DEST)
console.log(`[copy-to-backend] 已复制前端产物到 ${DEST}`)
