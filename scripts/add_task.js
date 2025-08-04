const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

let selectedPriority = "";
let assigneeMap = {};

window.addEventListener("DOMContentLoaded", () => {
  initUserInitial();
  setupPriorityButtons();
  populateCategoryDropdown();
});

function initUserInitial() {
  const initial = localStorage.getItem("userInitial") || "G";
  const nameBtn = document.getElementById("user-name");
  if (nameBtn) nameBtn.textContent = initial;
}

function getUserInitials(name) {
  const nameParts = name.trim().split(" ");
  return nameParts.length >= 2
    ? nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase()
    : nameParts[0][0].toUpperCase();
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
function populateCategoryDropdown() {
  const categories = ["Technical Task", "User Story"];
  const categorySelect = document.getElementById("category");

  categorySelect.innerHTML = `<option disabled selected hidden>Select task category</option>`;

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
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

async function AssigneeDropdown() {
  try {
    const response = await fetch(`${BASE_URL}/users.json`);
    const data = await response.json();

    const container = document.getElementById("assigned-container");
    container.innerHTML = ""; 

    for (const uid in data) {
      const user = data[uid];
      const userDiv = document.createElement("div");
      userDiv.className = "assignee-option";
      userDiv.dataset.uid = uid;
      userDiv.textContent = user.name || "Unnamed";

      userDiv.addEventListener("click", function () {
        userDiv.classList.toggle("selected");
      });

      container.appendChild(userDiv);
    }
  } catch (error) {
    console.error("Fehler beim Laden der Kontakte:", error);
  }
}

function updateSelectedAssignees() {
  const checkboxes = document.querySelectorAll('#assigned-options input[type="checkbox"]:checked');
  const names = Array.from(checkboxes).map(cb => {
    const label = cb.parentElement.querySelector('span');
    return label ? label.textContent : '';
  });

  document.getElementById("assigned-placeholder").textContent =
    names.length > 0 ? names.join(', ') : "Select contacts to assign";
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

async function loadAssigneeSuggestions() {
  try {
    const res = await fetch(`${BASE_URL}/users.json`);
    const data = await res.json();
    assigneeMap = {};

    for (const uid in data) {
      assigneeMap[uid] = {
        name: data[uid].name || "Unnamed",
        initials: data[uid].initials || "U",
        themeColor: data[uid].themeColor || "#cccccc"
      };
    }

    populateAssigneeDropdown(data);
  } catch (err) {
    console.error("Fehler beim Laden der Kontakte:", err);
  }
}

function toggleAssigneeDropdown() {
  document.getElementById("assigned-container").classList.toggle("hidden");
}

function populateAssigneeDropdown(userData) {
  const container = document.getElementById("assigned-container");
  container.innerHTML = "";

  for (let uid in userData) {
    const user = userData[uid];

    const optionDiv = document.createElement("div");
    optionDiv.className = "assignee-option";

    const label = document.createElement("label");
    label.textContent = user.name || "Unnamed";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "assignee-checkbox";
    checkbox.value = uid;

    optionDiv.appendChild(label);
    optionDiv.appendChild(checkbox);
    container.appendChild(optionDiv);
  }
}

function getSelectedAssignees() {
  const assignedTo = {};
  document.querySelectorAll(".assignee-checkbox:checked").forEach(cb => {
    assignedTo[cb.value] = true;
  });
  return assignedTo;
}

async function createTask() {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("due").value;
  const category = document.getElementById("category").value;
  const priority = selectedPriority || "low";

  const checkboxes = document.querySelectorAll('#assigned-options input[type="checkbox"]:checked');
  const assignedTo = {};
  checkboxes.forEach(cb => {
    assignedTo[cb.dataset.uid] = true;
  });

  if (!title || !dueDate || Object.keys(assignedTo).length === 0 || !category) {
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
    assignedTo,
    status: "toDo",
    userInitials: userInitial,
    subtasks,
  };

  try {
    await fetch(`${BASE_URL}/tasks.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    alert("Task erfolgreich erstellt.");
    window.location.href = "../pages/board.html";
  } catch (err) {
    console.error("Fehler beim Erstellen des Tasks:", err);
  }
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

function logout() {
  localStorage.removeItem("userInitial");
  localStorage.removeItem("userId");
  window.location.href = "../index.html";
}
