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

        // Inject Eruda script into the response (always add it)
        let responseContent = response.data;

        // Check if the response is text-based (CSS/JS/HTML)
        if (contentType.includes("text")) {
            // If the content is HTML, inject Eruda before closing </body> tag
            if (contentType.includes("text/html")) {
                responseContent = responseContent.replace(
                    /<\/body>/,
                    `<script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init();</script></body>`
                );
            } else {
                // For other text-based content (CSS/JS), append Eruda at the end of the content
                responseContent += `<script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init();</script>`;
            }

            // Set content-type for the response
            res.setHeader("Content-Type", contentType);
            res.status(response.status).send(responseContent); // Send modified content with Eruda
        } else {
            // For non-text-based content (images, binaries, etc.), send as usual
            res.setHeader("Content-Type", contentType);
            res.status(response.status).send(response.data); // Return binary data as usual
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
