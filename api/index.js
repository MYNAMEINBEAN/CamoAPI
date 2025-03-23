import axios from 'axios';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        const targetUrl = decodeURIComponent(url);

        // Use Axios to fetch the content with manual redirect handling
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': targetUrl,
            },
            responseType: 'stream',
            maxRedirects: 0, // Capture redirects instead of following them automatically
            validateStatus: (status) => status < 400, // Allow redirects to be captured
        });

        // If a redirect is detected (301, 302), proxy it through this server
        if (response.status === 301 || response.status === 302) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
                // Ensure the redirect goes through the proxy
                const newProxiedUrl = `${req.protocol}://${req.headers.host}/api/index.js?url=${encodeURIComponent(redirectUrl)}`;
                return res.redirect(307, newProxiedUrl);
            }
        }

        // Set the correct content type
        res.setHeader("Content-Type", response.headers['content-type'] || 'text/html');

        // Stream the response body back to the client
        response.data.pipe(res);
    } catch (error) {
        console.error("Proxy Error:", error.message);
        return res.status(500).json({ error: `Error fetching the requested URL: ${error.message}` });
    }
}
