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
      responseType: 'arraybuffer'
    });

    const contentType = response.headers['content-type'] || 'text/html';
    res.setHeader('Content-Type', contentType);

    if (!contentType.includes('text/html')) {
      return res.send(response.data);
    }

    let html = Buffer.from(response.data).toString('utf-8');

    // Helper function to proxify URLs
    const proxifyUrl = (url) => {
      return `/api/youtube/index.js?url=${encodeURIComponent(url)}`;
    };

    // Ensure links to YouTube videos, scripts, and resources are proxified
    html = html.replace(/href="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `href="${proxiedUrl}"`;
    });

    html = html.replace(/src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `src="${proxiedUrl}"`;
    });

    // Ensure any script or stylesheet links are also proxified
    html = html.replace(/<script[^>]+src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `<script src="${proxiedUrl}"`;
    });

    html = html.replace(/<link[^>]+href="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `<link href="${proxiedUrl}"`;
    });

    // Insert everything in a <script> at the end of the body tag
    html = html.replace(/<\/body>/i, `
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          // Insert Eruda Debugging tool
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/eruda';
          script.onload = () => {
            eruda.init();
          };
          document.body.appendChild(script);

          // Proxyify all video links and intercept clicks
          function proxyifyLinks() {
            document.querySelectorAll('a[href^="/watch"]').forEach(link => {
              const originalHref = link.getAttribute('href');
              const fullYouTubeUrl = 'https://youtube.com' + originalHref;
              const proxiedUrl = '/api/youtube/index.js?url=' + encodeURIComponent(fullYouTubeUrl);
              link.setAttribute('href', proxiedUrl);
              link.onclick = null;
              link.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = proxiedUrl;
              });
            });
          }
          proxyifyLinks();

          // Make embedded videos fullscreen
          const iframe = document.querySelector('iframe');
          if (iframe) {
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('frameborder', '0');
          }
        });
      </script>
      </body>
    `);

    res.send(html);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
