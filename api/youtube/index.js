const axios = require('axios');
const { URL } = require('url');

module.exports = async (req, res) => {
  try {
    let { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    url = decodeURIComponent(url.trim());

    // Redirect logic: if user enters districtlearning.org directly
    const normalizedUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (normalizedUrl === 'districtlearning.org') {
      url = 'https://www.youtube.com';
    }

    console.log(`Fetching content from: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.133 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Referer': 'https://www.youtube.com',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      maxRedirects: 10,
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'] || 'text/html';
    res.setHeader('Content-Type', contentType);

    if (!contentType.includes('text/html')) {
      return res.send(Buffer.from(response.data));
    }

    const data = Buffer.from(response.data, 'binary').toString('utf-8');
    const targetUrl = new URL(url).hostname;

    data.replace(/<\/body>/i, `
    <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
    <script>eruda.init();</script></body>
    `);

    // Use `data` and `targetUrl` as needed
    res.send(data);

  } catch (error) {
    console.error('Error fetching content:', error.response ? error.response.status : error.message);
    if (error.response) {
      return res.status(error.response.status).json({ error: `Failed to fetch content. Status: ${error.response.status}` });
    }
    res.status(500).json({ error: 'Failed to fetch content.' });
  }
};
