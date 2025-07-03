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
  document.querySelectorAll(".column-title button").forEach(btn =>
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
    const userDataMap = {};

    for (const uid in data) {
      const user = data[uid];
      const fullName = user.name || "";
      const nameParts = fullName.trim().split(" ");
      const initials = nameParts.length >= 2
        ? nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase()
        : nameParts[0][0].toUpperCase();

      let themeColor = user.themeColor;

      if (!themeColor) {
        themeColor = getRandomColor();
        await fetch(`${BASE_URL}/users/${uid}.json`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ themeColor })
        });
      }

      userDataMap[uid] = { initials, themeColor };
    }

    return userDataMap;
  } catch (err) {
    console.error("Fehler beim Laden der Benutzer:", err);
    return {};
  }
}

function getRandomColor() {
  const colors = ["#FF5733", "#009688", "#3F51B5", "#795548", "#FF9800"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function openFloatingAddTaskPopup() {
  fetch("/pages/floating_add_task.html")
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById("popup-container");
      container.innerHTML = html;
      container.style.display = "block";

      populateAssigneeDropdown();
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
  const priority = selectedPriority || "low";

  const subtaskInputs = document.querySelectorAll(".subtask-input");
  const subtasks = Array.from(subtaskInputs)
    .map(input => input.value.trim())
    .filter(text => text !== "")
    .map(title => ({ title, done: false }));

  const userInitial = localStorage.getItem("userInitial") || "G";
  const currentUid = localStorage.getItem("userId") || "uid_1";

  if (!title || !dueDate || category === "Select task category") {
    alert("Bitte alle Pflichtfelder ausfüllen.");
    return;
  }

  const taskData = {
    title,
    description,
    dueDate,
    category,
    priority,
    assignedTo: { [currentUid]: true },
    status: "toDo",
    userInitials: userInitial,
    subtasks
  };

  const editingId = window.editingTaskId;

  if (editingId) {
    fetch(`${BASE_URL}/tasks/${editingId}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData)
    })
      .then(() => {
        window.editingTaskId = null;
        closePopup();
        loadTasks();
        closeTaskOverlay();
      })
      .catch(err => console.error("Fehler beim Aktualisieren:", err));
  } else {
    fetch(`${BASE_URL}/tasks.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData)
    })
      .then(() => {
        closePopup();
        loadTasks();
      })
      .catch(err => console.error("Fehler beim Erstellen:", err));
  }
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
        task.id = id;

        const column = document.getElementById(task.status);
        if (!column) continue;

        const card = document.createElement("div");
        card.classList.add("task-card");
        card.setAttribute("data-id", id);
        card.setAttribute("draggable", "true");

        card.addEventListener("dragstart", handleDragStart);
        card.addEventListener("dragend", handleDragEnd);

        card.addEventListener("click", () => openTaskDetailOverlay(task, id));

        const assignedUIDs = Object.keys(task.assignedTo || {});
        const userBadges = assignedUIDs.map(uid => {
          const user = userInitialsMap[uid];
          const initials = user?.initials || "G";
          const themeColor = user?.themeColor || "#0038FF";

          return `<div class="task-user-initials" style="background-color: ${themeColor};">${initials}</div>`;
        }).join("");

        card.innerHTML = `
            <div class="task-category">${task["category"]}</div>
            <div class="task-title"><strong>${task["title"]}</strong></div>
            <div class="task-description">${task["description"]}</div>

            <div class="subtask-counter">
              <progress value="${getSubtaskProgress(task)}" max="100"></progress>
              <span>${getSubtaskLabel(task)}</span>
            </div>

            <div class="task-footer">
              <div class="task-user">
                ${userBadges}
              </div>
            </div>
          `;

        column.appendChild(card);
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
async function populateAssigneeDropdown() {
  try {
    const response = await fetch(`${BASE_URL}/users.json`);
    const data = await response.json();

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
  } catch (error) {
    console.error("Fehler beim Laden der Kontakte für das Dropdown:", error);
  }
}

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
  localStorage.removeItem("userId");
  window.location.href = "/index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  onloadBoard();
});

function openTaskDetailOverlay(task, taskId) {
  fetch("/pages/task_detail_overlay.html")
    .then(function(response) {
      return response.text();
    })
    .then(function(html) {
      var container = document.getElementById("task-detail-container");
      container.innerHTML = html;
      container.style.display = "block";

      window.currentTaskId = taskId;
      window.currentTaskData = task;

      var overlayEvent = new CustomEvent("taskDataReady", {
        detail: task 
      });
      document.dispatchEvent(overlayEvent);
    })
    .catch(function(error) {
      console.error("Fehler beim Laden des Task-Details:", error);
    });
};

function getSubtaskProgress(task) {
  const subtasks = task.subtasks || [];
  if (!subtasks.length) return 0;
  const completed = subtasks.filter(st => st.done).length;
  return Math.round((completed / subtasks.length) * 100);
}

function getSubtaskLabel(task) {
  const subtasks = task.subtasks || [];
  if (!subtasks.length) return "0/0 subtasks";
  const completed = subtasks.filter(st => st.done).length;
  return `${completed}/${subtasks.length} subtasks`;
}
