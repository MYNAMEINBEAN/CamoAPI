import axios from 'axios';
import https from 'https';
import urlModule from 'url';

export default async function handler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        // Decode and clean the URL
        url = decodeURIComponent(url);
        console.log(`Proxying: ${url}`);

        // Parse the base URL to resolve relative paths
        const parsedBaseUrl = urlModule.parse(url);
        const baseUrl = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}`;

        // Exclude URLs that we don't want to proxify (e.g., login or third-party redirects)
        const excludedPaths = ['/login/ldap', '/login', '/oauth', '/api/auth'];

        // Function to check if a URL should be excluded
        const shouldExcludeUrl = (url) => {
            return excludedPaths.some(excludedPath => url.includes(excludedPath));
        };

        // Check if the request is for an image
        const isImageRequest = /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico|webm|avif)$/i.test(url);

        // If it is an image, proxy the image directly
        if (isImageRequest) {
            const agent = new https.Agent({ rejectUnauthorized: false });

            const response = await axios.get(url, {
                httpsAgent: agent,
                responseType: 'arraybuffer',
                timeout: 30000, // Timeout if the request takes too long
            });

            const contentType = response.headers["content-type"] || "application/octet-stream";
            res.setHeader("Content-Type", contentType);
            res.setHeader("Access-Control-Allow-Origin", "*");

            // Send the image back as binary data
            res.status(response.status).send(Buffer.from(response.data));

        } else {
            // For non-image assets (HTML, CSS, JS, JSON), handle them as text
            const agent = new https.Agent({ rejectUnauthorized: false });

            const response = await axios.get(url, {
                httpsAgent: agent,
                responseType: 'text',
                timeout: 30000,
            });

            const contentType = response.headers["content-type"] || "application/octet-stream";

            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");

            // Handle JSON responses
            if (contentType.includes("application/json")) {
                res.setHeader("Content-Type", "application/json");
                res.status(response.status).json(response.data);
            } else if (contentType.includes("text/html")) {
                // If the content is HTML, we need to proxify the links and scripts
                let htmlContent = response.data;

                // Helper function to proxify URLs
                const proxifyUrl = (url) => {
                    if (shouldExcludeUrl(url)) {
                        return url;  // Don't proxify these URLs
                    }

                    // If it's a relative URL, resolve it to the base URL
                    if (url.startsWith('/') || !url.startsWith('http')) {
                        return `/API/index.js?url=${encodeURIComponent(baseUrl + url)}`;
                    }

                    // Otherwise, return a proxified absolute URL
                    return `/API/index.js?url=${encodeURIComponent(url)}`;
                };

                // Modify <link>, <script>, and <img> tags to proxify URLs
                htmlContent = htmlContent.replace(/(<(?:link|script)[^>]+(?:href|src)\s*=\s*['"])([^'"]+)(['"][^>]*>)/gi, (match, p1, p2, p3) => {
                    const proxifiedUrl = proxifyUrl(p2);
                    return `${p1}${proxifiedUrl}${p3}`;
                });

                htmlContent = htmlContent.replace(/(<img[^>]+src\s*=\s*['"])([^'"]+)(['"][^>]*>)/gi, (match, p1, p2, p3) => {
                    const proxifiedUrl = proxifyUrl(p2);
                    return `${p1}${proxifiedUrl}${p3}`;
                });

                // Modify JavaScript redirections (like window.location.href, window.open, etc.)
                const proxifyJsRedirection = (jsCode) => {
                    return jsCode.replace(/(window\.(location|open|replace|assign)\s*=\s*['"])([^'"]+)(['"])/gi, (match, p1, p2, p3, p4) => {
                        if (shouldExcludeUrl(p3)) {
                            return match;  // Skip this redirect if it's in the excluded list
                        }

                        const proxifiedUrl = proxifyUrl(p3);
                        return `${p1}${p2}${proxifiedUrl}${p4}`;
                    });
                };

                // Apply the redirection handler to JavaScript in HTML
                htmlContent = htmlContent.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (match, p1, p2, p3) => {
                    const proxifiedJs = proxifyJsRedirection(p2);
                    return `${p1}${proxifiedJs}${p3}`;
                });

                // Inject the Eruda debugging script into the HTML
                htmlContent = htmlContent.replace('</body>', `<script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init();</script></body>`);

                // Send the modified HTML back
                res.setHeader("Content-Type", "text/html");
                res.status(response.status).send(htmlContent);

            } else {
                // For other asset types like CSS, JS, etc., return them as they are
                res.setHeader("Content-Type", contentType);
                res.status(response.status).send(response.data);
            }
        }

    } catch (error) {
        console.error(`Error fetching: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
