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


    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');


    if (!contentType.includes('text/html')) {
      return res.send(response.data);
    }

    let html = Buffer.from(response.data).toString('utf-8');

    // Function to create proxified URL
    const proxifyUrl = (baseUrl, resourceUrl) => {
      let absoluteUrl;

      // If the URL is absolute (contains 'http'), use it as it is
      if (resourceUrl.startsWith('http://') || resourceUrl.startsWith('https://')) {
        absoluteUrl = resourceUrl;
      } else {
        // If it's a relative URL, combine it with the base URL
        absoluteUrl = new URL(resourceUrl, baseUrl).href;
      }

      // Return the proxified URL format
      return `/api/youtube/index.js?url=${encodeURIComponent(absoluteUrl)}`;
    };

    // Function to inject the proxify script for dynamically loading all resources
    const injectProxifyScript = (html, baseUrl) => {
      const proxifyScript = `
        <script>
          (function() {
            // Function to create proxified URL
            function proxifyUrl(url) {
              const baseUrl = '${baseUrl}';
              let absoluteUrl;

              // If the resource URL is absolute, use it as it is
              if (url.startsWith('http://') || url.startsWith('https://')) {
                absoluteUrl = url;
              } else {
                // If it's a relative URL, combine it with the base URL
                absoluteUrl = new URL(url, baseUrl).href;
              }

              return '/api/youtube/index.js?url=' + encodeURIComponent(absoluteUrl);
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

    // Get the base URL of the page (the domain part)
    const baseUrl = new URL(decodedUrl).origin;

    // Inject the proxify script with the base URL to allow for correct resolution of resources
    html = injectProxifyScript(html, baseUrl);

    // Inject Eruda script for debugging (optional)
    const injectEruda = (html) => {
      const erudaScript = `
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      `;
      return html.replace('</body>', `${erudaScript}</body>`);
    };

    html = injectEruda(html);

    html = html.replace(/%20/g, ' ')
            .replace(/%21/g, '!')
            .replace(/%22/g, '"')
            .replace(/%23/g, '#')
            .replace(/%24/g, '$')
            .replace(/%25/g, '%')
            .replace(/%26/g, '&')
            .replace(/%27/g, "'")
            .replace(/%28/g, '(')
            .replace(/%29/g, ')')
            .replace(/%2A/g, '*')
            .replace(/%2B/g, '+')
            .replace(/%2C/g, ',')
            .replace(/%2D/g, '-')
            .replace(/%2E/g, '.')
            .replace(/%2F/g, '/')
            .replace(/%30/g, '0')
            .replace(/%31/g, '1')
            .replace(/%32/g, '2')
            .replace(/%33/g, '3')
            .replace(/%34/g, '4')
            .replace(/%35/g, '5')
            .replace(/%36/g, '6')
            .replace(/%37/g, '7')
            .replace(/%38/g, '8')
            .replace(/%39/g, '9')
            .replace(/%3A/g, ':')
            .replace(/%3B/g, ';')
            .replace(/%3C/g, '<')
            .replace(/%3D/g, '=')
            .replace(/%3E/g, '>')
            .replace(/%3F/g, '?')
            .replace(/%40/g, '@')
            .replace(/%41/g, 'A')
            .replace(/%42/g, 'B')
            .replace(/%43/g, 'C')
            .replace(/%44/g, 'D')
            .replace(/%45/g, 'E')
            .replace(/%46/g, 'F')
            .replace(/%47/g, 'G')
            .replace(/%48/g, 'H')
            .replace(/%49/g, 'I')
            .replace(/%4A/g, 'J')
            .replace(/%4B/g, 'K')
            .replace(/%4C/g, 'L')
            .replace(/%4D/g, 'M')
            .replace(/%4E/g, 'N')
            .replace(/%4F/g, 'O')
            .replace(/%50/g, 'P')
            .replace(/%51/g, 'Q')
            .replace(/%52/g, 'R')
            .replace(/%53/g, 'S')
            .replace(/%54/g, 'T')
            .replace(/%55/g, 'U')
            .replace(/%56/g, 'V')
            .replace(/%57/g, 'W')
            .replace(/%58/g, 'X')
            .replace(/%59/g, 'Y')
            .replace(/%5A/g, 'Z')
            .replace(/%5B/g, '[')
            .replace(/%5C/g, '\\')
            .replace(/%5D/g, ']')
            .replace(/%5E/g, '^')
            .replace(/%5F/g, '_')
            .replace(/%60/g, '`')
            .replace(/%61/g, 'a')
            .replace(/%62/g, 'b')
            .replace(/%63/g, 'c')
            .replace(/%64/g, 'd')
            .replace(/%65/g, 'e')
            .replace(/%66/g, 'f')
            .replace(/%67/g, 'g')
            .replace(/%68/g, 'h')
            .replace(/%69/g, 'i')
            .replace(/%6A/g, 'j')
            .replace(/%6B/g, 'k')
            .replace(/%6C/g, 'l')
            .replace(/%6D/g, 'm')
            .replace(/%6E/g, 'n')
            .replace(/%6F/g, 'o')
            .replace(/%70/g, 'p')
            .replace(/%71/g, 'q')
            .replace(/%72/g, 'r')
            .replace(/%73/g, 's')
            .replace(/%74/g, 't')
            .replace(/%75/g, 'u')
            .replace(/%76/g, 'v')
            .replace(/%77/g, 'w')
            .replace(/%78/g, 'x')
            .replace(/%79/g, 'y')
            .replace(/%7A/g, 'z')
            .replace(/%7B/g, '{')
            .replace(/%7C/g, '|')
            .replace(/%7D/g, '}')
            .replace(/%7E/g, '~');

    // Send the modified HTML back
    res.send(html);

  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
