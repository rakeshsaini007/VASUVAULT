/**
 * Data Service to handle either live Google Sheets calls
 * or fallback to Local Browser Storage (offline simulation).
 */

import { GOOGLE_SHEETS_SCRIPT_URL, isValidAppsScriptUrl } from "../config";
import { INITIAL_SIMULATED_DATA } from "../types";

const LOCAL_STORAGE_KEY = "vault_manager_simulated_data";
const USER_API_URL_KEY = "vault_user_google_script_url";

/**
 * Get the current active URL being used for Google Sheets.
 * Prioritizes user input in the UI, then the hardcoded config value.
 */
export function getActiveScriptUrl(): string {
  const uiUrl = localStorage.getItem(USER_API_URL_KEY);
  if (uiUrl && isValidAppsScriptUrl(uiUrl)) {
    return uiUrl.trim();
  }
  return GOOGLE_SHEETS_SCRIPT_URL.trim();
}

/**
 * Set the script URL directly from the front-end interface.
 */
export function setActiveScriptUrl(url: string) {
  if (url) {
    localStorage.setItem(USER_API_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(USER_API_URL_KEY);
  }
}

/**
 * Initialize simulated local data if it does not exist yet.
 */
function getSimulatedData(): Record<string, any[]> {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SIMULATED_DATA));
    return INITIAL_SIMULATED_DATA;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_SIMULATED_DATA;
  }
}

/**
 * Persist simulated local data.
 */
function saveSimulatedData(data: Record<string, any[]>) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Helper to extract more user-friendly error messages from backend responses.
 */
async function handleNonOkResponse(response: Response, fallbackMessage: string): Promise<never> {
  let message = fallbackMessage;
  try {
    const errorJson = await response.json();
    if (errorJson && errorJson.message) {
      message = errorJson.message;
    }
  } catch (e) {}
  throw new Error(message);
}

/**
 * Fetch all records for all sheets.
 * In live mode, requests doGet.
 */
export async function fetchAllData(): Promise<{
  isLive: boolean;
  data: Record<string, any[]>;
  error?: string;
}> {
  const url = getActiveScriptUrl();
  
  if (!isValidAppsScriptUrl(url)) {
    // Return simulated offline data
    return {
      isLive: false,
      data: getSimulatedData()
    };
  }

  try {
    const response = await fetch(`/api/sheets?url=${encodeURIComponent(url)}`, {
      method: "GET"
    });

    if (!response.ok) {
      await handleNonOkResponse(response, `HTTP network error! Status: ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson && resJson.status === "success") {
      return {
        isLive: true,
        data: resJson.data
      };
    } else {
      throw new Error(resJson?.message || "Google Script failed to return data successfully.");
    }
  } catch (err: any) {
    console.error("Fetch data error:", err);
    return {
      isLive: false,
      data: getSimulatedData(),
      error: `Failed connection to Google Sheet Web App: ${err.message}. Showing simulated local data instead.`
    };
  }
}

/**
 * Add a record.
 */
export async function addRecord(
  sheetName: string,
  recordData: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  const url = getActiveScriptUrl();

  if (!isValidAppsScriptUrl(url)) {
    // Simulated Offline Add
    const localData = getSimulatedData();
    if (!localData[sheetName]) {
      localData[sheetName] = [];
    }
    
    // Determine target _rowNum (starting from 2)
    const currentRows = localData[sheetName];
    const maxRow = currentRows.reduce((max, r) => Math.max(max, r._rowNum || 1), 1);
    const newRowNum = maxRow + 1;

    localData[sheetName].push({
      _rowNum: newRowNum,
      ...recordData
    });
    
    saveSimulatedData(localData);
    return { success: true, message: "Record simulated as added (Saved to local browser storage)." };
  }

  try {
    // Post to Google Apps script via the server proxy
    const response = await fetch("/api/sheets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        data: {
          action: "add",
          sheetName,
          data: recordData
        }
      })
    });

    if (!response.ok) {
      await handleNonOkResponse(response, `Server returned HTTP Error: ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson && resJson.status === "success") {
      return { success: true, message: resJson.message };
    } else {
      throw new Error(resJson?.message || "Failed appending spreadsheet row.");
    }
  } catch (err: any) {
    console.error("Action add error:", err);
    return { success: false, message: `Could not reach Google Sheets: ${err.message}` };
  }
}

/**
 * Update a record.
 */
export async function updateRecord(
  sheetName: string,
  rowNum: number,
  recordData: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  const url = getActiveScriptUrl();

  if (!isValidAppsScriptUrl(url)) {
    // Simulated Offline Edit
    const localData = getSimulatedData();
    if (localData[sheetName]) {
      const idx = localData[sheetName].findIndex(r => r._rowNum === rowNum);
      if (idx !== -1) {
        localData[sheetName][idx] = {
          ...localData[sheetName][idx],
          ...recordData
        };
        saveSimulatedData(localData);
        return { success: true, message: "Record simulated as updated." };
      }
    }
    return { success: false, message: "Record not found in local browser store." };
  }

  try {
    const response = await fetch("/api/sheets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        data: {
          action: "update",
          sheetName,
          rowNum,
          data: recordData
        }
      })
    });

    if (!response.ok) {
      await handleNonOkResponse(response, `Server returned HTTP Error: ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson && resJson.status === "success") {
      return { success: true, message: resJson.message };
    } else {
      throw new Error(resJson?.message || "Failed updating spreadsheet row.");
    }
  } catch (err: any) {
    console.error("Action update error:", err);
    return { success: false, message: `Could not reach Google Sheets: ${err.message}` };
  }
}

/**
 * Delete a record.
 */
export async function deleteRecord(
  sheetName: string,
  rowNum: number
): Promise<{ success: boolean; message: string }> {
  const url = getActiveScriptUrl();

  if (!isValidAppsScriptUrl(url)) {
    // Simulated Offline Delete
    const localData = getSimulatedData();
    if (localData[sheetName]) {
      localData[sheetName] = localData[sheetName].filter(r => r._rowNum !== rowNum);
      // Re-normalize row numbers for the simulator so index remains logical
      localData[sheetName] = localData[sheetName].map((item, idx) => ({
        ...item,
        _rowNum: idx + 2
      }));
      saveSimulatedData(localData);
      return { success: true, message: "Record simulated as deleted." };
    }
    return { success: false, message: "Record not found in local browser store." };
  }

  try {
    const response = await fetch("/api/sheets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        data: {
          action: "delete",
          sheetName,
          rowNum
        }
      })
    });

    if (!response.ok) {
      await handleNonOkResponse(response, `Server returned HTTP Error: ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson && resJson.status === "success") {
      return { success: true, message: resJson.message };
    } else {
      throw new Error(resJson?.message || "Failed deleting spreadsheet row.");
    }
  } catch (err: any) {
    console.error("Action delete error:", err);
    return { success: false, message: `Could not reach Google Sheets: ${err.message}` };
  }
}

/**
 * Helper to reset simulated state back to default
 */
export function resetSimulatedStorage() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SIMULATED_DATA));
}
