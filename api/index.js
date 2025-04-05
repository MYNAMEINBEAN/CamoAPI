import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        // Decode and clean the URL
        url = decodeURIComponent(url);
        console.log(`Proxying: ${url}`);

        const isImageRequest = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
        const isJsonRequest = url.endsWith('.json');

        // Handle Image Request (such as .jpg, .png)
        if (isImageRequest) {
            const agent = new https.Agent({ rejectUnauthorized: false });

            const response = await axios.get(url, {
                httpsAgent: agent,
                responseType: 'arraybuffer',
                timeout: 30000,
            });

            const contentType = response.headers["content-type"] || "application/octet-stream";
            res.setHeader("Content-Type", contentType);
            res.setHeader("Access-Control-Allow-Origin", "*");

            // Send the image back as binary data
            return res.status(response.status).send(Buffer.from(response.data));
        }

        // Handle non-image content (HTML, CSS, JS, JSON)
        const agent = new https.Agent({ rejectUnauthorized: false });
        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: 'text',
            timeout: 30000,
        });

        let contentType = response.headers["content-type"] || "text/html";
        let data = response.data;

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");

        // If it's HTML, replace links and URLs inside HTML content
        if (contentType.includes("text/html")) {
            data = data.replace(/(["'])((http[s]?:\/\/)?[\w.-]+(?:\/[\w.-]*)?)(["'])/g, (match, p1, p2, p3, p4) => {
                // Proxy all URLs
                if (!p2.startsWith('http')) {
                    return `${p1}/API/index.js?url=${encodeURIComponent(p2)}${p4}`;
                }
                return match;
            });

            data = data.replace(/window\.location\.href\s*=\s*["']([^"']+)["']/g, (match, p1) => {
                // Proxify window location.href assignments
                return `window.location.href = "/API/index.js?url=${encodeURIComponent(p1)}"`;
            });

            data = data.replace(/window\.open\s*?\(\s*?["']([^"']+)["']\s*?\)/g, (match, p1) => {
                // Proxify window.open() calls
                return `window.open("/API/index.js?url=${encodeURIComponent(p1)}")`;
            });
        }

        // For JSON files, proxy them too
        if (isJsonRequest) {
            // If it's a JSON file, return it directly as JSON
            res.setHeader("Content-Type", "application/json");
            return res.status(response.status).json(response.data);
        }

        // For other content like CSS, JS, etc., just pass through
        res.setHeader("Content-Type", contentType);
        res.status(response.status).send(data);

    } catch (error) {
        console.error(`Error fetching: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
