
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // SECURITY WARNING: 
      // This injects the API KEY into the client-side bundle. 
      // To secure your key, you MUST restrict it in the Google Cloud Console:
      // 1. Go to APIs & Services > Credentials
      // 2. Click your API Key
      // 3. Set "Application restrictions" to "HTTP referrers (web sites)"
      // 4. Add your domain (e.g., https://hangman.giacomel.info/* and http://localhost:8080/*)
      // If you do not do this, your key can be stolen and quota drained.
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
      allowedHosts: [
        'imparare-l-italiano-hangman-951398195520.us-west1.run.app',
        'hangman.giacomel.info'
      ]
    }
  };
});
