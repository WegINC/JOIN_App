const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

let selectedPriority = "";
let selectedAssignees = {};
let assigneesLoaded = false;

function initPage() {
  initUserInitial();
  setupPriorityButtons();
  populateCategoryDropdown();
  setDefaultPriority();
}

function setDefaultPriority() {
  selectPriority("medium");
}

window.addEventListener("DOMContentLoaded", initPage);

async function toggleAssigneeDropdown() {
  const container = document.getElementById("fa-assigned-container");
  const trigger = document.getElementById("fa-assigned-dropdown");
  if (!container || !trigger) return;

  const isHidden = container.classList.contains("hidden");

  if (isHidden) {
    if (!assigneesLoaded) {
      await loadAssigneeSuggestions();
      assigneesLoaded = true;
    }
    updateSelectedContactsView();
    container.classList.remove("hidden");
  } else {
    container.classList.add("hidden");
  }

  if (!window._addTaskOutsideHandler) {
    window._addTaskOutsideHandler = (e) => {
      const inside = container.contains(e.target) || trigger.contains(e.target);
      if (!inside) container.classList.add("hidden");
    };
    document.addEventListener("click", window._addTaskOutsideHandler);
  }
}

async function loadAssigneeSuggestions() {
  const container = document.getElementById("fa-assigned-container");
  if (!container) return;
  container.innerHTML = "";

  try {
    const res = await fetch(`${BASE_URL}/users.json`);
    const data = await res.json() || {};

    const frag = document.createDocumentFragment();
    Object.entries(data).forEach(([uid, u]) => {
      const name = u.name || "Unnamed";
      const color = u.themeColor || "#0038ff";
      const initials = getInitials(name);

      const row = document.createElement("label");
      row.className = "assignee-option";
      row.dataset.uid = uid;
      row.dataset.initials = initials;
      row.innerHTML = `
        <div class="task-user-initials" style="background-color:${color}">${initials}</div>
        <span>${name}</span>
        <input type="checkbox" class="assignee-checkbox" />
      `;
      frag.appendChild(row);
    });
    container.appendChild(frag);

    container.addEventListener("click", (e) => {
      const row = e.target.closest(".assignee-option");
      if (!row) return;
      const cb = row.querySelector(".assignee-checkbox");
      const uid = row.dataset.uid;

      if (row.classList.contains("selected")) {
        row.classList.remove("selected");
        if (cb) cb.checked = false;
        delete selectedAssignees[uid];
      } else {
        row.classList.add("selected");
        if (cb) cb.checked = true;
        selectedAssignees[uid] = true;
      }
      updateSelectedContactsView();
    });
  } catch (e) {
    console.error("Fehler beim Laden der Kontakte:", e);
  }
}

function getInitials(name = "") {
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] + (p[1]?.[0] || "")).toUpperCase() || (p[0] || "").slice(0, 2).toUpperCase();
}

function updateSelectedContactsView() {
  const view = document.getElementById("fa-assigned-dropdown");
  const cont = document.getElementById("fa-assigned-container");
  if (!view || !cont) return;
  const initials = Array.from(cont.querySelectorAll(".assignee-option.selected"))
    .map(el => el.dataset.initials);
  view.innerText = initials.length ? initials.join(", ") : "Select contacts to assign";
}
function createTask() {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("due").value;
  const category = document.getElementById("category").value;
  const priority = selectedPriority || "low";

  let selected = Object.keys(selectedAssignees).length
    ? selectedAssignees
    : Object.fromEntries(
      Array.from(document.querySelectorAll('#assigned-container .assignee-checkbox:checked'))
        .map(cb => [cb.closest('.assignee-option').dataset.uid, true])
    );

  if (!title || !dueDate || category === "Select task category" || !Object.keys(selected).length) {
    alert("Please fill all required fields");
    return;
  }

  const subtasks = Array.from(document.querySelectorAll(".subtask-input"))
    .map(i => i.value.trim())
    .filter(Boolean)
    .map(t => ({ title: t, done: false }));

  const userInitials = localStorage.getItem("userInitial") || "G";
  const taskData = {
    title,
    description,
    dueDate,
    category,
    priority,
    assignedTo: selected,
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
      showIcon("../assets/img/task-added-toBoard.svg");
      setTimeout(() => {
        window.location.href = "../pages/board.html";
      }, 1500);
    })
    .catch(err => console.error("Fehler beim Erstellen des Tasks:", err));
}

function initUserInitial() {
  const initial = localStorage.getItem("userInitial") || "G";
  const nameBtn = document.getElementById("user-name");
  if (nameBtn) nameBtn.textContent = initial;
}

function setupPriorityButtons() {
  ["urgent", "medium", "low"].forEach(level => {
    const btn = document.getElementById(`priority-${level}`);
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        selectPriority(level);
      });
    }
  });
}

function selectPriority(level) {
  selectedPriority = level;
  ["urgent", "medium", "low"].forEach(lvl => {
    const btn = document.getElementById(`priority-${lvl}`);
    if (btn) btn.classList.remove("active");
  });
  const activeBtn = document.getElementById(`priority-${level}`);
  if (activeBtn) activeBtn.classList.add("active");
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

function showIcon(src, duration = 1500) {
  const icon = document.getElementById("alert-icon");
  if (!icon) return;
  icon.src = src;
  icon.classList.remove("hidden");
  setTimeout(() => {
    icon.classList.add("hidden");
  }, duration);
}