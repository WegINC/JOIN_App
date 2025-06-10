const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

function toggleUserMenu() {
  let dropdown = document.getElementById('user-dropdown');
  dropdown.classList.toggle('hidden');
}

function closeUserMenu(event) {
  let dropdownWrapper = document.getElementById('user-dropdown-wrapper');
  let dropdown = document.getElementById('user-dropdown');

  if (!dropdownWrapper.contains(event.target)) {
    dropdown.classList.add('hidden');
  }
}
async function loadTasksFromFirebase() {
  try {
    const res = await fetch(`${BASE_URL}/tasks.json`);
    const tasks = await res.json();

    if (!tasks) return;

    Object.entries(tasks).forEach(([id, task]) => {
      const taskCard = document.createElement("div");
      taskCard.classList.add("task-card");

      taskCard.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <p><strong>Fällig:</strong> ${task.dueDate}</p>
        <p><strong>Kategorie:</strong> ${task.category}</p>
        <div class="task-arrows">
          <button class="left-arrow">←</button>
          <button class="right-arrow">→</button>
        </div>
      `;

      taskCard.querySelector(".left-arrow").addEventListener("click", () => moveTask(taskCard, "left"));
      taskCard.querySelector(".right-arrow").addEventListener("click", () => moveTask(taskCard, "right"));

      const column = document.getElementById(task.status);
      if (column) {
        column.appendChild(taskCard);
      }
    });
  } catch (error) {
    console.error("Fehler beim Laden der Aufgaben:", error);
  }
}

function onloadBoard() {
  loadTasksFromFirebase();
}

function openFloatingAddTaskPopup() {
  const container = document.getElementById("popup-container");

  fetch("/pages/floating_add_task.html")
    .then((res) => res.text())
    .then((html) => {
      container.innerHTML = html;
      container.style.display = "block";
    })
    .catch((err) => {
      console.error("Fehler beim Laden des Popups:", err);
    });
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
    assignedTo: {
      uid_1: true
    },
    status: "toDo"
  };

  fetch(`${BASE_URL}/tasks.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData)
  })
    .then(res => res.json())
    .then(() => {
      closePopup();
      loadTasksFromFirebase();
    })
    .catch(err => {
      console.error("Fehler beim Speichern:", err);
    });
}

window.addEventListener("click", function (event) {
  const popup = document.getElementById("popup-container");
  if (!popup) return;

  if (popup.style.display === "block" && !popup.contains(event.target)) {
    closePopup();
  }
});

document.addEventListener("DOMContentLoaded", function () {
  onloadFunc();

  document.querySelectorAll(".column-titles button").forEach(button => {
    button.addEventListener("click", openFloatingAddTaskPopup);
  });

  const addTaskButton = document.querySelector(".add-task-button");
  if (addTaskButton) {
    addTaskButton.addEventListener("click", openFloatingAddTaskPopup);
  }

  const initial = localStorage.getItem("userInitial") || "G";
  const userNameButton = document.getElementById("user-name");
  if (userNameButton) userNameButton.textContent = initial;
});

let selectedPriority = "";

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

  if (level === "urgent") {
    buttons.urgent.classList.add("active");
    buttons.urgent.style.backgroundColor = "red";
    buttons.urgent.style.color = "white";
  } else if (level === "medium") {
    buttons.medium.classList.add("active");
    buttons.medium.style.backgroundColor = "#ffa800";
    buttons.medium.style.color = "white";
  } else if (level === "low") {
    buttons.low.classList.add("active");
    buttons.low.style.backgroundColor = "lightgreen";
    buttons.low.style.color = "#000";
  }
}
function moveTask(taskCard, direction) {
  const columns = ["toDo", "inProgress", "awaitFeedback", "done"];
  const parentColumn = taskCard.closest(".board-column");
  const currentIndex = columns.indexOf(parentColumn.id);

  let newIndex = direction === "right" ? currentIndex + 1 : currentIndex - 1;

  if (newIndex >= 0 && newIndex < columns.length) {
    const targetColumn = document.getElementById(columns[newIndex]);
    targetColumn.appendChild(taskCard);
  }
}

const userNameButton = document.getElementById("user-name");

window.addEventListener("DOMContentLoaded", () => {
  const initial = localStorage.getItem("userInitial") || "G";
  if (userNameButton) {
    userNameButton.textContent = initial;
  }
});

function loadTasksFromFirebase() {

  fetch(`${BASE_URL}/tasks.json`)
    .then(res => res.json())
    .then(tasks => {
      clearColumns();
      for (let key in tasks) {
        const task = tasks[key];
        const taskCard = document.createElement("div");
        taskCard.classList.add("task-card");

        taskCard.innerHTML = `
          <h3>${task.title}</h3>
          <p>${task.description}</p>
          <p><strong>Fällig:</strong> ${task.dueDate}</p>
          <p><strong>Kategorie:</strong> ${task.category}</p>
          <div class="task-arrows">
            <button class="left-arrow">←</button>
            <button class="right-arrow">→</button>
          </div>
        `;

        taskCard.querySelector(".left-arrow").addEventListener("click", () => moveTask(taskCard, "left"));
        taskCard.querySelector(".right-arrow").addEventListener("click", () => moveTask(taskCard, "right"));

        const targetColumn = document.getElementById(task.status || "toDo");
        targetColumn.appendChild(taskCard);
      }
    })
    .catch(err => {
      console.error("Fehler beim Laden der Tasks:", err);
    });
}

function clearColumns() {
  ["toDo", "inProgress", "awaitFeedback", "done"].forEach(id => {
    const col = document.getElementById(id);
    if (col) col.innerHTML = "";
  });
}

function logout() {
  localStorage.removeItem("userInitial");

  // Optional: alle Daten löschen
  // localStorage.clear();
  window.location.href = "/index.html";
}