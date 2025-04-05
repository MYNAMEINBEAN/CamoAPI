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
        url = url.replace(/%3A/g, ':').replace(/%2F/g, '/');
        console.log(`Proxying: ${url}`);

        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: 'arraybuffer', // Use binary data for images or any non-text resource
            timeout: 30000, // Timeout for slow responses
        });

        const contentType = response.headers["content-type"] || "application/octet-stream";
        
        res.setHeader("Content-Type", contentType);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.status(response.status).send(Buffer.from(response.data)); // Return binary data or text

    } catch (error) {
        console.error(`Error fetching: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
