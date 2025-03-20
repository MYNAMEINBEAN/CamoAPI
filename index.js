const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
app.use(cors());

app.use("/:category", (req, res, next) => {
    const targetUrl = req.query.url; // Extract the URL from the query parameter

    if (!targetUrl) {
        return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    const proxy = createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        onProxyReq: (proxyReq) => {
            proxyReq.setHeader("Origin", ""); // Remove origin header if needed
        },
    });

    return proxy(req, res, next);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`CORS Proxy running on port ${PORT}`);
});
