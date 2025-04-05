import axios from 'axios';
import https from 'https';

export default async function proxyAssetsHandler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: 'text', // Treat CSS and JS as text
        });

        const contentType = response.headers["content-type"] || "application/octet-stream";
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");

        res.setHeader("Content-Type", contentType);
        res.status(response.status).send(response.data);

    } catch (error) {
        console.error(`Error fetching asset: ${error.message}`);
        return res.status(500).send(`<h1>Asset Proxy Error</h1><p>${error.message}</p>`);
    }
}
