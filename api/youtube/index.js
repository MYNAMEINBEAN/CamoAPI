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

    // Replace all href, src, and other relevant attributes with the proxified version
    html = html.replace(/href="([^"]+)"/g, (match, p1) => {
      // Handle absolute URLs (e.g., /watch?v=abc123 or https://youtube.com/... or relative paths)
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `href="${proxiedUrl}"`;
    });

    html = html.replace(/src="([^"]+)"/g, (match, p1) => {
      // Handle absolute URLs (e.g., images, scripts, videos, etc.)
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `src="${proxiedUrl}"`;
    });

    // Ensure any links to scripts and stylesheets are proxified as well
    html = html.replace(/<script[^>]+src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `<script src="${proxiedUrl}"`;
    });

    html = html.replace(/<link[^>]+href="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `<link href="${proxiedUrl}"`;
    });

    // Insert the debugging tool and make videos fullscreen
    html = html.replace(/<\/body>/i, `
      <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
      <script>eruda.init();</script>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          // 1. Remove original search form
          const oldForm = document.querySelector('.ytSearchboxComponentSearchForm');
          if (oldForm) oldForm.remove();

          // 2. Inject custom search bar
          const inputBox = document.querySelector('.ytSearchboxComponentInputBox');
          if (inputBox) {
            inputBox.innerHTML = \`
              <input id="ytProxySearchInput" type="text" placeholder="Search YouTube..." 
                style="padding: 6px; font-size: 14px; width: 300px;" />
              <button id="ytProxySearchBtn" style="padding: 6px 10px; font-size: 14px;">Search</button>
            \`;

            function runProxySearch() {
              const query = document.getElementById('ytProxySearchInput').value.trim();
              if (!query) return;
              const proxyUrl = '/api/youtube/index.js?url=' + encodeURIComponent('https://youtube.com/results?search_query=' + query);
              window.location.href = proxyUrl;
            }

            document.getElementById('ytProxySearchBtn').addEventListener('click', runProxySearch);
            document.getElementById('ytProxySearchInput').addEventListener('keydown', (e) => {
              if (e.key === 'Enter') runProxySearch();
            });
          }

          // 3. Proxyify all video links and intercept clicks
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

          // 4. Handle dynamically loaded content
          const observer = new MutationObserver(proxyifyLinks);
          observer.observe(document.body, { childList: true, subtree: true });
          
          // 5. Make embedded videos fullscreen
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
