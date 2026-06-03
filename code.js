/**
 * Google Apps Script for "Sheets Personal Vault Manager"
 * 
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 1. Open your Google Spreadsheet (e.g., rename it or create a new one).
 * 2. Click on "Extensions" > "Apps Script" in the top menu.
 * 3. Delete any existing code in the editor and PASTE this entire script.
 * 4. Click the "Save" (disk) icon.
 * 5. Click the "Deploy" button in the top right corner > select "New deployment".
 * 6. Click the gear icon next to "Select type" and choose "Web app".
 * 7. Change "Who has access" to "Anyone" (this is CRITICAL for your React app to connect without CORS issues).
 * 8. Click "Deploy".
 * 9. Copy the "Web app URL" provided in the dialog. It looks like:
 *    https://script.google.com/macros/s/AKfycb.../exec
 * 10. Open '/src/config.ts' in this React project and paste your URL into the 'GOOGLE_SHEETS_SCRIPT_URL' variable.
 */

// Define the precise columns required for each database/sheet
var CONFIG = {
  sheets: {
    "PersonalData": ["Name", "DOB", "AdharNumber", "PanNumber", "DrivingLicence", "MobileNumber", "AlternateMobileNumber", "EmailID", "Photo"],
    "FinancialData": ["AccountHolderName", "AccountType", "BankName", "AccountNumber", "IFSC", "UserID", "Password", "LinkedMobileNumber", "LinkedEmail", "SecurityAnswers"],
    "Card": ["CardType", "IssuedBank", "CardNumber", "Expiry", "CVV", "PIN", "CardHolderName"],
    "Media/Gmail": ["Particulars", "Userid", "Password", "MobileNumber"],
    "Others": ["Particulars", "Userid", "Password", "MobileNumber", "Remarks"]
  }
};

/**
 * Handle GET requests - Fetches all records from all sheets.
 * Automatically configures missing sheets and adds headers.
 */
function doGet(e) {
  try {
    var result = readAllSheetsData();
    var output = ContentService.createTextOutput(JSON.stringify({ status: "success", data: result }))
      .setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (error) {
    var errorOutput = ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
    return errorOutput;
  }
}

/**
 * Handle POST requests - Adds, updates, or deletes records.
 * We use text/plain POST content to avoid pre-flight CORS preflight checks in browsers.
 */
function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);
    
    var action = payload.action; // "add", "update", "delete"
    var sheetName = payload.sheetName;
    var data = payload.data;
    var rowNum = payload.rowNum; // 2-indexed row number from the sheet
    
    var ss = getOrCreateSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    var headers = CONFIG.sheets[sheetName];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
    }
    
    if (action === "add") {
      var newRow = [];
      for (var i = 0; i < headers.length; i++) {
        var key = headers[i];
        newRow.push(data[key] !== undefined ? data[key] : "");
      }
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Record successfully appended to " + sheetName 
      })).setMimeType(ContentService.MimeType.JSON);
        
    } else if (action === "update") {
      if (!rowNum || rowNum < 2) {
        throw new Error("Invalid or missing row number: " + rowNum);
      }
      var range = sheet.getRange(rowNum, 1, 1, headers.length);
      var values = [];
      for (var i = 0; i < headers.length; i++) {
        var key = headers[i];
        values.push(data[key] !== undefined ? data[key] : "");
      }
      range.setValues([values]);
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Record successfully updated in " + sheetName 
      })).setMimeType(ContentService.MimeType.JSON);
        
    } else if (action === "delete") {
      if (!rowNum || rowNum < 2) {
        throw new Error("Invalid or missing row number for delete: " + rowNum);
      }
      sheet.deleteRow(rowNum);
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Record successfully deleted from " + sheetName 
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else {
      throw new Error("Unknown action requested: " + action);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Returns all rows from all defined categories, auto-creating sheets with header columns if they do not exist yet.
 */
function readAllSheetsData() {
  var ss = getOrCreateSpreadsheet();
  var result = {};
  
  for (var sheetName in CONFIG.sheets) {
    var sheet = ss.getSheetByName(sheetName);
    var headers = CONFIG.sheets[sheetName];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
    }
    
    var dataRange = sheet.getDataRange();
    var rows = dataRange.getValues();
    
    if (rows.length <= 1) {
      result[sheetName] = [];
      continue;
    }
    
    var dataList = [];
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      var record = { _rowNum: i + 1 }; // Track exact row number (Header is Row 1)
      
      for (var j = 0; j < headers.length; j++) {
        var val = row[j];
        if (val instanceof Date) {
          // Format date strings as YYYY-MM-DD
          try {
            var tz = ss.getSpreadsheetTimeZone();
            record[headers[j]] = Utilities.formatDate(val, tz, "yyyy-MM-dd");
          } catch(e) {
            record[headers[j]] = val.toISOString().slice(0, 10);
          }
        } else {
          record[headers[j]] = val !== undefined ? val.toString() : "";
        }
      }
      dataList.push(record);
    }
    result[sheetName] = dataList;
  }
  return result;
}

/**
 * Retained for backward-compatibility if referenced. Returns the output object directly.
 */
function disableCors(output) {
  return output;
}

/**
 * Returns the active container spreadsheet, or automatically retrieves/creates a
 * standalone spreadsheet named 'Sheets Personal Vault' under the user's account properties.
 */
function getOrCreateSpreadsheet() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}

  var properties = PropertiesService.getScriptProperties();
  var savedId = properties.getProperty("SPREADSHEET_ID");
  if (savedId) {
    try {
      ss = SpreadsheetApp.openById(savedId);
      if (ss) return ss;
    } catch(e) {}
  }

  // Create a new spreadsheet
  ss = SpreadsheetApp.create("Sheets Personal Vault");
  properties.setProperty("SPREADSHEET_ID", ss.getId());
  return ss;
}
