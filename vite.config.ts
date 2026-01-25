import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Cloud Run inietta la porta tramite la variabile d'ambiente PORT.
  // È fondamentale ascoltare su questa porta per superare l'health check.
  const port = parseInt(process.env.PORT || '8080');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      host: '0.0.0.0',
      port: port,
      strictPort: true
    },
    preview: {
      host: '0.0.0.0',
      port: port,
      strictPort: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', '@google/genai'],
          },
        },
      },
    }
  };
});