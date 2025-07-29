const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

let selectedPriority = "";
let assigneeMap = {};

window.addEventListener("DOMContentLoaded", () => {
  initUserInitial();
  setupPriorityButtons();
  loadAssigneeSuggestions();
  populateCategoryDropdown();
});

function initUserInitial() {
  const initial = localStorage.getItem("userInitial") || "G";
  const nameBtn = document.getElementById("user-name");
  if (nameBtn) nameBtn.textContent = initial;
}

function setupPriorityButtons() {
  const buttons = {
    urgent: document.getElementById("priority-urgent"),
    medium: document.getElementById("priority-medium"),
    low: document.getElementById("priority-low"),
  };

  Object.entries(buttons).forEach(([level, btn]) => {
    if (btn) btn.addEventListener("click", () => selectPriority(level));
  });
}

function selectPriority(level) {
  selectedPriority = level;

  const buttons = {
    urgent: document.getElementById("priority-urgent"),
    medium: document.getElementById("priority-medium"),
    low: document.getElementById("priority-low"),
  };

  Object.values(buttons).forEach(btn => {
    btn.classList.remove("active");
    btn.style.backgroundColor = "#e0e0e0";
    btn.style.color = "#333";
  });

  const activeBtn = buttons[level];
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.style.backgroundColor =
      level === "urgent" ? "red" : level === "medium" ? "#ffa800" : "lightgreen";
    activeBtn.style.color = level === "low" ? "#000" : "white";
  }
}

async function loadAssigneeSuggestions() {
  try {
    const res = await fetch(`${BASE_URL}/users.json`);
    const data = await res.json();
    assigneeMap = {};
    for (const uid in data) {
      assigneeMap[uid] = data[uid].name;
    }
  } catch (err) {
    console.error("Fehler beim Laden der Kontakte:", err);
  }
}

async function populateAssigneeDropdown() {
  try {
    const res = await fetch(`${BASE_URL}/users.json`);
    const data = await res.json();

    const select = document.getElementById("assigned");
    if (!select) return;

    select.innerHTML = `<option disabled selected>Select contacts to assign</option>`;

    for (let uid in data) {
      const user = data[uid];
      const option = document.createElement("option");
      option.value = uid;
      option.textContent = user.name || "Unnamed";
      select.appendChild(option);
    }
  } catch (err) {
    console.error("Fehler beim Laden der Kontakte:", err);
  }
}

function populateCategoryDropdown() {
  const categorySelect = document.getElementById("category");
  if (!categorySelect) return;

  const options = ["Technical Task", "User Story"];
  categorySelect.innerHTML = `<option disabled selected>Select task category</option>`;

  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    categorySelect.appendChild(option);
  });
}

function addSubtaskInput() {
  const container = document.getElementById("subtask-container");
  if (!container) return;

  const inputDiv = document.createElement("div");
  inputDiv.className = "subtask-row";

  inputDiv.innerHTML = `
    <input type="text" class="subtask-input" placeholder="Add new subtask" />
    <button type="button" class="remove-btn" onclick="this.parentElement.remove()">−</button>
  `;

  container.appendChild(inputDiv);
}

function createTask() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const dueDate = document.getElementById("due").value;
  const category = document.getElementById("category").value;
  const priority = selectedPriority || "low";

const assignedUid = document.getElementById("assigned")?.value;

  if (!title || !dueDate || !assignedUid || category === "Select task category") {
    alert("Bitte alle Pflichtfelder ausfüllen.");
    return;
  }

  const subtaskInputs = document.querySelectorAll(".subtask-input");
  const subtasks = Array.from(subtaskInputs)
    .map(input => input.value.trim())
    .filter(text => text !== "")
    .map(title => ({ title, done: false }));

  const userInitial = localStorage.getItem("userInitial") || "G";

  const taskData = {
    title,
    description,
    dueDate,
    category,
    priority,
    assignedTo: { [assignedUid]: true },
    status: "toDo",
    userInitials: userInitial,
    subtasks,
  };

  fetch(`${BASE_URL}/tasks.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  })
    .then(() => {
      alert("Task erfolgreich erstellt.");
      window.location.href = "/pages/board.html";
    })
    .catch((err) => console.error("Fehler beim Erstellen:", err));
}

function closeUserMenu(event) {
  const wrapper = document.getElementById('user-dropdown-wrapper');
  const dropdown = document.getElementById('user-dropdown');
  if (wrapper && dropdown && !wrapper.contains(event.target)) {
    dropdown.classList.add('hidden');
  }
}

function toggleUserMenu() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}
