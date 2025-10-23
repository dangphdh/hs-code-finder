import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'embedding-providers': [
            './src/services/embedding/OpenAIProvider.ts',
            './src/services/embedding/CohereProvider.ts', 
            './src/services/embedding/HuggingFaceProvider.ts'
          ],
          'vector-search': ['./src/services/vectorSearch.ts'],
          'crypto': ['crypto-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  }
})