export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': req.headers['referer'] || url,
            }
        });

        const contentType = response.headers.get("content-type");
        if (contentType) res.setHeader("Content-Type", contentType);

        response.body.pipe(res);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch the requested URL." });
    }
}
