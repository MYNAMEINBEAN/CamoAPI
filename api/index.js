// pages/api/proxy.js

import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    // Check if the URL is a YouTube /watch URL
    if (url.includes('youtube.com/watch')) {
        try {
            // Fetch the YouTube watch page content
            const response = await fetch(url, {
                headers: {
                    'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                    'Referer': url,
                }
            });

            // If the request is successful, set the response content type
            const contentType = response.headers.get("content-type");
            if (contentType) res.setHeader("Content-Type", contentType);

            // Pipe the body of the response to the client
            response.body.pipe(res);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch the requested URL." });
        }
    } else {
        // Handle other URLs (Proxy fetch for non-YouTube URLs)
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                    'Referer': url,
                }
            });

            const contentType = response.headers.get("content-type");
            if (contentType) res.setHeader("Content-Type", contentType);

            response.body.pipe(res); // Stream the response back to the client
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch the requested URL." });
        }
    }
}
