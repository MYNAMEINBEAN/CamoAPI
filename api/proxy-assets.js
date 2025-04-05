import axios from 'axios';
import https from 'https';

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

        // Determine if this is a JSON request or not
        const isJsonRequest = url.endsWith('.json') || url.includes('/api/');

        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: isJsonRequest ? 'json' : 'text', // Text for CSS/JS, JSON for APIs
            timeout: 30000, // Timeout for slow responses
        });

        const contentType = response.headers["content-type"] || "application/octet-stream";

        // Set CORS headers for cross-origin requests
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");

        // Handle JSON data as JSON
        if (contentType.includes("application/json")) {
            res.setHeader("Content-Type", "application/json");
            res.status(response.status).json(response.data); // Return JSON data
        } else {
            res.setHeader("Content-Type", contentType);
            res.status(response.status).send(response.data); // Return as text (CSS/JS)
        }

    } catch (error) {
        console.error(`Error fetching asset: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
