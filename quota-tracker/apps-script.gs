// ============================================================
// Roll Call — Apps Script backend
// Paste this whole file into Extensions > Apps Script in your
// Google Sheet, then deploy as a Web App (see README.md).
// ============================================================

const SHEET_NAME = "Data";
const HEADERS = ["Timestamp", "Date", "Time", "Bunk", "Name", "Pushups", "Situps", "Squats", "Run"];
const TIMEZONE = "Asia/Singapore"; // GMT+8, used for the Date/Time columns

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

// Pulls just the numeric portion out of a distance string like "5", "5 km",
// or "5km" and returns it as "5km" (no space).
function formatDistance_(distance) {
  var match = String(distance).match(/(\d+(\.\d+)?)/);
  if (!match) return distance; // fallback: couldn't find a number, leave as typed
  return match[1] + "km";
}

// Formats the "runs" array from the form into the required string:
// "0" if no runs, "type value" if exactly one, otherwise
// "(type value) + (type value) + ..."
function formatRuns_(runs) {
  if (!runs || !runs.length) return "0";

  const parts = [];
  runs.forEach(function (r) {
    if (!r.type || r.type === "No run") return;
    var entry;
    if (r.type === "Intervals") {
      entry = r.type + " " + r.sets + " x " + r.reps;
    } else {
      entry = r.type + " " + formatDistance_(r.distance);
    }
    parts.push(entry);
  });

  if (parts.length === 0) return "0";
  if (parts.length === 1) return parts[0];
  return parts.map(function (p) { return "(" + p + ")"; }).join(" + ");
}

function doPost(e) {
  const sheet = getOrCreateSheet_();
  const data = JSON.parse(e.postData.contents);

  const now = new Date();
  const dateStr = Utilities.formatDate(now, TIMEZONE, "dd/MM/yyyy");
  const timeStr = Utilities.formatDate(now, TIMEZONE, "HH:mm:ss");

  const runString = formatRuns_(data.runs);

  sheet.appendRow([
    now,
    dateStr,
    timeStr,
    data.bunk,
    data.name,
    data.pushups,
    data.situps,
    data.squats,
    runString,
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const sheet = getOrCreateSheet_();
  const dateFilter = e.parameter.date; // expected format dd/MM/yyyy

  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1); // drop header row

  const result = rows
    .filter(function (row) { return !dateFilter || row[1] === dateFilter; })
    .map(function (row) {
      return {
        date: row[1],
        time: row[2],
        bunk: row[3],
        name: row[4],
        pushups: row[5],
        situps: row[6],
        squats: row[7],
        run: row[8],
      };
    });

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
