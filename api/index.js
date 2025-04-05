import axios from 'axios';
import https from 'https';
import urlModule from 'url';

export default async function handler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        url = decodeURIComponent(url);
        console.log(`Proxying: ${url}`);

        const parsedBaseUrl = urlModule.parse(url);
        const baseUrl = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}`;

        const excludedPaths = ['/login/ldap', '/login', '/oauth', '/api/auth'];

        const shouldExcludeUrl = (url) => {
            return excludedPaths.some(excludedPath => url.includes(excludedPath));
        };

        const isImageRequest = /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico|webm|avif)$/i.test(url);
        const isJsonRequest = /\.json$/i.test(url);
        const isScriptRequest = /\.(js)$/i.test(url);
        
        if (isImageRequest) {
            const agent = new https.Agent({ rejectUnauthorized: false });

            const response = await axios.get(url, {
                httpsAgent: agent,
                responseType: 'arraybuffer',
                timeout: 30000,
            });

            const contentType = response.headers["content-type"] || "application/octet-stream";
            res.setHeader("Content-Type", contentType);
            res.setHeader("Access-Control-Allow-Origin", "*");

            res.status(response.status).send(Buffer.from(response.data));

        } else if (isJsonRequest) {
            const agent = new https.Agent({ rejectUnauthorized: false });

            const response = await axios.get(url, {
                httpsAgent: agent,
                responseType: 'json',
                timeout: 30000,
            });

            const contentType = response.headers["content-type"] || "application/json";

            res.setHeader("Content-Type", contentType);
            res.setHeader("Access-Control-Allow-Origin", "*");

            res.status(response.status).json(response.data);

        } else {
            const agent = new https.Agent({ rejectUnauthorized: false });

            const response = await axios.get(url, {
                httpsAgent: agent,
                responseType: 'text',
                timeout: 30000,
            });

            const contentType = response.headers["content-type"] || "application/octet-stream";

            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");

            if (contentType.includes("application/json")) {
                res.setHeader("Content-Type", "application/json");
                res.status(response.status).json(response.data);
            } else if (contentType.includes("text/html")) {
                let htmlContent = response.data;

                const proxifyUrl = (url) => {
                    if (shouldExcludeUrl(url)) {
                        return url;
                    }

                    if (url.startsWith('/') || !url.startsWith('http')) {
                        return `/api/index.js?url=${encodeURIComponent(baseUrl + (url.startsWith('/') ? url : '/' + url))}`;
                    }

                    if (url.includes('.onlinestyles')) {
                        url = url.replace('.onlinestyles', '/onlinestyles');
                    }

                    if (url.startsWith(baseUrl)) {
                        return `/api/index.js?url=${encodeURIComponent(url)}`;
                    }

                    return `/api/index.js?url=${encodeURIComponent(url)}`;
                };

                htmlContent = htmlContent.replace(/(<(?:link|script)[^>]+(?:href|src)\s*=\s*['"])([^'"]+)(['"][^>]*>)/gi, (match, p1, p2, p3) => {
                    const proxifiedUrl = proxifyUrl(p2);
                    return `${p1}${proxifiedUrl}${p3}`;
                });

                htmlContent = htmlContent.replace(/(<img[^>]+src\s*=\s*['"])([^'"]+)(['"][^>]*>)/gi, (match, p1, p2, p3) => {
                    const proxifiedUrl = proxifyUrl(p2);
                    return `${p1}${proxifiedUrl}${p3}`;
                });

                const proxifyJsRedirection = (jsCode) => {
                    return jsCode.replace(/(window\.(location|open|replace|assign)\s*=\s*['"])([^'"]+)(['"])/gi, (match, p1, p2, p3, p4) => {
                        if (shouldExcludeUrl(p3)) {
                            return match;
                        }

                        const proxifiedUrl = proxifyUrl(p3);
                        return `${p1}${p2}${proxifiedUrl}${p4}`;
                    }).replace(/(onclick\s*=\s*['"])([^'"]+)(['"])/gi, (match, p1, p2, p3) => {
                        const proxifiedUrl = proxifyUrl(p2);
                        return `${p1}${proxifiedUrl}${p3}`;
                    }).replace(/(href\s*=\s*['"])([^'"]+)(['"])/gi, (match, p1, p2, p3) => {
                        const proxifiedUrl = proxifyUrl(p2);
                        return `${p1}${proxifiedUrl}${p3}`;
                    });
                };

                htmlContent = htmlContent.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (match, p1, p2, p3) => {
                    const proxifiedJs = proxifyJsRedirection(p2);
                    return `${p1}${proxifiedJs}${p3}`;
                });

                htmlContent = htmlContent.replace('</body>', `<script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init();</script></body>`);

                res.setHeader("Content-Type", "text/html");
                res.status(response.status).send(htmlContent);

            } else {
                res.setHeader("Content-Type", contentType);
                res.status(response.status).send(response.data);
            }
        }

    } catch (error) {
        console.error(`Error fetching: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
