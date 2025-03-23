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
                maxRedirects: 5, // Allow up to 5 redirects
            });

            // If the request is successful, stream the content
            if (response.status === 200) {
                const contentType = response.headers['content-type'];
                if (contentType) res.setHeader("Content-Type", contentType);
                response.data.pipe(res);
            } else {
                return res.status(500).json({ error: `Failed to fetch the requested YouTube page: ${response.statusText}` });
            }
        } catch (error) {
            if (error.response && error.response.status === 301) {
                // Handle 301 redirect manually if needed
                const redirectUrl = error.response.headers['location'];
                console.log(`Redirected to: ${redirectUrl}`);
                return res.redirect(redirectUrl); // Follow the redirect
            }

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
                maxRedirects: 5, // Allow up to 5 redirects
            });

            // If the request is successful, stream the content
            if (response.status === 200) {
                const contentType = response.headers['content-type'];
                if (contentType) res.setHeader("Content-Type", contentType);
                response.data.pipe(res);
            } else {
                console.error(`Failed to fetch URL: ${response.statusText}`);
                return res.status(500).json({ error: `Failed to fetch the requested URL: ${response.statusText}` });
            }
        } catch (error) {
            console.error(`Error fetching URL: ${error.message}`);
            return res.status(500).json({ error: `Error fetching the requested URL: ${error.message}` });
        }
    }
}
