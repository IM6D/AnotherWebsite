// api/_lib/cors.ts

const ALLOWED_ORIGINS = new Set([
  'tauri://localhost',     // Tauri desktop webview
  'http://localhost:1420', // tauri dev
  'http://localhost:5173', // Vite dev
  'http://127.0.0.1:5173',
]);

// Add your production site origin via env so you don't hardcode it.
if (process.env.PUBLIC_SITE_ORIGIN) {
  ALLOWED_ORIGINS.add(process.env.PUBLIC_SITE_ORIGIN);
}

export function withCors(
  handler: (req: any, res: any) => Promise<any> | any
) {
  return async (req: any, res: any) => {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    // If you *really* want wide-open CORS, you could:
    // res.setHeader('Access-Control-Allow-Origin', '*');

    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    return handler(req, res);
  };
}
