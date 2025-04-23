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
      responseType: 'arraybuffer'
    });

    const contentType = response.headers['content-type'] || 'text/html';
    res.setHeader('Content-Type', contentType);

    if (!contentType.includes('text/html')) {
      return res.send(response.data);
    }

    let html = Buffer.from(response.data).toString('utf-8');

    html = html.replace(/<\/body>/i, `
      <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
      <script>eruda.init();</script>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const form = document.querySelector('.ytSearchboxComponentSearchForm');
          if (form) {
            form.action = '/API/index.js?url=https://youtube.com/results';  // Replace action to the proxy URL
            form.addEventListener('submit', function(event) {
              event.preventDefault();
              const query = this.querySelector('input[name="search_query"]').value;
              const proxyUrl = '/API/index.js?url=' + encodeURIComponent('https://youtube.com/results?search_query=' + query);
              fetch(proxyUrl)
                .then(response => response.text())
                .then(data => {
                  document.body.innerHTML = data;
                })
                .catch(error => {
                  console.error('Error fetching the proxied content:', error);
                  alert('An error occurred while fetching the content.');
                });
            });
          }
        });
      </script>
      </body>
    `);

    res.send(html);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
