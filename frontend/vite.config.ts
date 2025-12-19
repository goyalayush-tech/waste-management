import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    global: 'globalThis',
    // Provide a safe shim for process.env in the browser so existing CRA-style env access doesn't crash
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      PUBLIC_URL: JSON.stringify(''),
      // Optional CRA-style variables; defaults keep sensible localhost fallbacks in code
      REACT_APP_AI_API_URL: JSON.stringify(process.env.REACT_APP_AI_API_URL || ''),
      REACT_APP_EPR_API_URL: JSON.stringify(process.env.REACT_APP_EPR_API_URL || ''),
      REACT_APP_BLOCKCHAIN_API_URL: JSON.stringify(process.env.REACT_APP_BLOCKCHAIN_API_URL || ''),
      REACT_APP_AUTH_API_URL: JSON.stringify(process.env.REACT_APP_AUTH_API_URL || ''),
      REACT_APP_USE_MOCK_AI: JSON.stringify(process.env.REACT_APP_USE_MOCK_AI || ''),
      REACT_APP_USE_MOCK_EPR: JSON.stringify(process.env.REACT_APP_USE_MOCK_EPR || ''),
      REACT_APP_USE_MOCK_BLOCKCHAIN: JSON.stringify(process.env.REACT_APP_USE_MOCK_BLOCKCHAIN || ''),
      REACT_APP_USE_MOCK_AUTH: JSON.stringify(process.env.REACT_APP_USE_MOCK_AUTH || ''),
      REACT_APP_API_TIMEOUT: JSON.stringify(process.env.REACT_APP_API_TIMEOUT || ''),
      REACT_APP_API_RETRIES: JSON.stringify(process.env.REACT_APP_API_RETRIES || ''),
    },
  }
})