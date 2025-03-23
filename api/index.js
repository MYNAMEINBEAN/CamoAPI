import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        url = decodeURIComponent(url);

        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': url,
            },
            httpsAgent: agent,
            responseType: 'arraybuffer', // Capture response as raw buffer (needed for rewriting)
            maxRedirects: 0, // Don't follow redirects
            validateStatus: (status) => status < 400 || status === 301 || status === 302,
        });

        // Handle YouTube redirects by rewriting the URL
        if (response.status === 301 || response.status === 302) {
            let redirectUrl = response.headers.location;

            if (redirectUrl.startsWith('/')) {
                redirectUrl = new URL(redirectUrl, url).href;
            }

            return res.redirect(`/api/index.js?url=${encodeURIComponent(redirectUrl)}`);
        }

        // Rewrite URLs in the response body to stay within the proxy
        let body = response.data.toString('utf-8');

        // Replace all absolute YouTube links with proxied links
        body = body.replace(/https:\/\/www\.youtube\.com\//g, 'https://camo-api-zu2i.vercel.app/api/index.js?url=https://www.youtube.com/');
        body = body.replace(/https:\/\/youtube\.com\//g, 'https://camo-api-zu2i.vercel.app/api/index.js?url=https://youtube.com/');

        // Fix relative paths (e.g., "/watch?v=xyz" → proxied link)
        body = body.replace(/href="\/(watch\?v=[^"]+)"/g, 'href="/api/index.js?url=https://www.youtube.com/$1"');

        // Set proper content type
        res.setHeader("Content-Type", response.headers["content-type"] || "text/html");

        res.send(body);
    } catch (error) {
        console.error(`Error fetching the URL: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
