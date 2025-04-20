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

        if (!isJs && contentType.includes('text/html')) {
            const baseUrl = new URL(url);

            data = data.replace(/(src|href|srcset|poster)=["']([^"']+)["']/gi, (match, attr, link) => {
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

            data = data.replace('loading="lazy"', 'loading="eager"');

            const redirectPatterns = [
                /(?:window\.|top\.|document\.)?location(?:\.href)?\s*=\s*["'`](.*?)["'`]/gi,
                /window\.open\s*\(\s*["'`](.*?)["'`]\s*(,.*?)?\)/gi,
            ];
            
            for (const pattern of redirectPatterns) {
                data = data.replace(pattern, (...args) => {
                    let link = args[1];
                    let extra = args[2] || '';
                    try {
                        const target = new URL(link || '.', baseUrl).toString();
                        const proxied = `/API/index.js?url=${encodeURIComponent(target)}`;
                        if (pattern.source.startsWith("window.open")) {
                            return `window.open('${proxied}'${extra})`;
                        } else {
                            return `window.location = '${proxied}'`;
                        }
                    } catch (e) {
                        return args[0];
                    }
                });
            }

            data = data.replace(/<\/body>/i, `
                <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
                <script>eruda.init();</script>
            </body>`);

            data = data.replace(/(--background-image\s*:\s*url\(["']?)([^"')]+)(["']?\))/g, (match, prefix, url, suffix) => {
                if (url.startsWith('http')) return match;
                const proxiedUrl = `/API/index.js?url=${encodeURIComponent(url)}`;
                return `${prefix}${proxiedUrl}${suffix}`;
            });

            data = data.replace(/url\(["']?(?!data:|http|\/\/)([^"')]+)["']?\)/gi, (match, relativePath) => {
                const absolute = new URL(relativePath, baseUrl).toString();
                const proxied = `/API/index.js?url=${encodeURIComponent(absolute)}`;
                return `url('${proxied}')`;
            });

            data = data.replace(/<iframe\s+[^>]*src=["'](.*?)["'][^>]*>/gi, (match, link) => {
                try {
                    const target = new URL(link || '.', baseUrl).toString();
                    const proxied = `/API/index.js?url=${encodeURIComponent(target)}`;
                    return match.replace(link, proxied);
                } catch (e) {
                    return match;
                }
            });
        }

        if (url.includes('google.com/search')) {
            data = `
                <body>
                <script>
                    alert('If you are searching Google, it will have from 3-30 or more attempts before it searches properly');
                    
                    window.location.href = '/API/google/index.js?url=' + encodeURIComponent('${url}');
                </script>
                </body>
            `;
        }

        return res.status(response.status).send(data);

    } catch (err) {
        console.error(`Proxy Error: ${err.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${err.message}</p>`);
    }
}
