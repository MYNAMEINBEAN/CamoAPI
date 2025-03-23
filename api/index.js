import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        // Decode the URL only once
        url = decodeURIComponent(url);

        // Force YouTube links into a clean format
        url = url.replace(/https%3A%2F%2Fwww\.youtube\.com/g, 'https://www.youtube.com');
        
        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': url,
            },
            httpsAgent: agent,
            responseType: 'arraybuffer',
            maxRedirects: 0, // STOP FOLLOWING REDIRECTS
            validateStatus: (status) => status < 400 || status === 301 || status === 302,
        });

        // Handle Redirects (Prevent External Redirections)
        if (response.status === 301 || response.status === 302) {
            let redirectUrl = response.headers.location;

            if (redirectUrl.startsWith('/')) {
                redirectUrl = new URL(redirectUrl, url).href;
            }

            // Ensure no encoding happens with the redirect URL
            redirectUrl = decodeURIComponent(redirectUrl);

            // Rewrite Redirects to Stay Within the Proxy
            return res.redirect(`/api/index.js?url=${redirectUrl}`);
        }

        // Modify the Response to Keep YouTube Inside the Proxy
        let body = response.data.toString('utf-8');

        // Replace all absolute YouTube links with proxied versions
        body = body.replace(/https:\/\/www\.youtube\.com\//g, 'https://your-proxy.com/api/index.js?url=https://www.youtube.com/');
        body = body.replace(/https:\/\/youtube\.com\//g, 'https://your-proxy.com/api/index.js?url=https://youtube.com/');

        // Fix relative paths ("/watch?v=xyz" → Keep it inside the proxy)
        body = body.replace(/href="\/(watch\?v=[^"]+)"/g, 'href="/api/index.js?url=https://www.youtube.com/$1"');

        res.setHeader("Content-Type", response.headers["content-type"] || "text/html");
        res.send(body);
    } catch (error) {
        console.error(`Error fetching the URL: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
