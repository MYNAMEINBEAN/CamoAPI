const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      },
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(response.data); // Send the HTML response as-is
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
};
