const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

app.get('/search', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      responseType: 'arraybuffer',
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', response.headers['content-type']);

    const $ = cheerio.load(response.data);

    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        $(el).attr('src', `/proxy?url=${encodeURIComponent(src)}`);
      }
    });

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http')) {
        $(el).attr('href', `/proxy?url=${encodeURIComponent(href)}`);
      }
    });

    $('video').each((i, el) => {
      const poster = $(el).attr('poster');
      if (poster && !poster.startsWith('http')) {
        $(el).attr('poster', `/proxy?url=${encodeURIComponent(poster)}`);
      }

      const src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        $(el).attr('src', `/proxy?url=${encodeURIComponent(src)}`);
      }
    });

    $('form').each((i, el) => {
      const action = $(el).attr('action');
      if (action && !action.startsWith('http')) {
        $(el).attr('action', `/proxy?url=${encodeURIComponent(action)}`);
      }
    });

    $('body').append(`
      <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
      <script>eruda.init();</script>
    `);

    res.send($.html());

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType);

    res.send(response.data);

  } catch (error) {
    console.error('Error proxying resource:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`CORS proxy server is running at http://localhost:${port}`);
});
