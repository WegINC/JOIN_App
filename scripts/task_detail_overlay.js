function openTaskDetailOverlay(task, taskId) {
  fetch("/pages/task_detail_overlay.html")
    .then((res) => res.text())
    .then((html) => {
      const container = document.getElementById("task-detail-container");
      container.innerHTML = html;
      container.style.display = "block";

      window.currentTaskId = taskId;
      window.currentTaskData = { ...task, id: taskId };

      const overlayEvent = new CustomEvent("taskDataReady", { detail: task });
      document.dispatchEvent(overlayEvent);
    });
}

document.addEventListener("taskDataReady", function (e) {
  fillTaskDetails(e.detail);
});

async function fillTaskDetails(task) {
  document.getElementById("task-category").textContent = task.category || "-";
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
      badge.textContent = user.initials || "U";
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
    <span 
      class="subtask-title ${sub.done ? 'done' : ''}" 
      contenteditable="true" 
      onblur="editSubtask(${idx}, this.textContent.trim())"
    >
      ${sub.title}
    </span>
    <input 
      type="checkbox" 
      ${sub.done ? "checked" : ""} 
      onchange="toggleSubtask(${idx})" 
      class="subtask-checkbox"
    />
  `;

  subtaskList.appendChild(subDiv);
});

  if (!document.getElementById("new-subtask-input")) {
    const addNew = document.createElement("div");
    addNew.style.marginTop = "10px";
    addNew.innerHTML = `
      <input id="new-subtask-input" type="text" placeholder="Add new subtask" style="width: 70%;" />
      <button onclick="addNewSubtask()" style="padding: 5px 10px;">+</button>
    `;
    subtaskList.parentElement.appendChild(addNew);
  }
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
    return `<img src="/assets/icons/urgent-icon.svg" alt="Urgent Icon" class="priority-icon">`;
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
  document.getElementById("task-title").setAttribute("contenteditable", true);
  document.getElementById("task-description").setAttribute("contenteditable", true);

  const dueDate = window.currentTaskData.dueDate || "";
  document.getElementById("task-due-date").innerHTML = `<input type="date" id="edit-due-date" value="${dueDate}">`;

  const category = window.currentTaskData.category || "";
  document.getElementById("task-category").innerHTML = `
    <select id="edit-category">
      <option>Design</option>
      <option>Development</option>
      <option>Testing</option>
    </select>`;
  document.getElementById("edit-category").value = category;

  const priority = window.currentTaskData.priority || "";
  document.getElementById("task-priority").innerHTML = `
    <select id="edit-priority">
      <option value="urgent">Urgent</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>`;
  document.getElementById("edit-priority").value = priority;

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
    category: document.getElementById("edit-category").value,
    priority: document.getElementById("edit-priority").value,
  };

  fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTask),
  })
    .then(() => {
      console.log("Task aktualisiert");
      closeTaskOverlay();
      loadTasks();
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