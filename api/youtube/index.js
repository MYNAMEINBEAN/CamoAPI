const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    // Set a newer User-Agent to simulate a more current browser
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.133 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    // Ensure the response is served as text/html
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(response.data); // Send the HTML content received from the target URL
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
};
