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

        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
        const isBinary = /\.(woff2?|ttf|eot|otf|ico)$/i.test(url);
        const isJson = /\.json$/i.test(url);
        const isJs = /\.js$/i.test(url);

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

        if (isImage || isBinary) {
            return res.status(response.status).send(Buffer.from(response.data));
        }

        if (isJson) {
            return res.status(response.status).json(response.data);
        }

        let data = response.data;

        // Only rewrite if it's HTML and not a JS file
        if (!isJs && contentType.includes('text/html')) {
            const baseUrl = new URL(url);

            data = data.replace(/(src|href)=["']([^"']+)["']/gi, (match, attr, link) => {
                try {
                    if (link.startsWith('data:') || link.startsWith('mailto:') || link.startsWith('javascript:')) {
                        return match;
                    }

                    const absoluteUrl = new URL(link, baseUrl).toString();
                    const proxied = `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
                    return `${attr}="${proxied}"`;
                } catch (e) {
                    return match;
                }
            });

            data = data.replace(/window\.location\.href\s*=\s*["']([^"']+)["']/g, (_, link) => {
                const target = new URL(link, baseUrl).toString();
                return `window.location.href = "/api/proxy?url=${encodeURIComponent(target)}"`;
            });

            data = data.replace(/window\.open\s*\(\s*["']([^"']+)["']\s*\)/g, (_, link) => {
                const target = new URL(link, baseUrl).toString();
                return `window.open("/api/proxy?url=${encodeURIComponent(target)}")`;
            });

            // Inject Eruda for debugging
            data = data.replace(/<\/body>/i, `
                <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
                <script>eruda.init();</script>
            </body>`);
        }

        return res.status(response.status).send(data);

    } catch (err) {
        console.error(`Proxy Error: ${err.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${err.message}</p>`);
    }
}
