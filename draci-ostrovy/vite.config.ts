import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Hra běží v kořeni vlastní domény (Railway, za přihlášením – server.mjs).
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Knihovny, základní pomůcky a obsah každého ostrova zvlášť: nové úlohy
        // nezneplatní v prohlížeči uložené knihovny ani ostatní ostrovy. Obsah
        // importuje jen czech/rng/types/grid/bank, takže mezi částmi nevznikne kruh.
        manualChunks(id) {
          if (id.includes('/node_modules/')) return 'knihovny';
          if (/\/src\/core\/(czech|rng|types|grid|bank)\.ts$/.test(id)) return 'zaklad';
          const island = id.match(/\/src\/content\/([^/]+)\//);
          if (island) return `ostrov-${island[1]}`;
          return undefined;
        },
      },
    },
  },
  server: { port: 3100 },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,mjs}'],
    // Kontroly obsahu procházejí tisíce vygenerovaných úloh; na pomalejším
    // stroji v CI trvá jeden takový test i přes 5 s (výchozí limit).
    testTimeout: 30_000,
  },
});
