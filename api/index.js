import axios from 'axios';
import { parse } from 'url';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        const targetUrl = decodeURIComponent(url); // Ensure proper URL decoding

        // Fetch the target URL while handling redirects ourselves
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': targetUrl,
            },
            responseType: 'stream',
            maxRedirects: 0, // Disable automatic redirects, so we can handle them manually
            validateStatus: (status) => status < 400 || status === 301 || status === 302, // Allow redirects to be handled manually
        });

        // Handle manual redirects from YouTube
        if (response.status === 301 || response.status === 302) {
            const redirectUrl = response.headers.location;

            if (redirectUrl) {
                // Rewrite the redirect URL to be proxied through our server
                const parsedUrl = parse(redirectUrl, true);
                const newProxiedUrl = `${req.protocol}://${req.headers.host}${req.url.split('?')[0]}?url=${encodeURIComponent(redirectUrl)}`;

                return res.redirect(307, newProxiedUrl);
            }
        }

        // Set the correct content type
        const contentType = response.headers['content-type'];
        if (contentType) res.setHeader("Content-Type", contentType);

        // Stream the proxied response
        response.data.pipe(res);
    } catch (error) {
        console.error(`Error fetching the URL: ${error.message}`);
        return res.status(500).json({ error: `Error fetching the requested URL: ${error.message}` });
    }
}
