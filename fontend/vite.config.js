import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = (env.VITE_DEV_PROXY_TARGET || '').replace(/\/+$/, '')

  if (command === 'serve' && !proxyTarget) {
    throw new Error('缺少环境变量 VITE_DEV_PROXY_TARGET')
  }

  const server = proxyTarget
    ? {
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
            rewrite: (requestPath) => requestPath.replace(/^\/api/, '/api'),
          },
          '/uploads': {
            target: proxyTarget,
            changeOrigin: true,
          },
        },
      }
    : undefined

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server,
    build: {
      target: 'es2015',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
          },
        },
      },
    },
    define: {
      global: 'globalThis',
    },
  }
})
