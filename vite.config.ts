import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Two entry points: the studio model viewer (/) and the game (/game/).
export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        studio: resolve(import.meta.dirname, 'index.html'),
        game: resolve(import.meta.dirname, 'game/index.html'),
      },
    },
  },
});
