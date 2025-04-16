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

            data = data.replace('loading="lazy"', 'loading="eager"');

            // Inject Eruda for debugging
            data = data.replace(/<\/body>/i, `
                <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
                <script>eruda.init();</script>
            </body>`);
        }

        data = data.replace(/ /g, '%20')
           .replace(/!/g, '%21')
           .replace(/"/g, '%22')
           .replace(/#/g, '%23')
           .replace(/\$/g, '%24')
           .replace(/%/g, '%25')
           .replace(/&/g, '%26')
           .replace(/'/g, '%27')
           .replace(/\(/g, '%28')
           .replace(/\)/g, '%29')
           .replace(/\*/g, '%2A')
           .replace(/\+/g, '%2B')
           .replace(/,/g, '%2C')
           .replace(/-/g, '%2D')
           .replace(/\./g, '%2E')
           .replace(/\//g, '%2F')
           .replace(/0/g, '%30')
           .replace(/1/g, '%31')
           .replace(/2/g, '%32')
           .replace(/3/g, '%33')
           .replace(/4/g, '%34')
           .replace(/5/g, '%35')
           .replace(/6/g, '%36')
           .replace(/7/g, '%37')
           .replace(/8/g, '%38')
           .replace(/9/g, '%39')
           .replace(/:/g, '%3A')
           .replace(/;/g, '%3B')
           .replace(/</g, '%3C')
           .replace(/=/g, '%3D')
           .replace(/>/g, '%3E')
           .replace(/\?/g, '%3F')
           .replace(/@/g, '%40')
           .replace(/A/g, '%41')
           .replace(/B/g, '%42')
           .replace(/C/g, '%43')
           .replace(/D/g, '%44')
           .replace(/E/g, '%45')
           .replace(/F/g, '%46')
           .replace(/G/g, '%47')
           .replace(/H/g, '%48')
           .replace(/I/g, '%49')
           .replace(/J/g, '%4A')
           .replace(/K/g, '%4B')
           .replace(/L/g, '%4C')
           .replace(/M/g, '%4D')
           .replace(/N/g, '%4E')
           .replace(/O/g, '%4F')
           .replace(/P/g, '%50')
           .replace(/Q/g, '%51')
           .replace(/R/g, '%52')
           .replace(/S/g, '%53')
           .replace(/T/g, '%54')
           .replace(/U/g, '%55')
           .replace(/V/g, '%56')
           .replace(/W/g, '%57')
           .replace(/X/g, '%58')
           .replace(/Y/g, '%59')
           .replace(/Z/g, '%5A')
           .replace(/\[/g, '%5B')
           .replace(/\\/g, '%5C')
           .replace(/\]/g, '%5D')
           .replace(/\^/g, '%5E')
           .replace(/_/g, '%5F')
           .replace(/`/g, '%60')
           .replace(/a/g, '%61')
           .replace(/b/g, '%62')
           .replace(/c/g, '%63')
           .replace(/d/g, '%64')
           .replace(/e/g, '%65')
           .replace(/f/g, '%66')
           .replace(/g/g, '%67')
           .replace(/h/g, '%68')
           .replace(/i/g, '%69')
           .replace(/j/g, '%6A')
           .replace(/k/g, '%6B')
           .replace(/l/g, '%6C')
           .replace(/m/g, '%6D')
           .replace(/n/g, '%6E')
           .replace(/o/g, '%6F')
           .replace(/p/g, '%70')
           .replace(/q/g, '%71')
           .replace(/r/g, '%72')
           .replace(/s/g, '%73')
           .replace(/t/g, '%74')
           .replace(/u/g, '%75')
           .replace(/v/g, '%76')
           .replace(/w/g, '%77')
           .replace(/x/g, '%78')
           .replace(/y/g, '%79')
           .replace(/z/g, '%7A')
           .replace(/{/g, '%7B')
           .replace(/\|/g, '%7C')
           .replace(/}/g, '%7D')
           .replace(/~/g, '%7E');
        
        return res.status(response.status).send(data);

    } catch (err) {
        console.error(`Proxy Error: ${err.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${err.message}</p>`);
    }
}
