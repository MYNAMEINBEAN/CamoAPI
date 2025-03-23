import axios from 'axios';

export default async function handler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        url = decodeURIComponent(url);

        // If it's a YouTube URL, force "nocookie" mode
        url = url.replace("youtube.com", "youtube-nocookie.com");

        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': url,
            },
            responseType: 'stream',
            maxRedirects: 20,
            validateStatus: (status) => status < 500,
        });

        const contentType = response.headers['content-type'];
        if (contentType) res.setHeader("Content-Type", contentType);

        response.data.pipe(res);
    } catch (error) {
        console.error(`Error fetching the URL: ${error.message}`);
        return res.status(500).json({ error: `Error fetching the requested URL: ${error.message}` });
    }
}
