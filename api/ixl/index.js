import axios from 'axios';
import { JSDOM } from 'jsdom';

const BASE_URL = 'https://www.ixl.com';

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const path = '/' + slug.join('/');

  try {
    const response = await axios.get(BASE_URL + path);
    const contentType = response.headers['content-type'];

    // If it's not HTML, return as-is
    if (!contentType.includes('text/html')) {
      res.setHeader('Content-Type', contentType);
      return res.send(response.data);
    }

    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // Fix all relative URLs
    const attributesToFix = ['src', 'href', 'action', 'srcset', 'data-src'];

    attributesToFix.forEach(attr => {
      const elements = document.querySelectorAll(`[${attr}]`);
      elements.forEach(el => {
        const val = el.getAttribute(attr);
        if (
          val &&
          !val.startsWith('http') &&
          !val.startsWith('//') &&
          !val.startsWith('data:')
        ) {
          const newVal = BASE_URL + (val.startsWith('/') ? val : '/' + val);
          el.setAttribute(attr, newVal);
        }
      });
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(dom.serialize());

  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching IXL page');
  }
}
