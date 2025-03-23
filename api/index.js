try {
    const response = await fetch(url, {
        headers: {
            'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
            'Referer': req.headers['referer'] || url,
        },
    });

    if (!response.ok) {
        // Log response details
        console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ error: `Failed to fetch the requested URL: ${response.statusText}` });
    }

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    response.body.pipe(res);
} catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch the requested URL." });
}
