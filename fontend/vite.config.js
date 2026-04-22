import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = (env.VITE_DEV_PROXY_TARGET || '').replace(/\/+$/, '')

  if (!proxyTarget) {
    throw new Error('缺少环境变量 VITE_DEV_PROXY_TARGET')
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, '/api'),
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
        }
      },
    },
    build: {
      target: 'es2015',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia']
          }
        }
      }
    },
    define: {
      global: 'globalThis',
    }
  }
})
 
