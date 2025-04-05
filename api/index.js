import axios from 'axios';
import https from 'https';
import { URL } from 'url';

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
            timeout: 10000, // Timeout after 10 seconds
        });

        const contentType = response.headers["content-type"] || "application/octet-stream";
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");

        if (contentType.includes("text/html")) {
            let htmlContent = Buffer.from(response.data).toString('utf-8');
            const baseUrl = new URL(url);

            const imgRegex = /<img[^>]+src="([^"]+)"/g;
            htmlContent = htmlContent.replace(imgRegex, (match, imgUrl) => {
                if (imgUrl.startsWith('/')) {
                    imgUrl = baseUrl.origin + imgUrl;
                }
                const proxyImageUrl = `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
                return match.replace(imgUrl, proxyImageUrl);
            });

            const cssJsRegex = /<link[^>]+href="([^"]+)"|<script[^>]+src="([^"]+)"/g;
            htmlContent = htmlContent.replace(cssJsRegex, (match, href1, src2) => {
                let resourceUrl = href1 || src2;
                if (resourceUrl.startsWith('/')) {
                    resourceUrl = baseUrl.origin + resourceUrl;
                }
                const proxyResourceUrl = `/api/proxy-image?url=${encodeURIComponent(resourceUrl)}`;
                return match.replace(resourceUrl, proxyResourceUrl);
            });

            const erudaScript = `
                <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
                <script>eruda.init();</script>
            `;
            htmlContent = htmlContent.replace('</body>', `${erudaScript}</body>`);

            res.setHeader("Content-Type", "text/html");
            res.status(response.status).send(htmlContent);
        } else {
            res.setHeader("Content-Type", contentType);
            res.status(response.status).send(Buffer.from(response.data));
        }

    } catch (error) {
        console.error(`Error fetching: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
