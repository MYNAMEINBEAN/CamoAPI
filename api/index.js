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
            const erudaScript = `
                <script src="https://cdnjs.cloudflare.com/ajax/libs/eruda/2.4.1/eruda.min.js"></script>
                <script>eruda.init();</script>
            `;
            body = body.replace("</body>", `${erudaScript}</body>`);

            body = body.replace(/(href|src)="(https?:\/\/[^"]+)"/g, (match, attr, resourceUrl) => {
                const proxiedUrl = `/api/index.js?url=${encodeURIComponent(resourceUrl)}`;
                return `${attr}="${proxiedUrl}"`;
            });

            body = body.replace(/<link[^>]+href="(https?:\/\/[^"]+\.css)"/g, (match, cssUrl) => {
                const proxiedUrl = `/api/index.js?url=${encodeURIComponent(cssUrl)}`;
                return match.replace(cssUrl, proxiedUrl);
            });

            body = body.replace(/<script[^>]+src="(https?:\/\/[^"]+\.js)"/g, (match, jsUrl) => {
                const proxiedUrl = `/api/index.js?url=${encodeURIComponent(jsUrl)}`;
                return match.replace(jsUrl, proxiedUrl);
            });

            body = body.replace(/<iframe[^>]+src="(https?:\/\/www.youtube.com[^"]+)"/g, (match, iframeUrl) => {
                const proxiedUrl = `/api/index.js?url=${encodeURIComponent(iframeUrl)}`;
                return match.replace(iframeUrl, proxiedUrl);
            });

            res.setHeader("Content-Type", "text/html");
            return res.send(body);
        }

        if (contentType && contentType.includes("image/")) {
            res.setHeader("Content-Type", contentType);
            response.body.pipe(res);
        }

        else if (contentType && contentType.includes("application/")) {
            res.setHeader("Content-Type", contentType);
            response.body.pipe(res);
        }

        else if (contentType && contentType.includes("font/")) {
            res.setHeader("Content-Type", contentType);
            response.body.pipe(res);
        }

        else {
            res.setHeader("Content-Type", contentType || "application/octet-stream");
            response.body.pipe(res);
        }

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch the requested URL." });
    }
}
