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
