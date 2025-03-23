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

        if (contentType && contentType.includes("text/html")) {
            let body = await response.text();

            // Handle relative URLs (like CSS, JS, images) by converting to absolute URLs
            const baseUrl = new URL(url);
            body = body.replace(/(href|src)="(\/[^"]+)"/g, (match, p1, p2) => {
                // Convert relative URLs to absolute URLs
                return `${p1}="${baseUrl.origin}${p2}"`;
            });

            const erudaScript = `
                <script src="https://cdnjs.cloudflare.com/ajax/libs/eruda/2.4.1/eruda.min.js"></script>
                <script>eruda.init();</script>
            `;
            body = body.replace("</body>", `${erudaScript}</body>`); // Inject before closing </body>
            res.setHeader("Content-Type", "text/html");
            return res.send(body);
        }

        // Pass through other content types unchanged
        res.setHeader("Content-Type", contentType);
        response.body.pipe(res);

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch the requested URL." });
    }
}
