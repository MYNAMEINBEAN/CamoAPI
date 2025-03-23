// pages/api/proxy.js

import axios from 'axios';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    // If the URL is a YouTube /watch URL, redirect to it
    if (url.includes('youtube.com/watch')) {
        return res.redirect(302, url); // Redirect to the YouTube video page (302 temporary redirect)
    }

    // Handle other URLs (Proxy fetch for non-YouTube URLs)
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': url,
            }
        });

        const contentType = response.headers['content-type'];
        if (contentType) {
            res.setHeader("Content-Type", contentType);
        }

        response.data.pipe(res);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch the requested URL." });
    }
}
