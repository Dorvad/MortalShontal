import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  server: {
    host: true,   // bind 0.0.0.0 so phones on the same network can connect
    port: 5173,
  },
  preview: {
    host: true,   // same for `npm run preview`
    port: 4173,
  },
});
