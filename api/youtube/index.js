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

        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: 'arraybuffer', // Always get arraybuffer
            timeout: 30000,
            headers: {
                'User-Agent': req.headers['user-agent'] || '',
                'Accept': '*/*',
            },
        });

        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const buffer = Buffer.from(response.data);

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", contentType);

        // Strip security headers
        const headers = { ...response.headers };
        delete headers['content-security-policy'];
        delete headers['content-security-policy-report-only'];
        delete headers['x-frame-options'];

        for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
        }

        // If it's HTML, try to modify URLs inside
        if (contentType.includes('text/html')) {
            let data = buffer.toString('utf8');
            const baseUrl = new URL(url);

            data = data.replace(/(src|href|srcset|poster)=["']([^"']+)["']/gi, (match, attr, link) => {
                try {
                    if (link.startsWith('data:') || link.startsWith('mailto:') || link.startsWith('javascript:')) {
                        return match;
                    }
                    const absoluteUrl = new URL(link, baseUrl).toString();
                    const proxied = `/API/index.js?url=${encodeURIComponent(absoluteUrl)}`;
                    return `${attr}="${proxied}"`;
                } catch {
                    return match;
                }
            });

            data = data.replace('loading="lazy"', 'loading="eager"');

            // Proxy iframe embeds
            data = data.replace(/<iframe\s+[^>]*src=["']([^"']+)["']/gi, (match, link) => {
                try {
                    const absoluteUrl = new URL(link, baseUrl).toString();
                    const proxied = `/API/index.js?url=${encodeURIComponent(absoluteUrl)}`;
                    return match.replace(link, proxied);
                } catch {
                    return match;
                }
            });

            return res.status(response.status).send(data);
        }

        // If not HTML, send raw buffer
        return res.status(response.status).send(buffer);

    } catch (err) {
        console.error(`Proxy Error: ${err.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${err.message}</p>`);
    }
}
