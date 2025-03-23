import axios from 'axios';

export default async function handler(req, res) {
    // Get the `url` query parameter from the request
    const { url } = req.query;

    // Check if URL is provided in the query
    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        // Logging for debugging
        console.log(`Fetching content from: ${url}`);

        // Making the request to the provided URL
        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': req.headers['referer'] || url,
            }
        });

        // Check the content type
        const contentType = response.headers['content-type'];
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // Send the content back to the client
        res.status(200).send(response.data);
    } catch (error) {
        // Log the error for debugging
        console.error('Error fetching URL:', error);

        // Return a 500 error if fetch fails
        res.status(500).json({ error: 'Failed to fetch the requested URL.' });
    }
}
