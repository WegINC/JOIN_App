function openTaskDetailOverlay(task, taskId) {
  fetch(`${BASE_URL}/tasks/${taskId}.json`)
    .then(res => res.json())
    .then(freshTask => {
      return fetch("../pages/task_detail_overlay.html")
        .then(res => res.text())
        .then(html => {
          const container = document.getElementById("task-detail-container");
          container.innerHTML = html;
          container.style.display = "block";

          window.currentTaskId = taskId;
          window.currentTaskData = { ...freshTask, id: taskId };
          window.overlaySelectedAssignees = {};

          const overlayEvent = new CustomEvent("taskDataReady", { detail: window.currentTaskData });
          document.dispatchEvent(overlayEvent);
        });
    })
    .catch(err => console.error("Fehler beim Öffnen des Task-Overlays:", err));
}

document.addEventListener("taskDataReady", function (e) {
  fillTaskDetails(e.detail);
});

function renderSubtasksList() {
  const subtaskList = document.getElementById("subtask-list");
  if (!subtaskList) return;

  if (document.querySelector(".task-detail-card.editing")) {
    subtaskList.innerHTML = `
      <div class="subtask-add-row">
        <input id="new-subtask-input" type="text" placeholder="Neue Subtask hinzufügen" />
        <button onclick="addNewSubtask()">+</button>
      </div>
    `;
  } else {
    subtaskList.innerHTML = "";
  }

  const subtasks = window.currentTaskData.subtasks || [];
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
      <span class="subtask-title ${sub.done ? 'done' : ''}">
        ${sub.title}
      </span>
    `;
    subtaskList.appendChild(subDiv);
  });
}

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
  
  updateSubtasksInFirebase(
    window.currentTaskId,
    task.subtasks
  );
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
  renderSubtasksList();
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
    return `<img src="../assets/icons/urgent.svg" alt="Urgent Icon" class="priority-icon">`;
  }
  if (priority === "Medium" || priority === "medium") {
    return `<img src="../assets/icons/medium.svg" alt="Medium Icon" class="priority-icon">`;
  }
  if (priority === "Low" || priority === "low") {
    return `<img src="../assets/icons/low.svg" alt="Low Icon" class="priority-icon">`;
  }
  return "";
}

function closeTaskOverlay() {
  const container = document.getElementById("task-detail-container");
  if (!container) return;
  const card = container.querySelector(".task-detail-card");
  if (card) card.classList.remove("editing");
  container.style.display = "none";
  container.innerHTML = "";
}

function editTask() {
  const card = document.querySelector(".task-detail-card");
  if (card) card.classList.add("editing");

  setupEditableFields();
  setupPriorityEditor();
  setupSubtaskEditor();
  initAssigneeDropdown();

  const saveBtn = document.querySelector(".task-actions button:last-child");
  saveBtn.textContent = "Save";
  saveBtn.onclick = saveEditedTask;
}

function setupEditableFields() {
  const categoryEl = document.getElementById("task-category");
  if (categoryEl) categoryEl.style.visibility = "hidden";
  const iconEl = document.getElementById("task-priority-icon");
  if (iconEl) iconEl.innerHTML = "";

  const titleEl = document.getElementById("task-title");
  const descEl  = document.getElementById("task-description");
  titleEl.contentEditable = "true";
  descEl.contentEditable  = "true";
  titleEl.classList.add("editable-field");
  descEl.classList.add("editable-field");
  document.getElementById("title-span").style.display = "block";
  document.getElementById("description-span").style.display = "block";

  const due = window.currentTaskData.dueDate || "";
  document.getElementById("task-due-date").innerHTML =
    `<input type="date" id="edit-due-date" value="${due}">`;
}

function setupPriorityEditor() {
  const current = (window.currentTaskData.priority || "low").toLowerCase();
  document.getElementById("task-priority").innerHTML = `
    <div class="edit-priority" id="edit-priority">
      <a href="#" data-value="urgent" class="priority-btn-urgent">Urgent<img src="../assets/icons/urgent.svg" alt=""></a>
      <a href="#" data-value="medium" class="priority-btn-medium">Medium<img src="../assets/icons/medium.svg" alt=""></a>
      <a href="#" data-value="low" class="priority-btn-low">Low<img src="../assets/icons/low.svg" alt=""></a>
    </div>
  `;
  const btns = [...document.querySelectorAll(".edit-priority a")];
  btns.forEach(b => {
    const val = b.getAttribute("data-value");
    if (val === current) b.classList.add("active", val);
    b.onclick = (e) => {
      e.preventDefault();
      btns.forEach(x => x.classList.remove("active", "urgent", "medium", "low"));
      b.classList.add("active", val);
      document.getElementById("edit-priority").setAttribute("data-selected", val);
    };
  });
}

function setupSubtaskEditor() {
  const list = document.getElementById("subtask-list");
  if (!list) return;
  list.innerHTML = `
    <div class="subtask-add-row">
      <div class="subtask-input-wrapper">
        <input id="new-subtask-input" type="text" placeholder="Neue Subtask hinzufügen" />
        <button type="button" class="subtask-add-btn" onclick="addNewSubtask()">＋</button>
      </div>
    </div>
  `;
}


function initAssigneeDropdown() {
  const badges  = document.getElementById("assigned-users");
  if (badges) badges.style.display = "none";

  const trigger = document.getElementById("fa-assigned-dropdown");
  const menu    = document.getElementById("fa-assigned-container");
  if (!trigger || !menu) {
    console.warn("Assignee-Trigger oder -Container nicht gefunden (fa-assigned-*).");
    return;
  }
  trigger.classList.remove("hidden");

  window.overlaySelectedAssignees = {};
  Object.keys(window.currentTaskData.assignedTo || {}).forEach(uid => {
    window.overlaySelectedAssignees[uid] = true;
  });

  loadAssigneeOptionsInto(menu, trigger).then(() => {
    updateAssigneeTriggerText(menu, trigger);
  });

  if (window._overlayOutsideHandler) {
    document.removeEventListener("click", window._overlayOutsideHandler);
  }
  trigger.onclick = (e) => { e.stopPropagation(); menu.classList.toggle("hidden"); };
  window._overlayOutsideHandler = (e) => {
    if (!menu.classList.contains("hidden")) {
      const inside = menu.contains(e.target) || trigger.contains(e.target);
      if (!inside) menu.classList.add("hidden");
    }
  };
  document.addEventListener("click", window._overlayOutsideHandler);
}

async function loadAssigneeOptionsInto(menu, trigger) {
  const res   = await fetch(`${BASE_URL}/users.json`);
  const users = (await res.json()) || {};

  menu.innerHTML = "";
  const frag = document.createDocumentFragment();

  Object.entries(users).forEach(([uid, u]) => {
    const name  = u.name || "Unnamed";
    const color = u.themeColor || "#0038ff";
    const initials = (name.trim().split(/\s+/).map(p => p[0]).slice(0,2).join("") || name.slice(0,2)).toUpperCase();

    const row = document.createElement("label");
    row.className = "assignee-option";
    row.dataset.uid = uid;
    row.dataset.initials = initials;
    row.innerHTML = `
      <div class="task-user-initials" style="background-color:${color}">${initials}</div>
      <span>${name}</span>
      <input type="checkbox" class="assignee-checkbox" />
    `;

    if (window.overlaySelectedAssignees[uid]) {
      row.classList.add("selected");
      row.querySelector(".assignee-checkbox").checked = true;
    }
    frag.appendChild(row);
  });
  menu.appendChild(frag);

  menu.onclick = (e) => {
    const row = e.target.closest(".assignee-option");
    if (!row) return;
    const cb  = row.querySelector(".assignee-checkbox");
    const uid = row.dataset.uid;

    if (row.classList.contains("selected")) {
      row.classList.remove("selected");
      if (cb) cb.checked = false;
      delete window.overlaySelectedAssignees[uid];
    } else {
      row.classList.add("selected");
      if (cb) cb.checked = true;
      window.overlaySelectedAssignees[uid] = true;
    }
    updateAssigneeTriggerText(menu, trigger);
  };
}

function updateAssigneeTriggerText(menu, trigger) {
  const initials = [...menu.querySelectorAll(".assignee-option.selected")]
    .map(el => el.dataset.initials);
  trigger.innerText = initials.length ? initials.join(", ") : "Select contacts to assign";
}

function saveEditedTask() {
  const taskId = window.currentTaskId;
  if (!taskId) {
    alert("Fehlende Task-ID");
    return;
  }

  const priorityEl    = document.getElementById("edit-priority");
  const newPriority   = priorityEl ? priorityEl.getAttribute("data-selected") : null;
  const finalPriority = (newPriority !== null && newPriority !== undefined)
    ? newPriority
    : window.currentTaskData.priority;

  const assignedTo = { ...(window.overlaySelectedAssignees || {}) };
  if (!Object.keys(assignedTo).length) {
    alert("Bitte mindestens eine Person zuweisen.");
    return;
  }

  const updatedTask = {
    title:       document.getElementById("task-title").textContent.trim(),
    description: document.getElementById("task-description").textContent.trim(),
    dueDate:     document.getElementById("edit-due-date").value,
    priority:    finalPriority,
    subtasks:    window.currentTaskData.subtasks || [],
    assignedTo 
  };

  fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(updatedTask),
  })
    .then(() => {
      window.currentTaskData = { ...window.currentTaskData, ...updatedTask };
      loadTasks();
      openTaskDetailOverlay(window.currentTaskData, taskId);
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