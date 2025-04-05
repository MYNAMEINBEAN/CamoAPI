import axios from 'axios';
import https from 'https';
import { parse } from 'url';

export default async function proxyAssetHandler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        // Decode and clean the URL
        url = decodeURIComponent(url);
        console.log(`Proxying asset: ${url}`);

        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: 'text', // Fetch as text for CSS/JS
            timeout: 30000, // Timeout for slow responses
        });

        const contentType = response.headers["content-type"] || "application/octet-stream";

        // If CSS, rewrite relative URLs in the CSS to be proxied as well
        if (contentType.includes("text/css")) {
            let cssContent = response.data;

            // Regex to match relative URLs in the CSS
            const urlRegex = /url\((['"]?)([^'")]+)\1\)/g;
            cssContent = cssContent.replace(urlRegex, (match, quote, url) => {
                const parsedUrl = parse(url);
                // If the URL is relative (not absolute), we'll proxy it.
                if (!parsedUrl.hostname) {
                    const proxiedUrl = `/api/proxy-assets?url=${encodeURIComponent(url)}`;
                    return `url(${quote}${proxiedUrl}${quote})`; // Rewriting the relative URL to be proxied
                }
                return match;
            });

            // Set the content type for CSS
            res.setHeader("Content-Type", "text/css");
            res.status(response.status).send(cssContent); // Send the updated CSS with proxied URLs
        } else if (contentType.includes("text/html")) {
            // For HTML content, inject Eruda at the end of the body
            let htmlContent = response.data;

            // Add Eruda script just before the closing </body> tag
            htmlContent = htmlContent.replace(
                /<\/body>/,
                `<script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init();</script></body>`
            );

            // Set the content type for HTML
            res.setHeader("Content-Type", "text/html");
            res.status(response.status).send(htmlContent); // Send modified HTML with Eruda
        } else {
            // For other assets (JS, JSON, etc.), just send as usual
            res.setHeader("Content-Type", contentType);
            res.status(response.status).send(response.data); // Return as text (CSS/JS)
        }

        // CORS handling
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");

    } catch (error) {
        console.error(`Error fetching asset: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
