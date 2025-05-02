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

    let html = Buffer.from(response.data).toString('utf-8');

    // Function to proxify URLs in the HTML
    const proxifyUrl = (url) => `/api/youtube/index.js?url=${encodeURIComponent(url.startsWith('http') ? url : `https://youtube.com${url}`)}`;

    // Proxify all asset URLs (href, src, etc.)
    html = html.replace(/href="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `href="${proxiedUrl}"`;
    });

    html = html.replace(/src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `src="${proxiedUrl}"`;
    });

    html = html.replace(/<script[^>]+src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `<script src="${proxiedUrl}"`;
    });

    html = html.replace(/<link[^>]+href="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `<link href="${proxiedUrl}"`;
    });

    html = html.replace(/<img[^>]+src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = p1.startsWith('http') || p1.startsWith('www') ? proxifyUrl(p1) : proxifyUrl(`https://youtube.com${p1}`);
      return `<img src="${proxiedUrl}"`;
    });

    // Now send the proxified HTML
    res.send(html);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
