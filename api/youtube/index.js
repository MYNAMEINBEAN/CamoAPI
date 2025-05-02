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

    // Function to proxy URLs through your proxy
    const proxyUrl = (url) => {
      return `https://www.districtlearning.org/api/youtube/index.js?url=${encodeURIComponent(url)}`;
    };

    // Modify the HTML to convert YouTube URLs in href, src, and iframe src
    html = html.replace(/href="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = proxyUrl(convertToEmbedUrl(p1));
      return `href="${proxiedUrl}"`;
    });

    html = html.replace(/src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = proxyUrl(convertToEmbedUrl(p1));
      return `src="${proxiedUrl}"`;
    });

    // Specifically target iframe src URLs and convert them
    html = html.replace(/<iframe[^>]+src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = proxyUrl(convertToEmbedUrl(p1));
      return `<iframe src="${proxiedUrl}" style="border: none;" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    });

    // Replace YouTube player container with an iframe if blocked or error occurs
    html = html.replace(/<ytd-player[^>]+src="([^"]+)"/g, (match, p1) => {
      const proxiedUrl = proxyUrl(convertToEmbedUrl(p1));
      return `<iframe src="${proxiedUrl}" style="border: none;" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    });

    // Insert a script that will proxy window.location.href and window.open
    html = html.replace(/<\/body>/i, `
      <script>
        // Proxy window.location.href and window.open
        const proxyUrl = (url) => {
          return 'https://www.districtlearning.org/api/youtube/index.js?url=' + encodeURIComponent(url);
        };

        // Override window.location.href to use proxy
        Object.defineProperty(window, 'location', {
          get: function() {
            return {
              href: proxyUrl(window.location.href)
            };
          }
        });

        // Override window.open to use proxy
        const originalOpen = window.open;
        window.open = function(url, ...args) {
          return originalOpen.call(window, proxyUrl(url), ...args);
        };

        // Also handle any links in the page to ensure they are proxied
        document.querySelectorAll('a').forEach(link => {
          const originalHref = link.href;
          link.href = proxyUrl(originalHref);
        });
      </script>
    </body>`);

    // Send the modified HTML with the proxied URLs
    res.send(html);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
