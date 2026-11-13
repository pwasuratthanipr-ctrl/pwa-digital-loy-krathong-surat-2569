import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

function devSheetsProxyPlugin() {
  return {
    name: 'dev-sheets-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/sheets', async (req: any, res: any) => {
        const customUrl = req.headers['x-api-url'];
        const targetUrl = (
          process.env.VITE_GOOGLE_SCRIPT_API_URL ||
          process.env.GOOGLE_SCRIPT_API_URL ||
          customUrl ||
          ''
        ).trim();

        if (!targetUrl) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'ยังไม่ได้ระบุ Google Apps Script Web App URL ในระบบ' }));
          return;
        }

        try {
          const incoming = new URL(req.url, 'http://localhost');
          if (req.method === 'GET') {
            const forward = new URL(targetUrl);
            incoming.searchParams.forEach((val, key) => forward.searchParams.set(key, val));
            const authTokenHeader = req.headers['x-auth-token'];
            if (typeof authTokenHeader === 'string' && authTokenHeader && !forward.searchParams.has('authToken')) {
              forward.searchParams.set('authToken', authTokenHeader);
            }
            const response = await fetch(forward.toString(), { redirect: 'follow' });
            const data = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json;charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
            res.end(data);
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', async () => {
              const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body,
                redirect: 'follow',
              });
              const data = await response.text();
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json;charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
              res.end(data);
            });
            return;
          }
        } catch (e: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devSheetsProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', './src'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
