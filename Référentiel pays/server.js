const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.TRAINING_CATALOG_PORT || 8787);
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_PATH = path.join(__dirname, "data", "country-risk-catalog.json");

function readDataset() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch (error) {
    return {
      version: 1,
      updatedAt: null,
      hero: {},
      sourceDates: {},
      guide: {},
      countries: [],
      error: error && error.message ? error.message : "Lecture impossible"
    };
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
  }[ext] || "application/octet-stream";
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, error.code === "ENOENT" ? 404 : 500, { error: "Fichier introuvable." });
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentTypeFor(filePath),
      "Cache-Control": "no-store"
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "country-risk-demo", dataFile: DATA_PATH });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/countries") {
    sendJson(res, 200, readDataset());
    return;
  }

  if (req.method === "GET") {
    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const safePath = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(PUBLIC_DIR, safePath);
    if (filePath.startsWith(PUBLIC_DIR)) {
      sendFile(res, filePath);
      return;
    }
  }

  sendJson(res, 404, { error: "Route inconnue." });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Country risk demo running on http://127.0.0.1:${PORT}`);
  console.log(`Data file: ${DATA_PATH}`);
});
