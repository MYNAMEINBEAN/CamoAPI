const puppeteer = require('puppeteer-core');
const chrome = require('chrome-aws-lambda');
const axios = require('axios');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: 'No URL provided' });
    return;
  }

  try {
    // Launch the Puppeteer browser with the compatible chromium version from chrome-aws-lambda
    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: 'domcontentloaded', // You can also use 'load' or 'networkidle0'
    });

    // Optionally, you can take a screenshot, scrape content, or extract specific data
    // const screenshot = await page.screenshot();

    // Get the rendered HTML content
    const htmlContent = await page.content(); 

    await browser.close();

    // Return the rendered HTML content as the response
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
};
