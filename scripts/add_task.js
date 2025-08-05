const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

let selectedPriority = "";
let selectedContacts = [];

window.addEventListener("DOMContentLoaded", () => {
  initUserInitial();
  setupPriorityButtons();
  populateCategoryDropdown();
  loadAssigneeSuggestions();
});

function toggleAssigneeDropdown() {
  document.getElementById("assigned-container").classList.toggle("hidden");
}

function getContacts() {
  return JSON.parse(localStorage.getItem("contacts")) || [];
}

function renderAssignedToContacts(name, initials, avatarColor) {
  return `
    <div class="assignee-option" onclick="toggleContactSelection(this)" data-name="${name}" data-initials="${initials}" data-color="${avatarColor}">
      <div class="task-user-initials" style="background-color:${avatarColor}">${initials}</div>
      <span>${name}</span>
      <input type="checkbox" class="assignee-checkbox" readonly />
    </div>
  `;
}

function getInitials(name) {
  const parts = name.split(" ");
  return parts.length > 1
    ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function toggleContactSelection(element) {
  const name = element.dataset.name;
  const initials = element.dataset.initials;
  const color = element.dataset.color;

  const index = selectedContacts.findIndex(c => c.name === name);
  const checkbox = element.querySelector("input[type='checkbox']");

  if (index === -1) {
    selectedContacts.push({ name, initials, color });
    element.classList.add("selected");
    if (checkbox) checkbox.checked = true;
  } else {
    selectedContacts.splice(index, 1);
    element.classList.remove("selected");
    if (checkbox) checkbox.checked = false;
  }

  updateSelectedContactsView();
}

function updateSelectedContactsView() {
  const view = document.getElementById("assigned-dropdown");
  if (selectedContacts.length === 0) {
    view.innerText = "Select contacts to assign";
  } else {
    view.innerText = selectedContacts.map(c => c.initials).join(", ");
  }
}

function createTask() {
  const title = document.getElementById("title").value;
  const due = document.getElementById("due").value;
  if (!title || !due || selectedContacts.length === 0) {
    alert("Please fill all required fields");
    return;
  }

  const task = {
    title,
    due,
    assignedTo: selectedContacts,
  };

  console.log("Task created:", task);
} 

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
    for (const uid in data) {
      assigneeMap[uid] = data[uid].name;
    }
  } catch (err) {
    console.error("Fehler beim Laden der Kontakte:", err);
  }
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
  const container = document.getElementById("assigned-container");
  container.innerHTML = "";
  const contacts = getContacts();
  contacts.forEach(contact => {
    const initials = getInitials(contact.name);
    const color = contact.color || "#0038ff";
    container.innerHTML += renderAssignedToContacts(contact.name, initials, color);
  });
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

document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('assigned-container');
  const trigger = document.getElementById('assigned-dropdown');

  const clickedInside = dropdown.contains(event.target) || trigger.contains(event.target);

  if (!clickedInside) {
    dropdown.classList.add('hidden');
  }
});