import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Stringify the API key to inject it into the code at build/runtime.
      // Fallback to empty string to prevent build errors if env is missing.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      host: '0.0.0.0',
      port: 8080,
      strictPort: true
    },
    preview: {
      host: '0.0.0.0',
      port: 8080,
      strictPort: true,
      allowedHosts: true
    }
  };
});