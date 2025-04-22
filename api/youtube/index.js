const axios = require('axios');

module.exports = async (req, res) => {
  // Get the URL parameter from the query string
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    // Fetch the content from the provided URL
    const response = await axios.get(url);

    // Return the content back to the user
    res.status(200).json({
      data: response.data
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ error: "Failed to fetch content." });
  }
};
