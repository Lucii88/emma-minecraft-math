import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/emma-minecraft-math/draci-ostrovy/',
  build: {
    outDir: '../dist/draci-ostrovy',
    emptyOutDir: true,
  },
  server: { port: 3100 },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
