import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Fix: Removed the problematic 'css.postcss' block. Explicitly setting it to false was invalid 
// according to Vite's type definitions and unnecessary as Vite automatically picks up postcss.config.js.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Cloud Run inietta la porta tramite la variabile d'ambiente PORT.
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
