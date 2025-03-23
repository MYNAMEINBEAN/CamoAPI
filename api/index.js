import axios from 'axios';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        console.log(`Attempting to fetch: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': req.headers['referer'] || url,
            },
        });

        // Forward CORS headers for the client-side
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent, Referer');

        // Set content type header
        const contentType = response.headers['content-type'];
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        res.status(200).send(response.data);
    } catch (error) {
        console.error('Axios error occurred during fetch:', error);
        res.status(500).json({ error: 'Failed to fetch the requested URL.' });
    }
}
