import axios from 'axios';
import { URL } from 'url';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        const targetUrl = decodeURIComponent(url); // Decode the URL if necessary

        // Fetch the content, handling redirects automatically
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': targetUrl,
            },
            responseType: 'stream',
            maxRedirects: 20, // Allow automatic redirects up to 20 times
            validateStatus: (status) => status < 500, // Accept all valid responses
        });

        // Ensure correct content-type is sent back to the client
        const contentType = response.headers['content-type'];
        if (contentType) res.setHeader("Content-Type", contentType);

        // Handle relative redirects properly
        const finalUrl = response.request.res.responseUrl || targetUrl;
        const parsedFinalUrl = new URL(finalUrl);

        if (parsedFinalUrl.hostname === req.headers.host) {
            // Prevent proxying itself if the final URL mistakenly points to the proxy
            return res.status(500).json({ error: "Proxy detected an infinite loop." });
        }

        // Stream the response data back to the client
        response.data.pipe(res);
    } catch (error) {
        console.error(`Error fetching the URL: ${error.message}`);
        return res.status(500).json({ error: `Error fetching the requested URL: ${error.message}` });
    }
}
