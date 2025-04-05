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

        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: 'text', // Handle as text (CSS/JS/JSON)
            timeout: 30000, // Timeout for slow responses
        });

        const contentType = response.headers["content-type"] || "application/octet-stream";

        // Set CORS headers (optional if needed for cross-origin requests)
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");

        // If it's JSON, handle as JSON, otherwise send it as text (CSS, JS)
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
