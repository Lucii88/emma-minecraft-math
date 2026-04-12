import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'save-api',
      configureServer(server) {
        server.middlewares.use('/api/save', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
            req.on('end', () => {
              const savePath = path.resolve(__dirname, 'public/data/save.json');
              fs.mkdirSync(path.dirname(savePath), { recursive: true });
              fs.writeFileSync(savePath, body, 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true }));
            });
          } else if (req.method === 'GET') {
            const savePath = path.resolve(__dirname, 'public/data/save.json');
            if (fs.existsSync(savePath)) {
              const data = fs.readFileSync(savePath, 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(data);
            } else {
              res.writeHead(404);
              res.end('{}');
            }
          }
        });
      },
    },
  ],
  server: { port: 3000 },
});
