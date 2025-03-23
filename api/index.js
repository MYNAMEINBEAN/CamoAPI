export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        // Forward CORS headers so the client can access the response
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent, Referer');
        
        // Handle OPTIONS preflight requests (CORS check)
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // Make the request to the external URL
        const response = await fetch(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': req.headers['referer'] || url,
            },
        });

        // Check if the response is valid
        if (!response.ok) {
            return res.status(response.status).json({ error: `Failed to fetch URL: ${response.statusText}` });
        }

        // Forward the content type
        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // Pipe the response body to the client
        response.body.pipe(res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch the requested URL.' });
    }
}
