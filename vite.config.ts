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
        sail: resolve(__dirname, 'sail.html'),
        tao: resolve(__dirname, 'tao.html'),
        highlands: resolve(__dirname, 'highlands.html'),
        'poison-tree': resolve(__dirname, 'poison-tree.html'),
        'road-not-taken': resolve(__dirname, 'road.html')
      }
    }
  }
}); 