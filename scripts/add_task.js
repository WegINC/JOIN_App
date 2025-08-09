const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

let selectedPriority = "";
let selectedAssignees = {};

window.addEventListener("DOMContentLoaded", () => {
  initUserInitial();
  setupPriorityButtons();
  populateCategoryDropdown();
  loadAssigneeSuggestions();
});

function toggleAssigneeDropdown() {
  document.getElementById("assigned-container").classList.toggle("hidden");
}

function renderAssignedToContacts(uid, name, initials, avatarColor) {
  return `
    <label class="assignee-option" data-uid="${uid}" data-name="${name}" data-initials="${initials}" data-color="${avatarColor}" onclick="toggleContactSelection(this)">
      <div class="task-user-initials" style="background-color:${avatarColor}">${initials}</div>
      <span>${name}</span>
      <input type="checkbox" class="assignee-checkbox" />
    </label>
  `;
}

async function loadAssigneeSuggestions() {
  const container = document.getElementById("assigned-container");
  container.innerHTML = "";
  try {
    const res = await fetch(`${BASE_URL}/users.json`);
    const data = await res.json() || {};
    Object.entries(data).forEach(([uid, u]) => {
      const name = u.name || "Unnamed";
      const color = u.themeColor || "#0038ff";
      const initials = getInitials(name);
      container.innerHTML += renderAssignedToContacts(uid, name, initials, color);
    });
  } catch (e) {
    console.error("Fehler beim Laden der Kontakte:", e);
  }
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || "").slice(0, 2).toUpperCase();
}

function toggleContactSelection(element) {
  const uid = element.dataset.uid;
  const checkbox = element.querySelector(".assignee-checkbox");
  if (selectedAssignees[uid]) {
    delete selectedAssignees[uid];
    element.classList.remove("selected");
    if (checkbox) checkbox.checked = false;
  } else {
    selectedAssignees[uid] = true;
    element.classList.add("selected");
    if (checkbox) checkbox.checked = true;
  }
  updateSelectedContactsView();
}

function updateSelectedContactsView() {
  const view = document.getElementById("assigned-dropdown");
  const initials = Array.from(document.querySelectorAll(".assignee-option.selected"))
    .map(el => el.dataset.initials);
  view.innerText = initials.length ? initials.join(", ") : "Select contacts to assign";
}

function createTask() {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("due").value;
  const category = document.getElementById("category").value;
  const priority = selectedPriority || "low";

  if (!title || !dueDate || !category || Object.keys(selectedAssignees).length === 0) {
    alert("Please fill all required fields");
    return;
  }

  const subtasks = Array.from(document.querySelectorAll(".subtask-input"))
    .map(i => i.value.trim())
    .filter(Boolean)
    .map(title => ({ title, done: false }));

  const userInitials = localStorage.getItem("userInitial") || "G";

  const taskData = {
    title,
    description,
    dueDate,
    category,
    priority,
    assignedTo: selectedAssignees, // Map: { uid: true }
    status: "toDo",
    userInitials,
    subtasks,
  };

  fetch(`${BASE_URL}/tasks.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  })
    .then(() => {
      alert("Task erfolgreich erstellt.");
      window.location.href = "../pages/board.html";
    })
    .catch(err => console.error("Fehler beim Erstellen des Tasks:", err));
}

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

function closeUserMenu(event) {
  const wrapper = document.getElementById('user-dropdown-wrapper');
  const dropdown = document.getElementById('user-dropdown');
  if (wrapper && dropdown && !wrapper.contains(event.target)) {
    dropdown.classList.add('hidden');
  }
}

function toggleUserMenu() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
}

function logout() {
  localStorage.removeItem("userInitial");
  localStorage.removeItem("userId");
  window.location.href = "../index.html";
}

document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('assigned-container');
  const trigger = document.getElementById('assigned-dropdown');
  if (!dropdown || !trigger) return;
  const clickedInside = dropdown.contains(event.target) || trigger.contains(event.target);
  if (!clickedInside) dropdown.classList.add('hidden');
});
