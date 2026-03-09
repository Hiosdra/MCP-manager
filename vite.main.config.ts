import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main/main.ts'),
        preload: path.resolve(__dirname, 'src/main/preload.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'cjs',
        dir: path.resolve(__dirname, 'dist/main'),
      },
      external: [
        'electron', 'better-sqlite3',
        'path', 'fs', 'fs/promises', 'os', 'crypto',
        'events', 'timers', 'stream', 'string_decoder', 'buffer', 'util', 'url',
      ],
    },
    outDir: 'dist/main',
    emptyOutDir: true,
    target: 'node18',
    minify: false,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});
