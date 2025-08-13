// server.js
const express = require("express");
const { scraper } = require("./scraper");

const app = express();
const PORT = 3232;

// Middleware to parse JSON bodies
app.use(express.json());

// Optional: add basic logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Scrape endpoint
app.post("/scrape/:service", async (req, res) => {
  console.log("req.params", req.params);
  console.log("req.body", req.body);

  const { username, password, dateFrom, dataTo } = req.body;
  const { service } = req.params;

  if (!service || !username || !password) {
    return res.status(403).json({
      status: "error",
      message: "Forbidden",
    });
  }

  try {
    const result = await scraper(service, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Playwright Scraper is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
