import axios from 'axios';
import https from 'https';
import urlModule from 'url';  // Node's URL module to help with URL resolution

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

        // Check if the request is for an image (added more image types)
        const isImageRequest = /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico|webm|avif)$/i.test(url);

        // Use the appropriate handler for images or other assets
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
            const agent = new https.Agent({ rejectUnauthorized: false });

            const response = await axios.get(url, {
                httpsAgent: agent,
                responseType: 'text', // Use text for assets like CSS and JS
                timeout: 30000, // Timeout for slow responses
            });

            const contentType = response.headers["content-type"] || "application/octet-stream";

            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");

            // Handle text-based responses (CSS, JS, JSON, HTML)
            if (contentType.includes("application/json")) {
                res.setHeader("Content-Type", "application/json");
                res.status(response.status).json(response.data); // Return JSON data
            } else if (contentType.includes("text/html")) {
                // If HTML content, modify the links and redirections to be proxified
                let htmlContent = response.data;

                // Helper function to proxify URLs
                const proxifyUrl = (url) => {
                    // Skip proxifying for specific URLs like login redirection
                    if (url.includes("/login/ldap")) {
                        return url;
                    }

                    // Skip already proxified URLs
                    if (url.startsWith('/API/index.js?url=')) {
                        return url;
                    }

                    // If it's a relative URL, we should resolve it to the full base URL
                    if (url.startsWith('/') || !url.startsWith('http')) {
                        return `/API/index.js?url=${encodeURIComponent(baseUrl + url)}`;
                    }

                    // Otherwise, handle the absolute URL by returning a proxified version
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
                        // Check if the URL is in the exclusion list
                        if (p3.includes("/login/ldap")) {
                            return match;  // Do not modify these URLs
                        }

                        const proxifiedUrl = proxifyUrl(p3);
                        return `${p1}${p2}${proxifiedUrl}${p4}`;
                    });
                };

                // Apply redirection proxification to all JavaScript in the HTML content
                htmlContent = htmlContent.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (match, p1, p2, p3) => {
                    const proxifiedJs = proxifyJsRedirection(p2);
                    return `${p1}${proxifiedJs}${p3}`;
                });

                // Inject the Eruda script for debugging
                htmlContent = htmlContent.replace('</body>', `<script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init();</script></body>`);

                // Send the modified HTML back
                res.setHeader("Content-Type", "text/html");
                res.status(response.status).send(htmlContent);

            } else {
                // Return other asset types like CSS, JS as they are
                res.setHeader("Content-Type", contentType);
                res.status(response.status).send(response.data);
            }
        }

    } catch (error) {
        console.error(`Error fetching: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
