const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;  // Get the 'url' query parameter
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Set up axios to not follow redirects (maxRedirects: 0)
    const axiosConfig = {
      maxRedirects: 0,  // Prevent redirects to base URL
      responseType: 'arraybuffer',  // Handle binary data (like images)
    };

    // Fetch the content from the provided URL
    const response = await axios.get(url, axiosConfig);

    // Set the appropriate content type from the response headers
    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType);

    // If the content is HTML, inject Eruda (JavaScript Debugger) into it
    if (contentType.includes('html')) {
      let htmlContent = response.data.toString();

      // Add the Eruda script just before the closing </body> tag
      htmlContent = htmlContent.replace(
        '</body>',
        `<script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init();</script></body>`
      );

      // Send back the modified HTML
      return res.send(htmlContent);
    }

    // If the content is not HTML (e.g., images, videos, etc.), return the raw content
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error('Error fetching content:', error.message || error);

    // Check if the error was a redirect (e.g., 301 or 302) and handle it
    if (error.response && (error.response.status === 301 || error.response.status === 302)) {
      const redirectUrl = error.response.headers.location;
      if (redirectUrl && !redirectUrl.includes('districtlearning.org')) {
        // Redirect to the new location (if it's not the base URL)
        return res.redirect(redirectUrl);
      }
    }

    // If there are issues with fetching the content or it's not HTML, handle the error
    res.status(500).json({ error: 'Failed to fetch content' });
  }
};
