import chrome from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath || "/usr/bin/chromium-browser",
      headless: chrome.headless,
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

    const title = await page.title();

    res.status(200).json({ title });
  } catch (error) {
    // Log the error on the server side for debugging
    console.error("Error fetching content:", error.message || error);

    // Send a response with a more descriptive error message
    res.status(500).json({
      error: "Failed to fetch content from the provided URL.",
      details: error.message || String(error)
    });
  } finally {
    if (browser) await browser.close();
  }
}
