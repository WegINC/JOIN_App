function openTaskDetailOverlay(task, taskId) {
  fetch(`${BASE_URL}/tasks/${taskId}.json`)
    .then((res) => res.json())
    .then((freshTask) => {
      return fetch("/pages/task_detail_overlay.html")
        .then((res) => res.text())
        .then((html) => {
          const container = document.getElementById("task-detail-container");
          container.innerHTML = html;
          container.style.display = "block";

          window.currentTaskId = taskId;
          window.currentTaskData = { ...freshTask, id: taskId };

          const overlayEvent = new CustomEvent("taskDataReady", { detail: freshTask });
          document.dispatchEvent(overlayEvent);
        });
    });
}

document.addEventListener("taskDataReady", function (e) {
  fillTaskDetails(e.detail);
});

async function fillTaskDetails(task) {
  const categoryColors = {
    "Technical Task": "#1FD7C1",
    "User Story": "#0038FF"
  };

  const categoryEl = document.getElementById("task-category");
  const category = task.category || "-";
  const color = categoryColors[category] || "#ccc";

  categoryEl.textContent = category;
  categoryEl.style.backgroundColor = color;

  document.getElementById("task-title").textContent = task.title || "";
  document.getElementById("task-description").textContent = task.description || "";
  document.getElementById("task-due-date").textContent = task.dueDate || "-";

  const priority = task.priority || "-";
  document.getElementById("task-priority").textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
  document.getElementById("task-priority-icon").innerHTML = getPriorityIcon(priority);

  const assignedTo = task.assignedTo || {};
  const users = await fetchUsers();
  const container = document.getElementById("assigned-users");
  container.innerHTML = "";

  for (let uid in assignedTo) {
    if (users[uid]) {
      const user = users[uid];
      const badge = document.createElement("div");
      badge.className = "task-user-initials";
      badge.style.backgroundColor = user.themeColor || "#0038ff";
      badge.textContent = user.initials || "G";
      container.appendChild(badge);
    }
  }

  const subtaskList = document.getElementById("subtask-list");
  subtaskList.innerHTML = "";

  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

  subtasks.forEach((sub, idx) => {
    const subDiv = document.createElement("div");
    subDiv.className = "subtask-item";

    subDiv.innerHTML = `
      <input 
        type="checkbox" 
        ${sub.done ? "checked" : ""} 
        onchange="toggleSubtask(${idx})" 
        class="subtask-checkbox"
      />
      <span 
        class="subtask-title ${sub.done ? 'done' : ''}"
      >
        ${sub.title}
      </span>
    `;

    subtaskList.appendChild(subDiv);
  });
}

function toggleSubtask(index) {
  const task = window.currentTaskData;
  if (!task.subtasks || !task.subtasks[index]) return;

  task.subtasks[index].done = !task.subtasks[index].done;

  updateSubtasksInFirebase(task.id || window.currentTaskId, task.subtasks);
}

function editSubtask(index, newText) {
  const task = window.currentTaskData;
  if (!task.subtasks || !task.subtasks[index]) return;

  task.subtasks[index].title = newText.trim();
  updateSubtasksInFirebase(task.id || window.currentTaskId, task.subtasks);
}

function addNewSubtask() {
  const input = document.getElementById("new-subtask-input");
  const text = input.value.trim();
  if (!text) return;

  const task = window.currentTaskData;
  task.subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  task.subtasks.push({ title: text, done: false });

  input.value = "";
  updateSubtasksInFirebase(task.id || window.currentTaskId, task.subtasks);
}

function updateSubtasksInFirebase(taskId, subtasks) {
  fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtasks }),
  })
    .then(() => {
      fillTaskDetails(window.currentTaskData);
      loadTasks();
    })
    .catch((err) => console.error("Fehler beim Subtask-Update:", err));
}

function getPriorityIcon(priority) {
  if (priority === "Urgent" || priority === "urgent") {
    return `<img src="/assets/icons/urgent.svg" alt="Urgent Icon" class="priority-icon">`;
  }
  if (priority === "Medium" || priority === "medium") {
    return `<img src="/assets/icons/medium.svg" alt="Medium Icon" class="priority-icon">`;
  }
  if (priority === "Low" || priority === "low") {
    return `<img src="/assets/icons/low.svg" alt="Low Icon" class="priority-icon">`;
  }
  return "";
}

