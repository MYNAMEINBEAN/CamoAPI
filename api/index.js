import axios from 'axios';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    // Check if the URL is a YouTube /watch URL
    if (url.includes('youtube.com/watch')) {
        try {
            // Fetch the YouTube watch page content using Axios
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                    'Referer': url,
                },
                responseType: 'stream', // This allows streaming the response
                maxRedirects: 0, // Disable redirects
            });

            // Check if the request was successful
            if (response.status !== 200) {
                console.error(`Failed to fetch YouTube page: ${response.statusText}`);
                return res.status(500).json({ error: `Failed to fetch the requested YouTube page: ${response.statusText}` });
            }

            // Set the content type to the one from the response headers
            const contentType = response.headers['content-type'];
            if (contentType) res.setHeader("Content-Type", contentType);

            // Pipe the body of the response to the client
            response.data.pipe(res);
        } catch (error) {
            console.error(`Error fetching YouTube page: ${error.message}`);
            return res.status(500).json({ error: `Error fetching the requested YouTube page: ${error.message}` });
        }
    } else {
        // Handle other URLs (Proxy fetch for non-YouTube URLs)
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                    'Referer': url,
                },
                responseType: 'stream', // This allows streaming the content of other URLs
                maxRedirects: 0, // Disable redirects
            });

            // Check if the request was successful
            if (response.status !== 200) {
                console.error(`Failed to fetch URL: ${response.statusText}`);
                return res.status(500).json({ error: `Failed to fetch the requested URL: ${response.statusText}` });
            }

            const contentType = response.headers['content-type'];
            if (contentType) res.setHeader("Content-Type", contentType);

            response.data.pipe(res); // Stream the response back to the client
        } catch (error) {
            console.error(`Error fetching URL: ${error.message}`);
            return res.status(500).json({ error: `Error fetching the requested URL: ${error.message}` });
        }
    }
}
