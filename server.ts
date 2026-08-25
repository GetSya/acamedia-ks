import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import appLogic from './server/app.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Mount API routes from appLogic
  app.use(appLogic);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom', // pakai 'custom' agar Vite tidak auto-serve index.html
    });
    app.use((req, res, next) => {
      // Jangan teruskan request /api/* ke Vite
      if (req.path.startsWith('/api/')) return next();
      vite.middlewares(req, res, next);
    });
    // Fallback: semua non-API request serve index.html via Vite
    app.get(/^(?!\/api\/).*$/, async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = await vite.transformIndexHtml(url,
          fs.readFileSync('./index.html', 'utf-8')
        );
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
