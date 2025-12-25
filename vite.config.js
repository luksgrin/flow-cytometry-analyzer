import { defineConfig } from 'vite';

export default defineConfig({
  // prevent vite from obscuring rust errors
  clearScreen: false,
  // Set root to src directory where index.html is located
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignore: ['**/src-tauri/**'],
    },
  },
});

