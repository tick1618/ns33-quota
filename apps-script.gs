const TIMEZONE = "Asia/Singapore"; // GMT+8, fixed offset, no DST

const DAILY_SHEET_NAME = "Data";
const DAILY_HEADERS = ["Timestamp", "Date", "Time", "Bunk", "Name", "Pushups", "Situps", "Squats", "Run"];

const WEEKLY_SHEET_NAME = "WeeklyRunQuota";
const WEEKLY_HEADERS = ["Timestamp", "Week", "Bunk", "Name", "Distance"];

// Monday 00:00 SGT of week 7 = 17 Aug 2026. Every later week is +7 days.
const WEEK_7_MONDAY_UTC_MILLIS = Date.UTC(2026, 7, 17, 0, 0, 0);

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sheet;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Pulls just the numeric portion out of a distance string like "5", "5 km",
// or "5km" and returns it as "5km" (no space).
function formatDistance_(distance) {
  const match = String(distance).match(/(\d+(\.\d+)?)/);
  if (!match) return distance; // fallback: couldn't find a number, leave as typed
  return match[1] + "km";
}

// Formats the "runs" array from the daily form into the required string:
// "0" if no runs, "type value" if exactly one, otherwise
// "(type value) + (type value) + ..."
function formatRuns_(runs) {
  if (!runs || !runs.length) return "0";

  const parts = [];
  runs.forEach(function (r) {
    if (!r.type || r.type === "No run") return;
    let entry;
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

// Buckets a submission time into a week number (7, 8, 9, ...) based on
// Singapore wall-clock time. A submission counts toward week N if it lands
// on or after Monday 00:00 SGT of week N and before Monday 00:00 SGT of
// week N+1.
function computeWeek_(date) {
  const sgtMillis = date.getTime() + 8 * 60 * 60 * 1000; // shift UTC instant to SGT wall-clock
  const diffDays = Math.floor((sgtMillis - WEEK_7_MONDAY_UTC_MILLIS) / 86400000);
  return 7 + Math.floor(diffDays / 7);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (data.formType === "weekly") {
    return postWeekly_(data);
  }
  return postDaily_(data);
}

function postDaily_(data) {
  const sheet = getOrCreateSheet_(DAILY_SHEET_NAME, DAILY_HEADERS);
  const now = new Date();
  const dateStr = Utilities.formatDate(now, TIMEZONE, "dd/MM/yyyy");
  const timeStr = Utilities.formatDate(now, TIMEZONE, "HH:mm:ss");
  const runString = formatRuns_(data.runs);

  sheet.appendRow([now, dateStr, timeStr, data.bunk, data.name, data.pushups, data.situps, data.squats, runString]);

  return jsonOutput_({ status: "ok" });
}

function postWeekly_(data) {
  const sheet = getOrCreateSheet_(WEEKLY_SHEET_NAME, WEEKLY_HEADERS);
  const now = new Date();
  const week = computeWeek_(now);
  const distance = formatDistance_(data.distance);

  sheet.appendRow([now, week, data.bunk, data.name, distance]);

  return jsonOutput_({ status: "ok" });
}

function doGet(e) {
  const formType = e.parameter.formType || "daily";
  if (formType === "weekly") {
    return getWeeklyEntries_(e);
  }
  return getDailyEntries_(e);
}

function getDailyEntries_(e) {
  const sheet = getOrCreateSheet_(DAILY_SHEET_NAME, DAILY_HEADERS);
  const dateFilter = e.parameter.date; // expected format dd/MM/yyyy

  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1); // drop header row

  const filtered = rows.filter(function (row) { return !dateFilter || row[1] === dateFilter; });

  // Keep only the most recent submission per bunk+name, in case someone
  // submitted more than once on the same day.
  const latestByPerson = {};
  filtered.forEach(function (row) {
    const key = row[3] + "|" + row[4]; // bunk|name
    const timestamp = row[0] instanceof Date ? row[0].getTime() : new Date(row[0]).getTime();
    if (!latestByPerson[key] || timestamp > latestByPerson[key].timestamp) {
      latestByPerson[key] = { row: row, timestamp: timestamp };
    }
  });

  const result = Object.keys(latestByPerson).map(function (key) {
    const row = latestByPerson[key].row;
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

  return jsonOutput_(result);
}

function getWeeklyEntries_(e) {
  const sheet = getOrCreateSheet_(WEEKLY_SHEET_NAME, WEEKLY_HEADERS);
  const weekFilter = e.parameter.week ? Number(e.parameter.week) : null;

  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1); // drop header row

  const result = rows
    .filter(function (row) { return !weekFilter || Number(row[1]) === weekFilter; })
    .map(function (row) {
      return {
        week: row[1],
        bunk: row[2],
        name: row[3],
        distance: row[4],
      };
    });

  return jsonOutput_(result);
}