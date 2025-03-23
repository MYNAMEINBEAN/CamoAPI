import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        url = decodeURIComponent(url);

        const agent = new https.Agent({ rejectUnauthorized: false }); // Ignore SSL certificate errors

        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': url,
            },
            httpsAgent: agent, // Bypass SSL issues
            responseType: 'stream',
            maxRedirects: 0, // Don't follow redirects
            validateStatus: (status) => status < 400 || status === 301 || status === 302, // Allow 301/302 responses
        });

        // If YouTube tries to redirect, rewrite the URL to stay in the proxy
        if (response.status === 301 || response.status === 302) {
            let redirectUrl = response.headers.location;

            if (redirectUrl.startsWith('/')) {
                redirectUrl = new URL(redirectUrl, url).href;
            }

            return res.writeHead(302, { Location: `/api/index.js?url=${encodeURIComponent(redirectUrl)}` }).end();
        }

        // Set correct content type
        const contentType = response.headers['content-type'];
        if (contentType) res.setHeader("Content-Type", contentType);

        // Stream the proxied response to the client
        response.data.pipe(res);
    } catch (error) {
        console.error(`Error fetching the URL: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
