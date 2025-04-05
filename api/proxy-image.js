import axios from 'axios';
import https from 'https';

export default async function proxyImageHandler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: 'arraybuffer',
        });

        const contentType = response.headers["content-type"] || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Access-Control-Allow-Origin", "*");

        res.status(response.status).send(Buffer.from(response.data));

    } catch (error) {
        console.error(`Error fetching image: ${error.message}`);
        return res.status(500).send(`<h1>Image Proxy Error</h1><p>${error.message}</p>`);
    }
}
