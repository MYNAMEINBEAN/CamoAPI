const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all domains
app.use(cors());

// Handle OPTIONS requests for preflight CORS requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// Proxy request handler for YouTube embeds at /API/youtube/embed/index.js
app.get('/API/youtube/embed/index.js', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    // Fetch the requested YouTube embed URL content
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      responseType: 'arraybuffer',
    });

    // Set CORS headers and pass on the response data
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', response.headers['content-type']);

    // Parse the HTML response using Cheerio
    const $ = cheerio.load(response.data);

    // Modify all relevant attributes (e.g., src, href, poster)
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        $(el).attr('src', `/API/proxy?url=${encodeURIComponent(src)}`);
      }
    });

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http')) {
        $(el).attr('href', `/API/proxy?url=${encodeURIComponent(href)}`);
      }
    });

    $('video').each((i, el) => {
      const poster = $(el).attr('poster');
      if (poster && !poster.startsWith('http')) {
        $(el).attr('poster', `/API/proxy?url=${encodeURIComponent(poster)}`);
      }

      const src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        $(el).attr('src', `/API/proxy?url=${encodeURIComponent(src)}`);
      }
    });

    // Modify all <form> elements' action attributes
    $('form').each((i, el) => {
      const action = $(el).attr('action');
      if (action && !action.startsWith('http')) {
        $(el).attr('action', `/API/proxy?url=${encodeURIComponent(action)}`);
      }
    });

    // Check if the request is from a mobile device (based on the User-Agent)
    const isMobile = /mobile/i.test(req.get('User-Agent'));

    // If it's a mobile device, inject the Eruda script
    if (isMobile) {
      $('body').append(`
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      `);
    }

    // Send the modified HTML back
    res.send($.html());

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Proxy handler for other resources (images, videos, etc.) at /API/proxy
app.get('/API/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    // Fetch the resource (image, video, etc.)
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      responseType: 'arraybuffer',
    });

    // Set appropriate content type for the resource
    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType);

    // Send the resource data back to the client
    res.send(response.data);

  } catch (error) {
    console.error('Error proxying resource:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`CORS proxy server is running at http://localhost:${port}`);
});
