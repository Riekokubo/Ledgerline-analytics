import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages では https://ユーザー名.github.io/リポジトリ名/ に置かれるため、
  // 公開時だけ BASE_PATH（例：/Ledgerline-analytics/）を付ける。ローカルでは '/'
  base: process.env.BASE_PATH ?? '/',
})
