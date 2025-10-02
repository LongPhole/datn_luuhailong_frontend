import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devServerPort = Number(env.VITE_DEV_SERVER_PORT ?? '3000')
  const previewPort = Number(env.VITE_PREVIEW_PORT ?? '4173')
  const proxyTarget = env.VITE_PROXY_TARGET ?? 'http://localhost:8080'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/stores': path.resolve(__dirname, './src/stores'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/features': path.resolve(__dirname, './src/features')
      }
    },
    server: {
      port: devServerPort,
      host: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      port: previewPort,
      host: true
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
            state: ['zustand'],
            ui: [
              'lucide-react',
              '@radix-ui/react-slot',
              '@radix-ui/react-dialog',
              '@radix-ui/react-toast',
              '@radix-ui/react-popover'
            ]
          }
        }
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
  }
})
