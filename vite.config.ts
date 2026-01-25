import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Caricamento variabili d'ambiente (Node context)
  const env = loadEnv(mode, (process as any).cwd(), '');
  const port = parseInt(process.env.PORT || '8080');

  return {
    plugins: [react()],
    // Providing process.env.API_KEY to the client context as required by guidelines
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      host: '0.0.0.0',
      port: port,
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: port,
      strictPort: true,
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
