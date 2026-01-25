import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Cloud Run inietta la porta tramite la variabile d'ambiente PORT
  const port = parseInt(process.env.PORT || '8080');
  
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "media-src 'self' data: blob:",
    "connect-src 'self' ws: wss: https: http: *", 
    "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
    "frame-ancestors 'self' https://aistudio.google.com https://*.google.com https://*.googleusercontent.com"
  ].join('; ');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      host: '0.0.0.0',
      port: port,
      strictPort: true,
      headers: {
        'Content-Security-Policy': cspHeader
      }
    },
    preview: {
      host: '0.0.0.0',
      port: port,
      strictPort: true,
      headers: {
        'Content-Security-Policy': cspHeader
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild'
    }
  };
});