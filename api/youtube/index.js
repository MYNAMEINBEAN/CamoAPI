import puppeteer from 'puppeteer';

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
        console.log(`Proxying YouTube with Puppeteer: ${url}`);

        const browser = await puppeteer.launch({
            headless: true,  // Use headless mode for server-side rendering
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.setRequestInterception(true);

        // Intercept requests and manage headers for YouTube
        page.on('request', (request) => {
            if (request.resourceType() === 'image') {
                // Handle images if needed
                request.continue();
            } else if (request.resourceType() === 'script') {
                // Handle JavaScript files for YouTube-specific behavior
                request.continue();
            } else {
                request.continue();
            }
        });

        // Open the YouTube URL and wait for the page to load
        await page.goto(url, {
            waitUntil: 'domcontentloaded', // Wait until the initial HTML content is loaded
        });

        // You can also execute custom JS to manipulate the YouTube page if needed
        // For example, you could remove ads or make changes specific to YouTube
        // await page.evaluate(() => {
        //     // Remove elements related to ads, for example
        //     const ads = document.querySelectorAll('.ytp-ad-player-overlay');
        //     ads.forEach(ad => ad.remove());
        // });

        // Get the fully rendered HTML after JS execution
        const content = await page.content();
        await browser.close();

        // Set the appropriate headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", 'text/html');
        return res.status(200).send(content);
    } catch (err) {
        console.error(`Puppeteer Error: ${err.message}`);
        return res.status(500).send(`<h1>Proxy Error</h1><p>${err.message}</p>`);
    }
}
