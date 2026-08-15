// ============================================================
// Daily Quota Training — form logic
// ============================================================

const RUN_TYPES = ["No run", "Zone 2/Slow Run", "Threshold", "Fartlek", "Intervals"];

let runCounter = 0;
const runsContainer = document.getElementById("runs-container");
const addRunBtn = document.getElementById("add-run-btn");
const form = document.getElementById("quota-form");
const submitBtn = document.getElementById("submit-btn");
const statusMsg = document.getElementById("status-msg");

function buildRunBlock(index, isFirst) {
  const block = document.createElement("div");
  block.className = "run-block";
  block.dataset.index = index;

  const options = RUN_TYPES.map((t) => `<option value="${t}">${t}</option>`).join("");

  block.innerHTML = `
    <div class="run-block-label">
      <span>Run ${isFirst ? "" : "#" + (index + 1)}</span>
      ${isFirst ? "" : '<button type="button" class="remove-run">Remove</button>'}
    </div>
    <div class="field">
      <label>Run Type</label>
      <select class="run-type">${options}</select>
    </div>
    <div class="conditional distance-field">
      <div class="field">
        <label>Distance (km)</label>
        <input type="text" class="run-distance" placeholder="e.g. 5" />
      </div>
    </div>
    <div class="conditional intervals-field">
      <div class="field">
        <label>Interval Sets</label>
        <div class="sets-row">
          <input type="text" class="run-sets" placeholder="Sets, e.g. 8" />
          <span class="x">&times;</span>
          <input type="text" class="run-reps" placeholder="Distance, e.g. 400m" />
        </div>
      </div>
    </div>
  `;

  const select = block.querySelector(".run-type");
  const distanceField = block.querySelector(".distance-field");
  const intervalsField = block.querySelector(".intervals-field");

  // Interval hints ("Sets, e.g. 8" / "Distance, e.g. 400m") disappear as
  // soon as the box is clicked into, not just once something is typed.
  const setsInput = block.querySelector(".run-sets");
  const repsInput = block.querySelector(".run-reps");
  [setsInput, repsInput].forEach((input) => {
    const originalPlaceholder = input.placeholder;
    input.addEventListener("focus", () => {
      input.placeholder = "";
    });
    input.addEventListener("blur", () => {
      if (!input.value) input.placeholder = originalPlaceholder;
    });
  });

  select.addEventListener("change", () => {
    const val = select.value;
    distanceField.classList.remove("show");
    intervalsField.classList.remove("show");
    if (val === "Intervals") {
      intervalsField.classList.add("show");
    } else if (val !== "No run") {
      distanceField.classList.add("show");
    }
  });

  const removeBtn = block.querySelector(".remove-run");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => block.remove());
  }

  return block;
}

function addRunBlock() {
  const block = buildRunBlock(runCounter, runCounter === 0);
  runsContainer.appendChild(block);
  runCounter++;
}

addRunBtn.addEventListener("click", addRunBlock);

// seed the first run block
addRunBlock();

function showStatus(message, ok) {
  statusMsg.textContent = message;
  statusMsg.className = "status-msg show " + (ok ? "ok" : "err");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusMsg.className = "status-msg";

  const name = document.getElementById("name").value.trim();
  const bunk = document.getElementById("bunk").value;
  const pushups = document.getElementById("pushups").value;
  const situps = document.getElementById("situps").value;
  const squats = document.getElementById("squats").value;

  if (!name || !bunk || pushups === "" || situps === "" || squats === "") {
    showStatus("Please fill in every field before submitting.", false);
    return;
  }

  const runBlocks = Array.from(document.querySelectorAll(".run-block"));
  const runs = [];

  for (const block of runBlocks) {
    const type = block.querySelector(".run-type").value;
    if (type === "No run") {
      runs.push({ type: "No run" });
      continue;
    }
    if (type === "Intervals") {
      const sets = block.querySelector(".run-sets").value.trim();
      const reps = block.querySelector(".run-reps").value.trim();
      if (!sets || !reps) {
        showStatus("Please fill in the interval sets for every run added.", false);
        return;
      }
      runs.push({ type, sets, reps });
    } else {
      const distance = block.querySelector(".run-distance").value.trim();
      if (!distance) {
        showStatus("Please fill in the distance for every run added.", false);
        return;
      }
      runs.push({ type, distance });
    }
  }

  const payload = { name, bunk, pushups, situps, squats, runs };

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
    // Apps Script web apps often can't be read cross-origin, so we treat a
    // non-throwing fetch as success (see README troubleshooting section).
    showStatus("Entry submitted. Nice work — logged with today's date and time.", true);
    form.reset();
    runsContainer.innerHTML = "";
    runCounter = 0;
    addRunBlock();
  } catch (err) {
    showStatus("Something went wrong submitting your entry. Check your connection and try again.", false);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Entry";
  }
});
