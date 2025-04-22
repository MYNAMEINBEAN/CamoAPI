const axios = require('axios');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const response = await axios.get(url);
    res.setHeader('Content-Type', 'text/html');
    res.send(response.data); // Sends the HTML content
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content', message: error.message });
  }
};
