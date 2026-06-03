import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

/**
 * Extracts and decodes the error message from Google Apps Script HTML error pages.
 */
function cleanAppsScriptErrorMessage(responseText: string): string {
  if (responseText.trim().startsWith("<") || responseText.includes("<!DOCTYPE") || responseText.includes("<html")) {
    const match = responseText.match(/class=["']errorMessage["'][^>]*>([\s\S]*?)<\/div>/i) ||
                  responseText.match(/<div[^>]*id=["']error-message["'][^>]*>([\s\S]*?)<\/div>/i) ||
                  responseText.match(/<title>([\s\S]*?)<\/title>/i) ||
                  responseText.match(/<body>([\s\S]*?)<\/body>/i);
    if (match && match[1]) {
      let errStr = match[1].replace(/<[^>]*>/g, "").trim();
      // Unescape basic HTML entities
      errStr = errStr
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      return `Apps Script runtime error: "${errStr}". To fix this, copy the corrected code.js (without active addHeader/CORS functions) from this workspace and redeploy it in Google Sheets.`;
    }
    return `Google Apps Script returned an HTML error page. To resolve this, copy the corrected code.js from this workspace, replace your script sheets, and deploy a New Web App Deployment with Anyone access.`;
  }
  return `Failed to parse response as JSON. Output received: ${responseText.substring(0, 180)}...`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON payloads
  app.use(express.json());

  // Proxy API for reading all spreadsheet data (doGet proxy)
  app.get("/api/sheets", async (req, res) => {
    try {
      const scriptUrl = req.query.url as string;
      if (!scriptUrl) {
        return res.status(400).json({ status: "error", message: "Missing Google Sheets Apps Script URL." });
      }

      console.log(`[Proxy GET] Forwarding request to: ${scriptUrl}`);
      const response = await fetch(scriptUrl, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Google Sheets script returned non-200 status: ${response.status}`);
      }

      const responseText = await response.text();
      let responseJson;
      try {
        responseJson = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(cleanAppsScriptErrorMessage(responseText));
      }

      return res.json(responseJson);
    } catch (err: any) {
      console.error("[Proxy GET Error]:", err.message);
      return res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Proxy API for modifying data (doPost proxy)
  app.post("/api/sheets", async (req, res) => {
    try {
      const { url, data: bodyData } = req.body;
      if (!url) {
        return res.status(400).json({ status: "error", message: "Missing Google Sheets Apps Script URL." });
      }

      console.log(`[Proxy POST] Forwarding action: ${bodyData?.action} to: ${url}`);
      
      let currentUrl = url;
      let response = await fetch(currentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(bodyData),
        redirect: "manual"
      });

      // Google Apps Script usually returns 301, 302, 303, 307 or 308 for redirections
      let redirectCount = 0;
      const MAX_REDIRECTS = 5;
      while (
        (response.status === 301 || response.status === 302 || response.status === 303 || response.status === 307 || response.status === 308) &&
        redirectCount < MAX_REDIRECTS
      ) {
        const redirectUrl = response.headers.get("location");
        if (!redirectUrl) {
          break;
        }
        
        console.log(`[Proxy POST] Redirecting (${response.status}) to: ${redirectUrl}`);
        currentUrl = redirectUrl;
        redirectCount++;

        response = await fetch(currentUrl, {
          method: "GET",
          redirect: "manual"
        });
      }

      if (!response.ok) {
        throw new Error(`Google Sheets script returned non-200 status: ${response.status}`);
      }

      const responseText = await response.text();
      let responseJson;
      try {
        responseJson = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(cleanAppsScriptErrorMessage(responseText));
      }

      return res.json(responseJson);
    } catch (err: any) {
      console.error("[Proxy POST Error]:", err.message);
      return res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Development VS Production middleware settings
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Loaded Vite Dev Middleware for HMR/Hot reloading replacement");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("[Server] Serving production static files from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Sheets Personal Vault proxy running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
