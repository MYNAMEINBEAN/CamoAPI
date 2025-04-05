import axios from 'axios';
import https from 'https';

export default async function proxyImageHandler(req, res) {
    let { url } = req.query;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    try {
        // Decode and clean the URL
        url = decodeURIComponent(url);
        console.log(`Proxying image: ${url}`);

        const agent = new https.Agent({ rejectUnauthorized: false });

        // Fetch image data as an arraybuffer (binary format)
        const response = await axios.get(url, {
            httpsAgent: agent,
            responseType: 'arraybuffer', // Ensure we handle image data as binary
            timeout: 30000, // Timeout if the request takes too long
        });

        const contentType = response.headers["content-type"] || "application/octet-stream";

        // Set the correct content type (image/png, image/jpeg, etc.)
        res.setHeader("Content-Type", contentType);
        res.setHeader("Access-Control-Allow-Origin", "*"); // For cross-origin access if needed

        // Send the image back as binary data
        res.status(response.status).send(Buffer.from(response.data)); // Return image as binary

    } catch (error) {
        console.error(`Error fetching image: ${error.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${error.message}</p>`);
    }
}
