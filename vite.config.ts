import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carichiamo le variabili d'ambiente (inclusa la API_KEY di Gemini)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Cloud Run fornisce la porta tramite la variabile d'ambiente PORT.
  // Dobbiamo assicurarci di usarla, altrimenti il container fallirà l'health check.
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
      minify: 'esbuild'
    }
  };
});