import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        // Decode the URL once to avoid double decoding issues
        url = decodeURIComponent(url);

        // Ensure there are no encoded characters like %2F or %3A
        url = url.replace(/%3A/g, ':').replace(/%2F/g, '/');
        console.log(`Decoded and clean URL: ${url}`); // Log for debugging

        const agent = new https.Agent({ rejectUnauthorized: false });

        // Make the HTTP request to fetch the page
        const response = await axios.get(url, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Referer': url,
            },
            httpsAgent: agent,
            responseType: 'arraybuffer', // Handle binary content like images and JS
            maxRedirects: 0, // Stop following redirects
            validateStatus: (status) => status < 400 || status === 301 || status === 302,
        });

        // Log the response status and headers to check what's returned
        console.log(`Response Status: ${response.status}`);
        console.log(`Response Headers: ${JSON.stringify(response.headers)}`);

        // Handle Redirections (301/302)
        if (response.status === 301 || response.status === 302) {
            let redirectUrl = response.headers.location;
            
            if (redirectUrl.startsWith('/')) {
                redirectUrl = new URL(redirectUrl, url).href;
            }

            console.log(`Redirecting to: ${redirectUrl}`);

            // Rewrite the redirect URL to stay within the proxy
            return res.redirect(`/api/index.js?url=${encodeURIComponent(redirectUrl)}`);
        }

        // If the response was successful, handle the content
        let body = response.data.toString('utf-8');
        console.log(`Body Content: ${body.substring(0, 200)}`); // Log a portion of the body for debugging

        // Send the body back to the client
        res.setHeader("Content-Type", response.headers["content-type"] || "text/html");
        res.send(body);

    } catch (error) {
        console.error(`Error fetching the URL: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
