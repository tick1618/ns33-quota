// ============================================================
// Shared roster — used by training.js and weekly.js to populate
// the bunk-dependent name dropdown.
// ============================================================

const ROSTER = {
  36: [
    "Muhammad Syazani Bin Sunaidy",
    "Muhammad Hazim Bin Johari",
    "Goh Han Chen Jovan",
    "Muhammad Irfan Bin Azmie",
    "Mikhaill Mohsen Bin Mohamed Risa",
    "Aiman Faruqi Bin Nursalihin",
    "Nabil Akid Dani Keif'fly Bin Mohamed Imran",
    "Cheng Jia Jie",
    "Zhao Xiruo (Robin)",
  ],
  37: [
    "Lin Tiancheng",
    "Syed Azanyshq Bin Syed Abdul Azrin",
    "Mohammad Zahir Bin Mohammad Zahid",
    "Goh Jiak Chuang Ryan",
    "Mohamed Ilhan Bin Mohamed Haniff",
    "Muhammad Danial Harith Bin Abdul Wahid",
    "Jowell Man Jia Wei",
    "Fauzan Hafiz Dereinda",
    "Rifqi Bin Mohammad Nadzi",
  ],
  38: [
    "Ng Chong Quan Gary",
    "Habeebur'rahmaan Abdul Raoof (Habeeb)",
    "Muhammad Danish Bin Mazlan",
    "Lai Jun Xiang",
    "Ahmad Bin Kassim",
    "Matthew Joseph Lourdes",
    "Soo Yu Hao",
    "Quek Leng Yi",
    "Muhammad Aleem S/O Mohamed Alli",
  ],
  39: [
    "Jayden Cho Jie Jun",
    "Ehren Soh Enting",
    "Marquez Immanuel Fernandez",
    "Ng Yong Jian",
    "Chan Yan Kit, Gabriel",
    "Tomas Gabriel Camacho",
    "Chen Sze Ting",
    "Asher Mathew Gupta",
  ],
};

// Wires a bunk <select> to a name <select>, populating the name dropdown
// with that bunk's roster whenever the bunk changes.
function wireBunkNameDropdown(bunkSelect, nameSelect) {
  bunkSelect.addEventListener("change", () => {
    const roster = ROSTER[bunkSelect.value] || [];

    nameSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = "Select name";
    nameSelect.appendChild(placeholder);

    roster.forEach((person) => {
      const opt = document.createElement("option");
      opt.value = person;
      opt.textContent = person;
      nameSelect.appendChild(opt);
    });

    nameSelect.disabled = false;
  });
}