import app from '../mock-server/app.js';

// Vercel's bracket catch-all (`[...path].js`) only reliably matched a single
// path segment in this project, so instead every /api/v1/* request is rewritten
// (see vercel.json) to this single static function with the real path forwarded
// via a `path` query parameter, which we reconstruct into req.url before handing
// off to the shared Express app.
export default function handler(req, res) {
  const url = new URL(req.url, 'http://internal');
  const forwardedPath = url.searchParams.get('path') ?? '';
  url.searchParams.delete('path');
  const query = url.searchParams.toString();
  req.url = `/api/v1/${forwardedPath}${query ? `?${query}` : ''}`;
  return app(req, res);
}
