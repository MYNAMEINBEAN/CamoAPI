import puppeteer from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';

export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).send('URL parameter is missing.');
        
        const browser = await puppeteer.launch({
            executablePath: await chrome.executablePath,
            headless: chrome.headless,
            args: chrome.args,
            defaultViewport: chrome.defaultViewport,
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const content = await page.content(); // Get the HTML content of the page
        await browser.close();

        return res.status(200).send(content);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error while fetching content.');
    }
}
