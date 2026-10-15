import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API endpoint for fetching webpage metadata (CORS proxy & scraper)
  app.get('/api/metadata', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const domain = targetUrl.hostname;
    const defaultFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(targetUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const html = await response.text();

      // Extract title: og:title -> <title> -> twitter:title -> fallback domain
      let title = '';
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/i) ||
                           html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:title["']/i);
      const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["'](.*?)["']/i) ||
                                html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']twitter:title["']/i);

      if (ogTitleMatch && ogTitleMatch[1]) {
        title = ogTitleMatch[1];
      } else if (titleTagMatch && titleTagMatch[1]) {
        title = titleTagMatch[1];
      } else if (twitterTitleMatch && twitterTitleMatch[1]) {
        title = twitterTitleMatch[1];
      } else {
        title = domain.replace(/^www\./, '');
      }

      title = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      // Extract description
      let description = '';
      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/i) ||
                          html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:description["']/i);
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i) ||
                        html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["']/i);
      const twitterDescMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["'](.*?)["']/i) ||
                               html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']twitter:description["']/i);

      if (ogDescMatch && ogDescMatch[1]) {
        description = ogDescMatch[1];
      } else if (descMatch && descMatch[1]) {
        description = descMatch[1];
      } else if (twitterDescMatch && twitterDescMatch[1]) {
        description = twitterDescMatch[1];
      }

      description = description
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      // Extract image: og:image -> twitter:image
      let imageUrl = '';
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/i) ||
                           html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:image["']/i);
      const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["'](.*?)["']/i) ||
                                html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']twitter:image["']/i);

      if (ogImageMatch && ogImageMatch[1]) {
        imageUrl = ogImageMatch[1];
      } else if (twitterImageMatch && twitterImageMatch[1]) {
        imageUrl = twitterImageMatch[1];
      }

      if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        try {
          imageUrl = new URL(imageUrl, targetUrl.origin).toString();
        } catch {
          imageUrl = '';
        }
      }

      // Extract favicon
      let favicon = defaultFavicon;
      const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["'](.*?)["']/i) ||
                           html.match(/<link[^>]*href=["'](.*?)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
      if (faviconMatch && faviconMatch[1]) {
        const rawFav = faviconMatch[1];
        if (rawFav.startsWith('http://') || rawFav.startsWith('https://')) {
          favicon = rawFav;
        } else {
          try {
            favicon = new URL(rawFav, targetUrl.origin).toString();
          } catch {
            favicon = defaultFavicon;
          }
        }
      }

      return res.json({
        success: true,
        url: targetUrl.toString(),
        title: title || domain,
        description: description || '',
        imageUrl: imageUrl || '',
        favicon: favicon || defaultFavicon,
        domain
      });
    } catch {
      // Graceful fallback with domain and Google Favicon API
      return res.json({
        success: true,
        fallback: true,
        url: targetUrl.toString(),
        title: domain.replace(/^www\./, ''),
        description: '',
        imageUrl: '',
        favicon: defaultFavicon,
        domain
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
