import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "No URL provided." });
    }

    try {
        url = decodeURIComponent(url);

        const agent = new https.Agent({ rejectUnauthorized: false }); // Ignore SSL issues

        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': url,
            },
            httpsAgent: agent, // Use custom HTTPS agent to ignore SSL verification
            responseType: 'stream',
            maxRedirects: 0, // Prevent following redirects
            validateStatus: (status) => status < 400 || status === 301 || status === 302, // Allow 301/302
        });

        if (response.status === 301 || response.status === 302) {
            const redirectUrl = response.headers.location;
            return res.status(response.status).json({ redirect: redirectUrl });
        }

        const contentType = response.headers['content-type'];
        if (contentType) res.setHeader("Content-Type", contentType);

        response.data.pipe(res);
    } catch (error) {
        console.error(`Error fetching the URL: ${error.message}`);
        return res.status(500).json({ error: `Error fetching the requested URL: ${error.message}` });
    }
}
