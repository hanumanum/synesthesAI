import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        resilience: resolve(__dirname, 'resilience.html'),
        resilience2: resolve(__dirname, 'resilience2.html'),
        raven: resolve(__dirname, 'raven.html'),
        butterfly: resolve(__dirname, 'butterfly.html')
      }
    }
  }
}); 