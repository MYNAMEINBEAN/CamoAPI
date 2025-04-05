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

        // Check if the request is for an image
        const isImageRequest = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);

        // Use the appropriate handler for images or other assets
        if (isImageRequest) {
            // Proxy the image request
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
            // For non-image assets (CSS, JS, JSON), use the proxy-asset handler
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

            // Handle text-based responses (CSS, JS, JSON)
            if (contentType.includes("application/json")) {
                res.setHeader("Content-Type", "application/json");
                res.status(response.status).json(response.data); // Return JSON data
            } else {
                res.setHeader("Content-Type", contentType);
                res.status(response.status).send(response.data); // Return as text (CSS/JS)
            }
        }

    } catch (error) {
        console.error(`Error fetching: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