function closeTaskOverlay() {
  const container = document.getElementById("task-detail-container");
  if (container) {
    container.style.display = "none";
    container.innerHTML = "";
  }
}

function editTask() {
  const categoryEl = document.getElementById("task-category");
  if (categoryEl) {
    categoryEl.style.visibility = "hidden";
  }

  const iconEl = document.getElementById("task-priority-icon");
  if (iconEl) iconEl.innerHTML = "";

  const titleEl = document.getElementById("task-title");
  const descEl = document.getElementById("task-description");

  titleEl.setAttribute("contenteditable", true);
  descEl.setAttribute("contenteditable", true);

  titleEl.classList.add("editable-field");
  descEl.classList.add("editable-field");

  document.getElementById("title-span").style.display = "block";
  document.getElementById("description-span").style.display = "block";

  const dueDate = window.currentTaskData.dueDate || "";
  document.getElementById("task-due-date").innerHTML = `<input type="date" id="edit-due-date" value="${dueDate}">`;

  const priority = window.currentTaskData.priority || "";
  document.getElementById("task-priority").innerHTML = `
    <div class="edit-priority" id="edit-priority">
      <a href="#" data-value="urgent" class="priority-btn-urgent">Urgent<img src="/assets/icons/urgent.svg" alt=""></a>
      <a href="#" data-value="medium" class="priority-btn-medium">Medium<img src="/assets/icons/medium.svg" alt=""></a>
      <a href="#" data-value="low" class="priority-btn-low">Low<img src="/assets/icons/low.svg" alt=""></a>
    </div>`;
  const priorityButtons = document.querySelectorAll(".edit-priority a");
  const currentPriority = window.currentTaskData.priority?.toLowerCase() || "low";
  priorityButtons.forEach(btn => {
    const value = btn.getAttribute("data-value");

    if (value === currentPriority) {
      btn.classList.add("active", value);
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      priorityButtons.forEach(b => {
        b.classList.remove("active", "urgent", "medium", "low");
      });
      btn.classList.add("active", value);
      btn.closest("#edit-priority").setAttribute("data-selected", value);
    });
  });

  const subtaskList = document.getElementById("subtask-list");
  if (subtaskList) {
    subtaskList.innerHTML = `
      <div class="subtask-add-row">
        <input id="new-subtask-input" type="text" placeholder="Neue Subtask hinzufügen" />
        <button onclick="addNewSubtask()">+</button>
      </div>
    `;
  }

  const btn = document.querySelector(".task-actions button:last-child");
  btn.textContent = "Save";
  btn.onclick = saveEditedTask;
}

function saveEditedTask() {
  const taskId = window.currentTaskId;
  if (!taskId) {
    alert("Fehlende Task-ID");
    return;
  }

  const updatedTask = {
    title: document.getElementById("task-title").textContent.trim(),
    description: document.getElementById("task-description").textContent.trim(),
    dueDate: document.getElementById("edit-due-date").value,
    priority: document.getElementById("edit-priority").getAttribute("data-selected") || "low",
  };

  fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTask),
  })
    .then(() => {
      window.currentTaskData = {
        ...window.currentTaskData,
        ...updatedTask
      };
      openTaskDetailOverlay(window.currentTaskData, window.currentTaskId);
    })
    .catch((err) => console.error("Fehler beim Speichern:", err));
}

function deleteTask() {
  const taskId = window.currentTaskId;
  if (!taskId) {
    console.error("Task-ID fehlt!");
    return;
  }

  const confirmDelete = confirm("Möchtest du diese Aufgabe wirklich löschen?");
  if (!confirmDelete) return;

  fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method: "DELETE",
  })
    .then(() => {
      console.log(`Task ${taskId} gelöscht`);
      closeTaskOverlay();
      loadTasks();
    })
    .catch((err) => console.error("Fehler beim Löschen:", err));
}