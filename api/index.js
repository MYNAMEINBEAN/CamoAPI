export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        // Make the request to the external URL
        console.log('Fetching URL:', url);

        const response = await fetch(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': req.headers['referer'] || url,
            },
        });

        if (!response.ok) {
            // Log the failure to help debug
            console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ error: `Failed to fetch the requested URL: ${response.statusText}` });
        }

        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // Pipe the response body to the client
        response.body.pipe(res);
    } catch (error) {
        // Log the detailed error for debugging
        console.error('Error in function execution:', error);
        res.status(500).json({ error: 'Failed to fetch the requested URL.' });
    }
}
