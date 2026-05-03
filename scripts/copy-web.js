// Kopieert de renderer-build naar dist-web/ voor Capacitor
import { cpSync, rmSync, mkdirSync } from 'fs'
import { join } from 'path'

const src = join(process.cwd(), 'out/renderer')
const dst = join(process.cwd(), 'dist-web')

rmSync(dst, { recursive: true, force: true })
mkdirSync(dst, { recursive: true })
cpSync(src, dst, { recursive: true })
console.log('dist-web/ bijgewerkt vanuit out/renderer/')
