import axios from 'axios';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        // Fetch the URL content, following redirects
        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': url,
            },
            responseType: 'stream', // This allows streaming the response
            maxRedirects: 20, // Allow up to 20 redirects to follow
        });

        // If the request is successful, stream the content
        if (response.status === 200) {
            const contentType = response.headers['content-type'];
            if (contentType) res.setHeader("Content-Type", contentType);
            response.data.pipe(res); // Pipe the response data to the client
        } else {
            return res.status(500).json({ error: `Failed to fetch the requested URL: ${response.statusText}` });
        }
    } catch (error) {
        console.error(`Error fetching the URL: ${error.message}`);
        return res.status(500).json({ error: `Error fetching the requested URL: ${error.message}` });
    }
}
