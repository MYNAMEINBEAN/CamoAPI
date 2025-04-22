import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing `url` query parameter.");

  if (req.method === 'OPTIONS') {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    return res.status(204).end();
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    const response = await axios.get(decodedUrl, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      responseType: 'arraybuffer',
      headers: { 'User-Agent': req.headers['user-agent'] || '' }
    });

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", contentType);

    const data = Buffer.from(response.data);

    if (contentType.includes('text/html')) {
      let html = data.toString('utf8');
      const base = new URL(decodedUrl);

      html = html.replace(/(src|href|poster)=["']([^"']+)["']/gi, (match, attr, link) => {
        if (link.startsWith('data:') || link.startsWith('javascript:') || link.startsWith('mailto:')) return match;
        try {
          const abs = new URL(link, base).toString();
          return `${attr}="/API/index.js?url=${encodeURIComponent(abs)}"`;
        } catch {
          return match;
        }
      });

      return res.status(200).send(html);
    }

    res.status(200).send(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(`<pre>Proxy Error: ${err.message}</pre>`);
  }
}
