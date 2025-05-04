const axios = require('axios');
const url = require('url'); // To resolve relative URLs properly

module.exports = async (req, res) => {
  try {
    const { url: rawUrl } = req.query;

    if (!rawUrl) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    const decodedUrl = decodeURIComponent(rawUrl.trim());
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

    // Function to inject the proxify script for dynamically loading all resources
    const injectProxifyScript = (html) => {
      const proxifyScript = `
        <script>
          (function() {
            // Function to create proxified URL
            function proxifyUrl(url) {
              return '/API/YouTube/index.js?url=' + encodeURIComponent(url);
            }

            // Function to replace all the resource URLs with proxified URLs
            function proxifyResources() {
              const resources = [
                { tag: 'script', attribute: 'src' },
                { tag: 'link', attribute: 'href' },
                { tag: 'img', attribute: 'src' },
                { tag: 'a', attribute: 'href' },
                { tag: 'iframe', attribute: 'src' },
                { tag: 'form', attribute: 'action' }
              ];

              resources.forEach(({ tag, attribute }) => {
                const elements = document.querySelectorAll(tag);
                elements.forEach(element => {
                  const urlValue = element.getAttribute(attribute);
                  if (urlValue) {
                    const proxifiedUrl = proxifyUrl(urlValue);
                    element.setAttribute(attribute, proxifiedUrl);
                  }
                });
              });
            }

            // Wait for the document to be fully loaded, then proxify resources
            window.addEventListener('load', proxifyResources);
          })();
        </script>
      `;
      return html.replace('</body>', `${proxifyScript}</body>`);
    };

    // Inject the proxify script into the HTML
    html = injectProxifyScript(html);

    // Inject Eruda script for debugging (optional)
    const injectEruda = (html) => {
      const erudaScript = `
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      `;
      return html.replace('</body>', `${erudaScript}</body>`);
    };

    html = injectEruda(html);

    // Send the modified HTML back
    res.send(html);

  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
