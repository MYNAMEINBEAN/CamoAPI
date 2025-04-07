import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");
        return res.status(204).end();
    }

    let { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        url = decodeURIComponent(url);
        console.log(`Proxying: ${url}`);

        const isImageRequest = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
        const isJsonRequest = url.endsWith('.json');

        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: isImageRequest ? 'arraybuffer' : 'text',
            timeout: 30000,
        });

        const contentType = response.headers['content-type'] || (isImageRequest ? 'application/octet-stream' : 'text/plain');

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", contentType);

        if (isImageRequest) {
            return res.status(response.status).send(Buffer.from(response.data));
        }

        if (isJsonRequest) {
            res.setHeader("Content-Type", "application/json");
            return res.status(response.status).json(response.data);
        }

        let data = response.data;

        if (contentType.includes("text/html")) {
            // Proxify URLs inside HTML content
            data = data
                .replace(/(href|src)=["']([^"']+)["']/g, (match, attr, link) => {
                    if (!link.startsWith('http') && !link.startsWith('//')) {
                        return `${attr}="/API/index.js?url=${encodeURIComponent(link)}"`;
                    } else if (link.startsWith('http')) {
                        return `${attr}="/API/index.js?url=${encodeURIComponent(link)}"`;
                    }
                    return match;
                })
                .replace(/window\.location\.href\s*=\s*["']([^"']+)["']/g, (_, href) => {
                    return `window.location.href = "/API/index.js?url=${encodeURIComponent(href)}"`;
                })
                .replace(/window\.open\s*\(\s*["']([^"']+)["']\s*\)/g, (_, openUrl) => {
                    return `window.open("/API/index.js?url=${encodeURIComponent(openUrl)}")`;
                });
        }

        res.status(response.status).send(data);

    } catch (error) {
        console.error(`Proxy Error: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
