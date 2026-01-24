
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // CSP che permette embedding in AI Studio
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://pagead2.googlesyndication.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' ws: wss: https://generativelanguage.googleapis.com https://pagead2.googlesyndication.com",
    "frame-ancestors 'self' https://aistudio.google.com https://*.google.com https://*.googleusercontent.com"
  ].join('; ');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      host: '0.0.0.0',
      port: 8080,
      strictPort: true,
      headers: {
        'Content-Security-Policy': cspHeader,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    },
    preview: {
      host: '0.0.0.0',
      port: 8080,
      strictPort: true,
      allowedHosts: ['hangman.giacomel.info', 'aistudio.google.com', '.googleusercontent.com'],
      headers: {
        'Content-Security-Policy': cspHeader,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser'
    }
  };
});
