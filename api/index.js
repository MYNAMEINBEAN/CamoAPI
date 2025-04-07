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
    if (!url) return res.status(400).send("Missing `url` query parameter.");

    try {
        url = decodeURIComponent(url);
        console.log(`Proxying: ${url}`);

        const agent = new https.Agent({ rejectUnauthorized: false });

        // Figure out what kind of request this is
        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
        const isBinary = /\.(woff2?|ttf|eot|otf|ico)$/i.test(url);
        const isJson = /\.json$/i.test(url);
        const isHtml = /\.(html?|\/)$/i.test(url); // ends with .html or /

        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: isImage || isBinary ? 'arraybuffer' : 'text',
            timeout: 30000,
            headers: {
                'User-Agent': req.headers['user-agent'] || '',
                'Accept': '*/*',
            },
        });

        const contentType = response.headers['content-type'] || 'application/octet-stream';
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", contentType);

        // Send binary files (images, fonts, etc.)
        if (isImage || isBinary) {
            return res.status(response.status).send(Buffer.from(response.data));
        }

        // Send JSON
        if (isJson) {
            return res.status(response.status).json(response.data);
        }

        let data = response.data;

        // Rewrite internal links inside HTML
        if (contentType.includes('text/html')) {
            const baseUrl = new URL(url);

            // Rewrite src/href links
            data = data.replace(/(src|href)=["']([^"']+)["']/gi, (match, attr, link) => {
                try {
                    if (link.startsWith('data:') || link.startsWith('mailto:') || link.startsWith('javascript:')) {
                        return match;
                    }

                    const absoluteUrl = new URL(link, baseUrl).toString();
                    const proxied = `/API/index.js?url=${encodeURIComponent(absoluteUrl)}`;
                    return `${attr}="${proxied}"`;
                } catch (e) {
                    return match;
                }
            });

            // Rewrite window.location.href
            data = data.replace(/window\.location\.href\s*=\s*["']([^"']+)["']/g, (_, link) => {
                const target = new URL(link, baseUrl).toString();
                return `window.location.href = "/API/index.js?url=${encodeURIComponent(target)}"`;
            });

            // Rewrite window.open
            data = data.replace(/window\.open\s*\(\s*["']([^"']+)["']\s*\)/g, (_, link) => {
                const target = new URL(link, baseUrl).toString();
                return `window.open("/API/index.js?url=${encodeURIComponent(target)}")`;
            });
        }

        return res.status(response.status).send(data);

    } catch (err) {
        console.error(`Proxy Error: ${err.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${err.message}</p>`);
    }
}
