const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    console.log(`Fetching content from: ${url}`);

    const response = await axios.get(decodeURIComponent(url), {
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

    // Send raw binary data if not text
    if (!contentType.includes('text/html')) {
      return res.send(Buffer.from(response.data));
    }

    // Convert to UTF-8 and send HTML
    const html = Buffer.from(response.data, 'binary').toString('utf-8');
    res.send(html);

  } catch (error) {
    console.error('Error fetching content:', error.response ? error.response.status : error.message);
    if (error.response) {
      return res.status(error.response.status).json({ error: `Failed to fetch content. Status: ${error.response.status}` });
    }
    res.status(500).json({ error: 'Failed to fetch content.' });
  }
};
