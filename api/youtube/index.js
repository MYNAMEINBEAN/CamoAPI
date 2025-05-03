const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    const decodedUrl = decodeURIComponent(url.trim());
    console.log("Fetching URL:", decodedUrl);

    // Fetch the URL using Axios with arraybuffer response type
    const response = await axios.get(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'] || 'text/html';
    res.setHeader('Content-Type', contentType);

    // If the content is not HTML, send it directly
    if (!contentType.includes('text/html')) {
      return res.send(response.data);
    }

    // Convert arraybuffer to string if it's HTML
    let html = Buffer.from(response.data).toString('utf-8');

    // Function to inject Eruda
    const injectEruda = (html) => {
      const erudaScript = `
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      `;
      return html.replace('</body>', `${erudaScript}</body>`);
    };

    // Function to replace yt-player-error-message-renderer with iframe
    const replaceErrorMessageWithIframe = (iframeSrc) => {
      const errorMessageRenderer = html.match(/<yt-player-error-message-renderer[^>]*>[\s\S]*?<\/yt-player-error-message-renderer>/);

      if (errorMessageRenderer) {
        const iframe = `
          <iframe src="${iframeSrc}" style="width: 100%; height: 100%; border: none; position: absolute; top: 0; left: 0; z-index: 1;" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        `;
        html = html.replace(errorMessageRenderer[0], iframe);
      } else {
        console.error('yt-player-error-message-renderer not found');
      }
    };

    // Extract the video ID from the URL
    const videoId = new URL(decodedUrl).searchParams.get('v') || decodedUrl.split('/shorts/')[1];

    if (videoId) {
      const iframeSrc = `https://www.youtube.com/embed/${videoId}`;
      replaceErrorMessageWithIframe(iframeSrc);
    }

    // Inject Eruda for debugging
    html = injectEruda(html);

    // Send the modified HTML
    res.send(html);

  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
