const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    const decodedUrl = decodeURIComponent(url.trim());
    console.log("Fetching URL:", decodedUrl);

    const response = await axios.get(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'] || 'text/html';
    res.setHeader('Content-Type', contentType);

    if (!contentType.includes('text/html')) {
      return res.send(response.data);
    }

    let html = Buffer.from(response.data).toString('utf-8');

    // Helper function to update URLs in various tags
    const proxifyAllTags = (html) => {
      // Regex to match and proxify the src or href attributes for various tags
      const regexPatterns = [
        { tag: 'script', attribute: 'src' },
        { tag: 'link', attribute: 'href' },
        { tag: 'img', attribute: 'src' },
        { tag: 'a', attribute: 'href' },
        { tag: 'iframe', attribute: 'src' },
        { tag: 'form', attribute: 'action' }
      ];

      regexPatterns.forEach(({ tag, attribute }) => {
        const regex = new RegExp(`<${tag}\\s+[^>]*${attribute}=["'](.*?)["'][^>]*>`, 'g');
        html = html.replace(regex, (match, urlValue) => {
          const proxifiedUrl = `/API/YouTube/youtube/index.js?url=${encodeURIComponent(urlValue)}`;
          return match.replace(urlValue, proxifiedUrl);
        });
      });

      return html;
    };

    // Inject a custom script tag at the bottom of the body
    const injectCustomScript = (html) => {
      const customScript = `
        <script>
          // Your custom JavaScript code here
          console.log("Custom script loaded at the bottom!");
        </script>
      `;
      return html.replace('</body>', `${customScript}</body>`);
    };

    // Apply the proxification to all relevant tags
    html = proxifyAllTags(html);

    // Inject the custom script tag at the bottom of the body
    html = injectCustomScript(html);

    res.send(html);

  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
