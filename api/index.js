import axios from 'axios';
import https from 'https'; // ✅ Fix: Ensure HTTPS is imported

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

        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': url,
            },
            httpsAgent: agent,
            responseType: 'arraybuffer',
        });

        const contentType = response.headers["content-type"] || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.send(response.data);

    } catch (error) {
        console.error(`Error fetching: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
