import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        // Decode the URL only once to get the normal format
        url = decodeURIComponent(url);
        
        // Ensure no encoded URL in the proxy, remove any encoding
        url = url.replace(/%3A/g, ':').replace(/%2F/g, '/'); // Decode ':', '/' if needed
        console.log(`Decoded and clean URL: ${url}`);

        // Force YouTube links into a clean format (no encoded characters)
        url = url.replace(/https:\/\/www\.youtube\.com/g, 'https://www.youtube.com');

        const agent = new https.Agent({ rejectUnauthorized: false });

        // Make the request
        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': url,
            },
            httpsAgent: agent,
            responseType: 'arraybuffer', // Important for binary content (JS, images, videos)
            maxRedirects: 0, // STOP FOLLOWING REDIRECTS
            validateStatus: (status) => status < 400 || status === 301 || status === 302,
        });

        // Handle Redirects (Prevent External Redirections)
        if (response.status === 301 || response.status === 302) {
            let redirectUrl = response.headers.location;
            
            if (redirectUrl.startsWith('/')) {
                redirectUrl = new URL(redirectUrl, url).href;
            }

            // Clean up redirect URL
            redirectUrl = decodeURIComponent(redirectUrl);

            // Rewrite Redirects to Stay Within the Proxy
            return res.redirect(`/api/index.js?url=${encodeURIComponent(redirectUrl)}`);
        }

        // Process and modify the response body for YouTube (or other pages)
        let body = response.data.toString('utf-8');

        // Replace all YouTube URLs with proxied versions
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
