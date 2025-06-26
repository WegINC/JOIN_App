const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

let selectedPriority = "";

function onloadBoard() {
  loadTasks();
  setupButtons();
  initUserInitial();
}

function toggleUserMenu() {
  document.getElementById('user-dropdown').classList.toggle('hidden');
}

function closeUserMenu(event) {
  const wrapper = document.getElementById('user-dropdown-wrapper');
  const dropdown = document.getElementById('user-dropdown');
  if (!wrapper.contains(event.target)) {
    dropdown.classList.add('hidden');
  }
}

function setupButtons() {
  document.querySelectorAll(".column-titles button").forEach(btn =>
    btn.addEventListener("click", openFloatingAddTaskPopup)
  );
  const addBtn = document.querySelector(".add-task-button");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      popupStatus = "toDo";
      openFloatingAddTaskPopup();
    });
  }
}

function initUserInitial() {
  const initial = localStorage.getItem("userInitial") || "G";
  const nameBtn = document.getElementById("user-name");
  if (nameBtn) nameBtn.textContent = initial;
}

async function fetchUsers() {
  try {
    const res = await fetch(`${BASE_URL}/users.json`);
    const data = await res.json();
    const initialsMap = {};

    for (const uid in data) {
      const fullName = data[uid].name || "";
      const nameParts = fullName.trim().split(" ");
      const initials = nameParts.length >= 2
        ? nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase()
        : nameParts[0][0].toUpperCase();

      initialsMap[uid] = initials;
    }

    return initialsMap;
  } catch (err) {
    console.error("Fehler beim Laden der Benutzer:", err);
    return {};
  }
}

function openFloatingAddTaskPopup() {
  fetch("/pages/floating_add_task.html")
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById("popup-container");
      container.innerHTML = html;
      container.style.display = "block";
    })
    .catch(err => console.error("Fehler beim Laden des Popups:", err));
}

function closePopup() {
  const popup = document.getElementById("popup-container");
  popup.style.display = "none";
  popup.innerHTML = "";
}

function createTask() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const dueDate = document.getElementById("due").value;
  const category = document.getElementById("category").value;

  const userInitial = localStorage.getItem("userInitial") || "G";

  if (!title || !dueDate || category === "Select task category") {
    alert("Bitte alle Pflichtfelder ausfüllen.");
    return;
  }

  const taskData = {
    title,
    description,
    dueDate,
    category,
    priority: selectedPriority || "low",
    assignedTo: { uid_1: true },
    status: "toDo",
    userInitials: userInitial
  };

  fetch(`${BASE_URL}/tasks.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData)
  })
    .then(() => {
      closePopup();
      loadTasks();
    })
    .catch(err => console.error("Fehler beim Speichern:", err));
}

let draggedCard = null;

async function loadTasks() {
  const userInitialsMap = await fetchUsers();

  fetch(`${BASE_URL}/tasks.json`)
    .then((res) => res.json())
    .then((tasks) => {
      const columns = ["toDo", "inProgress", "awaitFeedback", "done"];
      columns.forEach(id => {
        const column = document.getElementById(id);
        column.innerHTML = "";
      });

      for (let id in tasks) {
        const task = tasks[id];
        const column = document.getElementById(task["status"]);

        if (column) {
          const card = document.createElement("div");
          card.classList.add("task-card");
          card.setAttribute("data-id", id);
          card.setAttribute("draggable", "true");
          card.addEventListener("dragstart", handleDragStart);
          card.addEventListener("dragend", handleDragEnd);

          const assignedUIDs = Object.keys(task.assignedTo || {});
          const userBadges = assignedUIDs.map(uid => {
            const initials = userInitialsMap[uid] || "??";
            return `<div class="task-user-initials">${initials}</div>`;
          }).join("");

          card.innerHTML = `
            <div class="task-category">${task["category"]}</div>
            <div class="task-title"><strong>${task["title"]}</strong></div>
            <div class="task-description">${task["description"]}</div>

            ${task.subtasks && task.subtasks.length ? `
            <div class="myProgress">
              <div class="myBar" style="width: ${getSubtaskProgress(task)}%; background-color: ${getSubtaskProgress(task) === 100 ? '#4caf50' : '#ffa800'};"></div>
            </div>
            <div class="task-subtask-label">${countCompletedSubtasks(task)} von ${task.subtasks.length} Subtasks erledigt</div>
            ` : ""}
            
            <div class="task-footer">
              <div class="task-user">
                ${userBadges}
              </div>
            </div>
          `;

          column.appendChild(card);
        }
      }
    })
    .catch((error) => {
      console.error("Fehler beim Laden der Tasks:", error);
    });
}

["toDo", "inProgress", "awaitFeedback", "done"].forEach(id => {
  const column = document.getElementById(id);
  if (column) {
    column.addEventListener("dragover", handleDragOver);
    column.addEventListener("drop", handleDrop);
  }
});

function handleDragStart(e) {
  draggedCard = e.target;
  e.dataTransfer.setData("text/plain", draggedCard.getAttribute("data-id"));
  setTimeout(() => draggedCard.classList.add("invisible"), 0);
}

function handleDragEnd() {
  if (draggedCard) {
    draggedCard.classList.remove("invisible");
    draggedCard = null;
  }
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();
  const targetColumn = e.currentTarget;
  const taskId = e.dataTransfer.getData("text/plain");

  if (!taskId || !targetColumn) return;

  const taskCard = document.querySelector(`[data-id="${taskId}"]`);
  if (taskCard && targetColumn.classList.contains("board-column")) {
    targetColumn.appendChild(taskCard);

    const newStatus = targetColumn.id;

    fetch(`${BASE_URL}/tasks/${taskId}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    })
      .then(() => console.log(`Task ${taskId} verschoben nach ${newStatus}`))
      .catch((err) => console.error("Fehler beim Aktualisieren:", err));
  }
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
    activeBtn.style.backgroundColor = level === "urgent" ? "red" : level === "medium" ? "#ffa800" : "lightgreen";
    activeBtn.style.color = level === "low" ? "#000" : "white";
  }
}

const userNameButton = document.getElementById("user-name");

window.addEventListener("DOMContentLoaded", () => {
  const initial = localStorage.getItem("userInitial") || "G";
  if (userNameButton) {
    userNameButton.textContent = initial;
  }
});

function logout() {
  localStorage.removeItem("userInitial");
  window.location.href = "/index.html";
}