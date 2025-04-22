const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    // Ensure URL is provided
    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    console.log(`Fetching content from: ${url}`);

    // Make the HTTP request to the URL with headers adjusted
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.133 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Referer': 'https://www.youtube.com',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      maxRedirects: 0, // Prevent automatic redirection
      responseType: 'arraybuffer', // Handle the response as binary
    });

    console.log(`Response status: ${response.status}`);

    // Convert the binary data to UTF-8 string
    const data = Buffer.from(response.data, 'binary').toString('utf-8');

    // Set content type as HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(data); // Send the decoded HTML content

  } catch (error) {
    // Log the error to identify what went wrong
    console.error('Error fetching content:', error.response ? error.response.status : error.message);
    
    // If there's an error in the response, we can provide more info
    if (error.response) {
      return res.status(error.response.status).json({ error: `Failed to fetch content. Status: ${error.response.status}` });
    }

    res.status(500).json({ error: 'Failed to fetch content.' });
  }
};
