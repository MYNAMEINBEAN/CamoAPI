const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    const decodedUrl = decodeURIComponent(url.trim());
    console.log("Fetching URL:", decodedUrl);

    const response = await axios.get(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'] || 'text/html';
    res.setHeader('Content-Type', contentType);

    if (!contentType.includes('text/html')) {
      return res.send(response.data);
    }

    let html = Buffer.from(response.data).toString('utf-8');

    // Function to inject Eruda
    const injectEruda = (html) => {
      const erudaScript = `
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      `;
      return html.replace('</body>', `${erudaScript}</body>`);
    };

    // Function to rewrite all URLs (href, src, etc.)
    const rewriteUrls = (html) => {
      return html.replace(/(href|src|data-src|action)="([^"]+)"/g, (match, attr, url) => {
        // Check if the URL starts with 'http' or 'https' (indicating external URLs)
        if (url.startsWith('http://') || url.startsWith('https://')) {
          // Rewrite the URL to use the proxy
          const newUrl = `/API/YouTube/index.js?URL=${encodeURIComponent(url)}`;
          return `${attr}="${newUrl}"`;
        }
        // For internal URLs (relative URLs), we can also rewrite them, if needed
        return match;
      });
    };

    // Inject Eruda and rewrite all URLs in the HTML
    html = injectEruda(html);
    html = rewriteUrls(html);

    res.send(html);

  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
