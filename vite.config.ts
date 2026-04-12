import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/emma-minecraft-math/',
  server: { port: 3000 },
});
