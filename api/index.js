// pages/api/proxy.js

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    // Check if the URL is a YouTube /watch URL
    if (url.includes('youtube.com/watch')) {
        // Extract the video ID from the URL using regex
        const videoIdMatch = url.match(/v=([^&]+)/);
        if (videoIdMatch && videoIdMatch[1]) {
            const videoId = videoIdMatch[1];

            // Construct the YouTube embed URL
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;

            // Redirect to the embed URL (no page reload, just redirection)
            return res.redirect(302, embedUrl); // Redirect to the embed URL for YouTube video
        } else {
            return res.status(400).json({ error: "Invalid YouTube URL format." });
        }
    }

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
