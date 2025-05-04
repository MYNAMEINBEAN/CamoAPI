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

    // Helper function to update the URLs in <script> and <link> tags
    const proxifyLinksAndScripts = (html) => {
      // Modify <script> tags
      html = html.replace(/<script\s+[^>]*src=["'](.*?)["'][^>]*>/g, (match, src) => {
        const proxifiedSrc = `/API/YouTube/youtube/index.js?url=${encodeURIComponent(src)}`;
        return match.replace(src, proxifiedSrc);
      });

      // Modify <link> tags
      html = html.replace(/<link\s+[^>]*href=["'](.*?)["'][^>]*>/g, (match, href) => {
        const proxifiedHref = `/API/YouTube/youtube/index.js?url=${encodeURIComponent(href)}`;
        return match.replace(href, proxifiedHref);
      });

      return html;
    };

    // Inject Eruda script for debugging
    const injectEruda = (html) => {
      const erudaScript = `
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      `;
      return html.replace('</body>', `${erudaScript}</body>`);
    };

    // Apply all transformations to the HTML
    html = proxifyLinksAndScripts(html);

    // Inject Eruda for debugging
    html = injectEruda(html);

    res.send(html);

  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
