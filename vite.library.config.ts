import { defineConfig } from 'vite'
import path from 'node:path'

export function libraryConfig(root: string, externals: string[]) {
  return defineConfig({ build: {
    emptyOutDir: false,
    lib: { entry: path.join(root, 'src/index.ts'), formats: ['es', 'cjs'], fileName: format => format === 'es' ? 'index.js' : 'index.cjs' },
    rollupOptions: { external: id => externals.some(name => id === name || id.startsWith(`${name}/`)) },
  } })
}
