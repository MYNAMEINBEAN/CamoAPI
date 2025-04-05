import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        url = decodeURIComponent(url);
        url = url.replace(/%3A/g, ':').replace(/%2F/g, '/');
        console.log(`Proxying: ${url}`);

        const agent = new https.Agent({ rejectUnauthorized: false });

        // Fetch data with arraybuffer to handle binary content (images, JS, CSS)
        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': url,
            },
            httpsAgent: agent,
            responseType: 'arraybuffer', // ✅ Ensures binary data is preserved
        });

        const contentType = response.headers["content-type"] || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Access-Control-Allow-Origin", "*"); // Optional for CORS

        // Ensure the data is returned correctly
        res.status(response.status).send(Buffer.from(response.data)); // ✅ Sends raw binary data

    } catch (error) {
        console.error(`Error fetching: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
