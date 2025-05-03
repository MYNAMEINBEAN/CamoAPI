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

    // Function to inject iframe replacement using MutationObserver
    const injectIframeReplacementScript = (html, videoId) => {
      const script = `
        <script>
          (function () {
            const videoId = "${videoId}";
            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube.com/embed/' + videoId;
            iframe.style = 'width:100%; height:100%; border:none; position:absolute; top:0; left:0; z-index:1;';
            iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;

            const observer = new MutationObserver((mutations, obs) => {
              const target = document.querySelector('yt-player-error-message-renderer');
              if (target) {
                target.replaceWith(iframe);
                console.log("Replaced yt-player-error-message-renderer with iframe.");
                obs.disconnect();
              }
            });

            observer.observe(document.body, { childList: true, subtree: true });
          })();
        </script>
      `;
      return html.replace('</body>', `${script}</body>`);
    };

    const videoId = new URL(decodedUrl).searchParams.get('v') || decodedUrl.split('/shorts/')[1];

    // Function to proxify links
    const proxifyLinks = (html) => {
      const proxifyUrl = (url) => `/API/YouTube/index.js?url=${encodeURIComponent(url)}`;

      // Replace all `href` and `src` attributes with proxified links
      html = html.replace(/(href|src)="([^"]+)"/g, (match, attribute, link) => {
        const proxifiedLink = proxifyUrl(link);
        return `${attribute}="${proxifiedLink}"`;
      });

      return html;
    };

    // If there is a videoId, inject iframe replacement
    if (videoId) {
      html = injectIframeReplacementScript(html, videoId);
    }

    // Proxify all href and src links
    html = proxifyLinks(html);

    // Inject Eruda for debugging
    html = injectEruda(html);

    res.send(html);

  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
