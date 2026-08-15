// ============================================================
// Data Entries — week/day filtering + fetch from Google Sheet
// ============================================================

const FIRST_WEEK = 7;
const LAST_WEEK = 14;
const BASE_MONDAY = new Date(2026, 7, 17); // 17/08/2026, Monday of week 7 (month is 0-indexed: 7 = August)
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu"];

const weekSelect = document.getElementById("week-select");
const dateSelect = document.getElementById("date-select");
const table = document.getElementById("data-table");
const tbody = document.getElementById("data-tbody");
const tableState = document.getElementById("table-state");

function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getWeekDates(week) {
  const mondayOffset = (week - FIRST_WEEK) * 7;
  const dates = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(BASE_MONDAY);
    d.setDate(d.getDate() + mondayOffset + i);
    dates.push({ label: `${WEEKDAY_LABELS[i]} ${formatDate(d)}`, value: formatDate(d) });
  }
  return dates;
}

// populate week dropdown
for (let w = FIRST_WEEK; w <= LAST_WEEK; w++) {
  const opt = document.createElement("option");
  opt.value = w;
  opt.textContent = `Week ${w}`;
  weekSelect.appendChild(opt);
}

weekSelect.addEventListener("change", () => {
  const week = Number(weekSelect.value);
  const dates = getWeekDates(week);

  dateSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = "Select day";
  dateSelect.appendChild(placeholder);

  dates.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.value;
    opt.textContent = d.label;
    dateSelect.appendChild(opt);
  });

  dateSelect.disabled = false;
  resetTable("Select a day to view entries.");
});

dateSelect.addEventListener("change", () => {
  if (dateSelect.value) {
    loadEntries(dateSelect.value);
  }
});

function resetTable(message) {
  table.style.display = "none";
  tableState.style.display = "block";
  tableState.textContent = message;
}

async function loadEntries(dateStr) {
  resetTable("Loading entries...");
  tableState.className = "loading-state";

  if (!API_URL || API_URL === "PASTE_YOUR_WEB_APP_URL_HERE") {
    resetTable("Not connected yet — paste your Apps Script Web App URL into config.js (see README).");
    tableState.className = "empty-state";
    return;
  }

  try {
    const res = await fetch(`${API_URL}?date=${encodeURIComponent(dateStr)}`);
    const rows = await res.json();

    if (!rows || rows.length === 0) {
      resetTable(`No entries logged for ${dateStr} yet.`);
      tableState.className = "empty-state";
      return;
    }

    rows.sort((a, b) => Number(a.bunk) - Number(b.bunk));

    tbody.innerHTML = rows
      .map(
        (r) => `
        <tr>
          <td><span class="bunk-badge">${r.bunk}</span></td>
          <td>${escapeHtml(r.name)}</td>
          <td>${r.pushups}</td>
          <td>${r.situps}</td>
          <td>${r.squats}</td>
          <td>${escapeHtml(String(r.run))}</td>
        </tr>`
      )
      .join("");

    table.style.display = "table";
    tableState.style.display = "none";
  } catch (err) {
    resetTable("Couldn't load entries. Check your connection and that the Sheet is shared correctly.");
    tableState.className = "empty-state";
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
