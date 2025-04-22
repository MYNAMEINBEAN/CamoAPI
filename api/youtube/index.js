import puppeteer from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';

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
        // Initialize puppeteer with chrome-aws-lambda
        const browser = await puppeteer.launch({
            args: chrome.args,
            defaultViewport: chrome.defaultViewport,
            executablePath: await chrome.executablePath,
            headless: true,
        });

        const page = await browser.newPage();
        
        // Set headers to avoid detection as a bot
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Visit the URL
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Get content
        const content = await page.content();

        // Close browser
        await browser.close();

        // Send content as the response
        return res.status(200).send(content);

    } catch (err) {
        console.error(`Error fetching content: ${err.message}`);
        return res.status(500).send(`Error fetching content: ${err.message}`);
    }
}
