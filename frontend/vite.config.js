import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173, // frontend port
    proxy: {
      '/api': {
        target: 'http://localhost:3000',   // your backend server
        changeOrigin: true,
        secure: false,
        // path rewrite if needed (not required since backend already uses /api)
        // rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
});
