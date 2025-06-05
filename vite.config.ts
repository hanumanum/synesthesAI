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
        raven: resolve(__dirname, 'raven.html'),
        butterfly: resolve(__dirname, 'butterfly.html'),
        khayyam: resolve(__dirname, 'khayyam.html'),
        sail: resolve(__dirname, 'sail.html')
      }
    }
  }
}); 