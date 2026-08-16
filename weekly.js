// ============================================================
// Weekly Run Quota — form logic
// ============================================================

const bunkSelect = document.getElementById("bunk");
const nameSelect = document.getElementById("name");
wireBunkNameDropdown(bunkSelect, nameSelect);

const form = document.getElementById("weekly-form");
const submitBtn = document.getElementById("submit-btn");
const statusMsg = document.getElementById("status-msg");

function showStatus(message, ok) {
  statusMsg.textContent = message;
  statusMsg.className = "status-msg show " + (ok ? "ok" : "err");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusMsg.className = "status-msg";

  const bunk = bunkSelect.value;
  const name = nameSelect.value;
  const distance = document.getElementById("distance").value.trim();

  if (!bunk || !name || !distance) {
    showStatus("Please fill in every field before submitting.", false);
    return;
  }

  const payload = { formType: "weekly", bunk, name, distance };

  if (!API_URL || API_URL === "PASTE_YOUR_WEB_APP_URL_HERE") {
    showStatus(
      "The form isn't connected to a data store yet — paste your Apps Script Web App URL into config.js (see README).",
      false
    );
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    showStatus("Entry submitted — logged under this week's total.", true);
    form.reset();
    nameSelect.innerHTML = '<option value="" disabled selected>Select bunk first</option>';
    nameSelect.disabled = true;
  } catch (err) {
    showStatus("Something went wrong submitting your entry. Check your connection and try again.", false);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Entry";
  }
});