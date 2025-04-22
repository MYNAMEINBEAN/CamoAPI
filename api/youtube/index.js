import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';

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

        const headers = { ...response.headers };
        delete headers['content-security-policy'];
        delete headers['content-security-policy-report-only'];
        delete headers['x-frame-options'];

        for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
        }

        if (isImage || isBinary) {
            return res.status(response.status).send(Buffer.from(response.data));
        }

        if (isJson) {
            return res.status(response.status).json(response.data);
        }

        let data = response.data;

        // Handling YouTube-specific modifications (e.g., replacing video URLs)
        if (!isJs && contentType.includes('text/html')) {
            const baseUrl = new URL(url);

            // Modify src or href attributes for YouTube-specific content (video embedding)
            data = data.replace(/(src|href|srcset|poster)=["']([^"']+)["']/gi, (match, attr, link) => {
                try {
                    // Ignore data URLs, mailto, and javascript
                    if (link.startsWith('data:') || link.startsWith('mailto:') || link.startsWith('javascript:')) {
                        return match;
                    }
                    // For YouTube video links, modify the URLs as needed
                    if (link.includes('youtube.com')) {
                        const absoluteUrl = new URL(link, baseUrl).toString();
                        const proxied = `/API/index.js?url=${encodeURIComponent(absoluteUrl)}`;
                        return `${attr}="${proxied}"`;
                    }
                    const absoluteUrl = new URL(link, baseUrl).toString();
                    const proxied = `/API/index.js?url=${encodeURIComponent(absoluteUrl)}`;
                    return `${attr}="${proxied}"`;
                } catch (e) {
                    return match;
                }
            });

            data = data.replace('loading="lazy"', 'loading="eager"');

            // Handle YouTube video embeds (e.g., iframe)
            data = data.replace(/<iframe\s+[^>]*src=["'](https:\/\/www\.youtube\.com\/embed\/[^"']+)["'][^>]*>/gi, (match, link) => {
                const target = new URL(link, baseUrl).toString();
                const proxied = `/API/index.js?url=${encodeURIComponent(target)}`;
                return match.replace(link, proxied);
            });
        }

        // Return the modified data
        return res.status(response.status).send(data);

    } catch (err) {
        console.error(`Proxy Error: ${err.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${err.message}</p>`);
    }
}
