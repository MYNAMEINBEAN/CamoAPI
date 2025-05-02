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

    // Function to convert a URL into its proxified version
    const proxifyUrl = (url) => {
      return `https://www.districtlearning.org/api/youtube/index.js?url=${encodeURIComponent(url)}`;
    };

    // Function to replace URLs in HTML content
    const replaceAllLinksWithProxy = (html) => {
      // Replace <a href="...">
      html = html.replace(/href="([^"]+)"/g, (match, p1) => {
        return `href="${proxifyUrl(p1)}"`;
      });

      // Replace <script src="...">
      html = html.replace(/<script[^>]+src="([^"]+)"/g, (match, p1) => {
        return `<script src="${proxifyUrl(p1)}"`;
      });

      // Replace <link href="...">
      html = html.replace(/<link[^>]+href="([^"]+)"/g, (match, p1) => {
        return `<link href="${proxifyUrl(p1)}"`;
      });

      // Replace <iframe src="...">
      html = html.replace(/<iframe[^>]+src="([^"]+)"/g, (match, p1) => {
        return `<iframe src="${proxifyUrl(p1)}"`;
      });

      // Replace background URLs in inline styles (e.g., style="background:url('...')")
      html = html.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, p1) => {
        return `url('${proxifyUrl(p1)}')`;
      });

      // Replace URLs in data-* attributes (e.g., data-src, data-url, etc.)
      html = html.replace(/data-([^=]+)="([^"]+)"/g, (match, p1, p2) => {
        return `data-${p1}="${proxifyUrl(p2)}"`;
      });

      return html;
    };

    // Replace all links in the HTML with proxified URLs
    html = replaceAllLinksWithProxy(html);

    // Function to replace yt-player-error-message-renderer with iframe
    const replaceErrorMessageWithIframe = (iframeSrc) => {
      const errorMessageRenderer = html.match(/<yt-player-error-message-renderer[^>]*>[\s\S]*?<\/yt-player-error-message-renderer>/);

      if (errorMessageRenderer) {
        // Create the iframe element HTML code
        const iframe = `
          <iframe src="${iframeSrc}" style="width: 100%; height: 100%; border: none; position: absolute; top: 0; left: 0; z-index: 1;" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        `;

        // Replace the error message container with the iframe
        html = html.replace(errorMessageRenderer[0], iframe);
      } else {
        console.error('yt-player-error-message-renderer not found');
      }
    };

    // Extract the video ID from the current URL in the browser
    const videoId = new URL(decodedUrl).searchParams.get('v') || decodedUrl.split('/shorts/')[1];

    if (videoId) {
      const iframeSrc = `https://www.youtube.com/embed/${videoId}`;
      replaceErrorMessageWithIframe(iframeSrc);
    }

    // Send the modified HTML back to the client
    res.send(html);

  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
