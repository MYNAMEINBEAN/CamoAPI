const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;  // Get the 'url' query parameter
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Fetch the content from the provided URL (could be HTML, image, etc.)
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    // Set the appropriate content type from the response headers
    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType);

    // Send back the content (image, HTML, etc.)
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
};
