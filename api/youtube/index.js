const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    // Make the HTTP request without Accept-Language and Accept-Encoding headers
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.133 Safari/537.36',
      },
      // Set responseType to 'arraybuffer' to handle binary data
      responseType: 'arraybuffer',
    });

    // If the response is binary, decode it to a string
    const data = Buffer.from(response.data, 'binary').toString('utf-8');

    // Ensure the response is served as text/html
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(data); // Send the decoded HTML content
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
};
