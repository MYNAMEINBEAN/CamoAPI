export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        // Fetch the page's HTML content from the provided URL
        const response = await fetch(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': req.headers['referer'] || url,
            }
        });

        const contentType = response.headers.get("content-type");

        // If the content is HTML, we need to modify it and rewrite URLs
        if (contentType && contentType.includes("text/html")) {
            let body = await response.text();

            // Inject eruda.js for debugging
            const erudaScript = `
                <script src="https://cdnjs.cloudflare.com/ajax/libs/eruda/2.4.1/eruda.min.js"></script>
                <script>eruda.init();</script>
            `;
            // Inject eruda just before closing the </body> tag
            body = body.replace("</body>", `${erudaScript}</body>`);

            // Rewrite all URLs (src, href, etc.) to be proxied through the API
            body = body.replace(/(href|src|data-src)="(https?:\/\/[^"]+)"/g, (match, attr, resourceUrl) => {
                const proxiedUrl = `/api/index.js?url=${encodeURIComponent(resourceUrl)}`;
                return `${attr}="${proxiedUrl}"`;
            });

            // Rewrite CSS files to be proxied
            body = body.replace(/<link[^>]+href="(https?:\/\/[^"]+\.css)"/g, (match, cssUrl) => {
                const proxiedUrl = `/api/index.js?url=${encodeURIComponent(cssUrl)}`;
                return match.replace(cssUrl, proxiedUrl);
            });

            // Rewrite JS files to be proxied
            body = body.replace(/<script[^>]+src="(https?:\/\/[^"]+\.js)"/g, (match, jsUrl) => {
                const proxiedUrl = `/api/index.js?url=${encodeURIComponent(jsUrl)}`;
                return match.replace(jsUrl, proxiedUrl);
            });

            // Rewrite iframe embeds to be proxied
            body = body.replace(/<iframe[^>]+src="(https?:\/\/www.youtube.com[^"]+)"/g, (match, iframeUrl) => {
                const proxiedUrl = `/api/index.js?url=${encodeURIComponent(iframeUrl)}`;
                return match.replace(iframeUrl, proxiedUrl);
            });

            res.setHeader("Content-Type", "text/html");
            return res.send(body);
        }

        // For non-HTML content (CSS, JS, images, etc.), fetch and send the resource directly
        const resourceResponse = await fetch(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
            }
        });

        const resourceType = resourceResponse.headers.get("content-type");

        if (resourceType && resourceType.includes("image/")) {
            res.setHeader("Content-Type", resourceType);
            resourceResponse.body.pipe(res);
        } else if (resourceType && resourceType.includes("application/javascript")) {
            res.setHeader("Content-Type", "application/javascript");
            resourceResponse.body.pipe(res);
        } else if (resourceType && resourceType.includes("text/css")) {
            res.setHeader("Content-Type", "text/css");
            resourceResponse.body.pipe(res);
        } else if (resourceType && resourceType.includes("font/")) {
            res.setHeader("Content-Type", resourceType);
            resourceResponse.body.pipe(res);
        } else {
            res.setHeader("Content-Type", resourceType || "application/octet-stream");
            resourceResponse.body.pipe(res);
        }

    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).json({ error: "Failed to fetch the requested URL." });
    }
}
