import chrome from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL' });
  }

  let browser = null;

  try {
    const executablePath = await chrome.executablePath || '/usr/bin/chromium-browser';

    browser = await puppeteer.launch({
      args: chrome.args,
      executablePath,
      headless: chrome.headless,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const content = await page.content();

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(content);
  } catch (err) {
    console.error('Error fetching content:', err.message);
    res.status(500).json({ error: 'Error fetching content', details: err.message });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
