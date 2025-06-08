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

  const taskCard = document.createElement("div");
  taskCard.classList.add("task-card");

    taskCard.innerHTML = `
      <h3>${title}</h3>
      <p>${description}</p>
      <p><strong>Fällig:</strong> ${dueDate}</p>
      <p><strong>Kategorie:</strong> ${category}</p>
      <div class="task-arrows">
        <button class="left-arrow">←</button>
        <button class="right-arrow">→</button>
      </div>
    `;

  taskCard.querySelector(".left-arrow").addEventListener("click", () => moveTask(taskCard, "left"));
  taskCard.querySelector(".right-arrow").addEventListener("click", () => moveTask(taskCard, "right"));

  document.getElementById("toDo").appendChild(taskCard);
  closePopup();
}

window.addEventListener("click", function (event) {
  const popup = document.getElementById("popup-container");
  if (!popup) return;

  if (popup.style.display === "block" && !popup.contains(event.target)) {
    closePopup();
  }
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".column-titles button").forEach(button => {
    button.addEventListener("click", openFloatingAddTaskPopup);
  });

  const addTaskButton = document.querySelector(".add-task-button");
  if (addTaskButton) {
    addTaskButton.addEventListener("click", openFloatingAddTaskPopup);
  }
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