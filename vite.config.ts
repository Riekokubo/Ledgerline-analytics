import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // npm run build:gas（--mode gas）：Google Apps Script で配信する版。
  // GAS には HTML ファイルを1つしか置けないので、JS と CSS をすべて index.html に埋め込む
  if (mode === 'gas') {
    return {
      plugins: [react(), viteSingleFile()],
      base: './',
      build: { outDir: 'dist-gas', emptyOutDir: true },
    }
  }

  return {
    plugins: [react()],
    // GitHub Pages では https://ユーザー名.github.io/リポジトリ名/ に置かれるため、
    // 公開時だけ BASE_PATH（例：/Ledgerline-analytics/）を付ける。ローカルでは '/'
    base: process.env.BASE_PATH ?? '/',
  }
})
