// ============================================================
// Data Entries — log-type + week/day filtering, fetch from Sheet
// ============================================================

const FIRST_WEEK = 7;
const LAST_WEEK = 14;
const BASE_MONDAY = new Date(2026, 7, 17); // 17/08/2026, Monday of week 7
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu"];

const typeSelect = document.getElementById("type-select");
const weekSelect = document.getElementById("week-select");
const dateSelect = document.getElementById("date-select");
const dayField = document.getElementById("day-field");
const table = document.getElementById("data-table");
const tableHead = document.getElementById("table-head");
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

function resetTable(message) {
  table.style.display = "none";
  tableState.style.display = "block";
  tableState.className = "empty-state";
  tableState.textContent = message;
}

function populateWeekDropdown() {
  weekSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = "Select week";
  weekSelect.appendChild(placeholder);

  for (let w = FIRST_WEEK; w <= LAST_WEEK; w++) {
    const opt = document.createElement("option");
    opt.value = w;
    opt.textContent = `Week ${w}`;
    weekSelect.appendChild(opt);
  }
  weekSelect.disabled = false;
}

typeSelect.addEventListener("change", () => {
  const type = typeSelect.value;
  populateWeekDropdown();

  if (type === "weekly") {
    dayField.style.display = "none";
    dateSelect.disabled = true;
    resetTable("Select a week to view entries.");
  } else {
    dayField.style.display = "";
    dateSelect.innerHTML = '<option value="" disabled selected>Select week first</option>';
    dateSelect.disabled = true;
    resetTable("Select a week, then a day, to view entries.");
  }
});

weekSelect.addEventListener("change", () => {
  const type = typeSelect.value;
  const week = Number(weekSelect.value);

  if (type === "weekly") {
    loadWeeklyEntries(week);
    return;
  }

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
  if (dateSelect.value) loadDailyEntries(dateSelect.value);
});

function renderDailyHead() {
  tableHead.innerHTML = `
    <tr>
      <th>Bunk</th>
      <th>Name</th>
      <th>Pushups</th>
      <th>Situps</th>
      <th>Squats</th>
      <th>Run</th>
    </tr>`;
}

function renderWeeklyHead() {
  tableHead.innerHTML = `
    <tr>
      <th>Bunk</th>
      <th>Name</th>
      <th>Total Run Distance</th>
    </tr>`;
}

async function loadDailyEntries(dateStr) {
  resetTable("Loading entries...");
  tableState.className = "loading-state";
  renderDailyHead();

  if (!apiConfigured()) return;

  try {
    const res = await fetch(`${API_URL}?formType=daily&date=${encodeURIComponent(dateStr)}`);
    const rows = await res.json();

    if (!rows || rows.length === 0) {
      resetTable(`No entries logged for ${dateStr} yet.`);
      return;
    }

    rows.sort((a, b) => Number(a.bunk) - Number(b.bunk));

    tbody.innerHTML = rows
      .map(
        (r) => `
        <tr>
          <td><span class="bunk-badge bunk-${r.bunk}">${r.bunk}</span></td>
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
  }
}

async function loadWeeklyEntries(week) {
  resetTable("Loading entries...");
  tableState.className = "loading-state";
  renderWeeklyHead();

  if (!apiConfigured()) return;

  try {
    const res = await fetch(`${API_URL}?formType=weekly&week=${week}`);
    const rows = await res.json();

    if (!rows || rows.length === 0) {
      resetTable(`No weekly run entries logged for Week ${week} yet.`);
      return;
    }

    rows.sort((a, b) => Number(a.bunk) - Number(b.bunk));

    tbody.innerHTML = rows
      .map(
        (r) => `
        <tr>
          <td><span class="bunk-badge bunk-${r.bunk}">${r.bunk}</span></td>
          <td>${escapeHtml(r.name)}</td>
          <td>${escapeHtml(String(r.distance))}</td>
        </tr>`
      )
      .join("");

    table.style.display = "table";
    tableState.style.display = "none";
  } catch (err) {
    resetTable("Couldn't load entries. Check your connection and that the Sheet is shared correctly.");
  }
}

function apiConfigured() {
  if (!API_URL || API_URL === "PASTE_YOUR_WEB_APP_URL_HERE") {
    resetTable("Not connected yet — paste your Apps Script Web App URL into config.js (see README).");
    return false;
  }
  return true;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}