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
    status: "toDo"
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

function loadTasks() {
  fetch(`${BASE_URL}/tasks.json`)
    .then(res => res.json())
    .then(tasks => {
      clearColumns();
      if (!tasks) return;

      for (let id in tasks) {
        const task = tasks[id];
        const card = document.createElement("div");
        card.classList.add("task-card");
        card.setAttribute("data-id", id);

        card.innerHTML = `
          <h3>${task.title}</h3>
          <p>${task.description}</p>
          <p><strong>Fällig:</strong> ${task.dueDate}</p>
          <p><strong>Kategorie:</strong> ${task.category}</p>
          <div class="task-arrows">
            <button class="left-arrow">←</button>
            <button class="right-arrow">→</button>
          </div>
        `;

        card.querySelector(".left-arrow").addEventListener("click", () => moveTask(card, "left"));
        card.querySelector(".right-arrow").addEventListener("click", () => moveTask(card, "right"));

        const column = document.getElementById(task.status || "toDo");
        if (column) column.appendChild(card);
      }
    })
    .catch(err => console.error("Fehler beim Laden:", err));
}

function clearColumns() {
  ["toDo", "inProgress", "awaitFeedback", "done"].forEach(id => {
    const col = document.getElementById(id);
    if (col) col.innerHTML = "";
  });
}

function moveTask(card, direction) {
  const columns = ["toDo", "inProgress", "awaitFeedback", "done"];
  const currentColumn = card.closest(".board-column");
  const currentIndex = columns.indexOf(currentColumn.id);
  const newIndex = direction === "right" ? currentIndex + 1 : currentIndex - 1;

  if (newIndex >= 0 && newIndex < columns.length) {
    const newStatus = columns[newIndex];
    const taskId = card.getAttribute("data-id");

    const targetColumn = document.getElementById(newStatus);
    targetColumn.appendChild(card);

    fetch(`${BASE_URL}/tasks/${taskId}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(() => console.log(`Task ${taskId} nach ${newStatus} verschoben.`))
    .catch(err => console.error("Fehler beim Aktualisieren des Status:", err));
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

function logout() {
  localStorage.removeItem("userInitial");
  window.location.href = "/index.html";
}