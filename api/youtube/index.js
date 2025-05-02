const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing URL parameter' });

    const decodedUrl = decodeURIComponent(url.trim());
    console.log("Fetching URL:", decodedUrl);

    const response = await axios.get(decodedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
      responseType: 'arraybuffer'
    });

    const contentType = response.headers['content-type'] || 'text/html';
    res.setHeader('Content-Type', contentType);

    if (!contentType.includes('text/html')) return res.send(response.data);

    let html = Buffer.from(response.data).toString('utf-8');

    // Helper to proxify URLs
    const proxifyUrl = (url) => `/api/youtube/index.js?url=${encodeURIComponent(url.startsWith('http') ? url : `https://youtube.com${url}`)}`;

    // Replace all relevant URLs with proxified ones
    html = html.replace(/(href|src|<script[^>]+src|<link[^>]+href)="([^"]+)"/g, (match, p1, p2) => {
      const proxiedUrl = proxifyUrl(p2);
      return `${p1}="${proxiedUrl}"`;
    });

    // Insert Eruda Debugger and proxyify links in the body
    html = html.replace(/<\/body>/i, `
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/eruda';
          script.onload = () => eruda.init();
          document.body.appendChild(script);

          document.querySelectorAll('a[href^="/watch"]').forEach(link => {
            const proxiedUrl = '/api/youtube/index.js?url=' + encodeURIComponent('https://youtube.com' + link.getAttribute('href'));
            link.href = proxiedUrl;
            link.onclick = (e) => {
              e.preventDefault();
              window.location.href = proxiedUrl;
            };
          });

          const iframe = document.querySelector('iframe');
          if (iframe) {
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.allowFullscreen = true;
            iframe.frameBorder = "0";
          }
        });
      </script>
      </body>
    `);

    res.send(html);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
