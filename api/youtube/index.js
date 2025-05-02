const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    const decodedUrl = decodeURIComponent(url.trim());
    console.log("Fetching URL:", decodedUrl);

    // Fetch the URL using Axios with arraybuffer response type
    const response = await axios.get(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'] || 'text/html';
    res.setHeader('Content-Type', contentType);

    // If the content is not HTML, send it directly
    if (!contentType.includes('text/html')) {
      return res.send(response.data);
    }

    // Convert arraybuffer to string if it's HTML
    let html = Buffer.from(response.data).toString('utf-8');

    // Function to convert YouTube URLs to embedded version
    const convertToEmbedUrl = (url) => {
      const videoIdPattern = /(?:https?:\/\/(?:www\.)?youtube\.com\/(?:shorts\/|watch\?v=))([^"&?\/\s]{11})/;
      const match = url.match(videoIdPattern);
      if (match) {
        return `https://www.youtube-nocookie.com/embed/${match[1]}`;
      }
      return url; // Return original URL if it's not a YouTube link
    };

    // Modify the HTML to convert YouTube URLs in href, src, and iframe src
    html = html.replace(/href="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = convertToEmbedUrl(p1);
      return `href="${proxiedUrl}"`;
    });

    html = html.replace(/src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = convertToEmbedUrl(p1);
      return `src="${proxiedUrl}"`;
    });

    // Specifically target iframe src URLs and convert them
    html = html.replace(/<iframe[^>]+src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = convertToEmbedUrl(p1);
      return `<iframe src="${proxiedUrl}"`;
    });

    // Specifically handle the ytd-player container (if the video is embedded in a <ytd-player> tag)
    html = html.replace(/<ytd-player[^>]+src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = convertToEmbedUrl(p1);
      return `<ytd-player src="${proxiedUrl}"`;
    });

    // Insert Eruda debugging tool just before the closing </body> tag
    html = html.replace(/<\/body>/i, `
      <script>
        (function() {
          var script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/eruda';
          script.onload = function() {
            eruda.init();
          };
          document.body.appendChild(script);
        })();
      </script>
    </body>`);

    // Send the modified HTML with Eruda and proxified URLs
    res.send(html);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
