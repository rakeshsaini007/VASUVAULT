import express from "express";

const app = express();

app.use(express.json());

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

// Proxy API for reading all spreadsheet data (doGet proxy)
app.get("/api/sheets", async (req, res) => {
  try {
    const scriptUrl = req.query.url as string;
    if (!scriptUrl) {
      return res.status(400).json({ status: "error", message: "Missing Google Sheets Apps Script URL." });
    }

    console.log(`[Vercel Serverless Proxy GET] Forwarding request to: ${scriptUrl}`);
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
    console.error("[Vercel Serverless Proxy GET Error]:", err.message);
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

    console.log(`[Vercel Serverless Proxy POST] Forwarding action: ${bodyData?.action} to: ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(bodyData)
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
    console.error("[Vercel Serverless Proxy POST Error]:", err.message);
    return res.status(500).json({ status: "error", message: err.message });
  }
});

export default app;
