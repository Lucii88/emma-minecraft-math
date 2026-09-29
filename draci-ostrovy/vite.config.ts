import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/emma-minecraft-math/draci-ostrovy/',
  build: {
    outDir: '../dist/draci-ostrovy',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Knihovny, základní pomůcky a obsah každého ostrova zvlášť: nové úlohy
        // nezneplatní v prohlížeči uložené knihovny ani ostatní ostrovy. Obsah
        // importuje jen czech/rng/types, takže mezi částmi nevznikne kruh.
        manualChunks(id) {
          if (id.includes('/node_modules/')) return 'knihovny';
          if (/\/src\/core\/(czech|rng|types)\.ts$/.test(id)) return 'zaklad';
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
    include: ['tests/**/*.test.ts'],
  },
});
