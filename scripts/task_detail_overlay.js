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
    .catch(err => showMessage("Fehler beim Öffnen des Task-Overlays:", err));
}

document.addEventListener("taskDataReady", (e) => fillTaskDetails(e.detail));

async function fetchUsersSafe() {
  try {
    if (typeof fetchUsers === "function") {
      const u = await fetchUsers();
      if (u && typeof u === "object") return u;
    }
  } catch (_) { }

  try {
    const res = await fetch(`${BASE_URL}/users.json`);
    return (await res.json()) || {};
  } catch (_) {
    return {};
  }
}


async function fillTaskDetails(task) {
  const categoryColors = { "Technical Task": "#1FD7C1", "User Story": "#0038FF" };

  const categoryEl = document.getElementById("task-category");
  const category = task.category || "-";
  categoryEl.textContent = category;
  categoryEl.style.backgroundColor = categoryColors[category] || "#ccc";

  document.getElementById("task-title").textContent = task.title || "";
  document.getElementById("task-description").textContent = task.description || "";
  document.getElementById("task-due-date").textContent = task.dueDate || "-";

  const prText = String(task.priority || "-").trim();
  document.getElementById("task-priority").textContent =
    prText.charAt(0).toUpperCase() + prText.slice(1).toLowerCase();
  document.getElementById("task-priority-icon").innerHTML = getPriorityIcon(prText);

  const usersMap = await fetchUsersSafe();
  const assignedTo = task.assignedTo || {};
  const assignees = Object.keys(assignedTo).map(uid => ({
    initials: usersMap[uid]?.initials || "G",
    color: usersMap[uid]?.themeColor || "#0038FF"
  }));
  renderOverlayAssigneeChips(document.getElementById("assigned-users"), assignees, 3);

  const subtaskList = document.getElementById("subtask-list");
  subtaskList.innerHTML = "";
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  subtasks.forEach((sub, idx) => {
    const row = document.createElement("div");
    row.className = "subtask-item";
    row.innerHTML = `
      <input type="checkbox" ${sub.done ? "checked" : ""} onchange="toggleSubtask(${idx})" class="subtask-checkbox" />
      <span class="subtask-title ${sub.done ? "done" : ""}">${sub.title}</span>
    `;
    subtaskList.appendChild(row);
  });

  const badges = document.getElementById("assigned-users");
  if (badges) badges.style.display = "flex";
}

function renderOverlayAssigneeChips(container, list, max = 3) {
  if (!container) return;
  container.innerHTML = "";
  const visible = list.slice(0, max);
  const rest = list.length - visible.length;
  visible.forEach(a => {
    const chip = document.createElement("div");
    chip.className = "task-user-initials";
    chip.style.backgroundColor = a.color;
    chip.textContent = a.initials;
    container.appendChild(chip);
  });
  if (rest > 0) {
    const more = document.createElement("div");
    more.className = "task-user-initials more-chip";
    more.textContent = `+${rest}`;
    container.appendChild(more);
  }
}

let overlaySubtasks = [];

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
  document.getElementById("task-due-date").innerHTML = `<input type="date" id="edit-due-date" value="${due}">`;
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
      btns.forEach(x => x.classList.remove("active","urgent","medium","low"));
      b.classList.add("active", val);
      document.getElementById("edit-priority").setAttribute("data-selected", val);
    };
  });
}

function setupSubtaskEditor() {
  overlaySubtasks = Array.isArray(window.currentTaskData.subtasks)
    ? window.currentTaskData.subtasks.map(s => ({...s}))
    : [];

  const row   = document.getElementById("subtask-input-row");
  const input = document.getElementById("subtask-input");
  row.style.display = "";
  input.value = "";
  row.classList.remove("is-editing");
  input.oninput = () => {
    const hasText = input.value.trim().length > 0;
    row.classList.toggle("is-editing", hasText);
  };

  renderOverlaySubtaskList();
}

function renderOverlaySubtaskList() {
  const host = document.getElementById("subtask-list");
  host.innerHTML = "";
  const ul = document.createElement("ul");
  ul.className = "subtask-bullet-list";

  overlaySubtasks.forEach((st, i) => {
    const li = document.createElement("li");
    li.className = "subtask-li";
    li.innerHTML = `
      <span>${escapeHtml(st.title)}</span>
      <span class="subtask-actions-right">
        <button type="button" class="subtask-icon-btn" title="Edit" onclick="startOverlaySubtaskEdit(${i})"><img src="../assets/icons/edit-button.png" alt="Edit" /></button>
        <button type="button" class="subtask-icon-btn" title="Delete" onclick="deleteOverlaySubtask(${i})"><img src="../assets/icons/delete-button.png" alt="Delete" /></button>
      </span>
    `;
    ul.appendChild(li);
  });

  host.appendChild(ul);
}

function cancelOverlaySubtask() {
  const row   = document.getElementById("subtask-input-row");
  const input = document.getElementById("subtask-input");
  input.value = "";
  row.classList.remove("is-editing");
}

function confirmOverlaySubtask() {
  const input = document.getElementById("subtask-input");
  const val = input.value.trim();
  if (!val) { cancelOverlaySubtask(); return; }
  overlaySubtasks.push({ title: val, done: false });
  cancelOverlaySubtask();
  renderOverlaySubtaskList();
}

function startOverlaySubtaskEdit(index) {
  const host = document.getElementById("subtask-list");
  const li = host.querySelectorAll(".subtask-li")[index];
  const current = overlaySubtasks[index]?.title || "";

  li.innerHTML = `
    <div class="subtask-edit-row">
      <input class="subtask-edit-input" id="st-edit-${index}" value="${escapeHtml(current)}">
      <button type="button" class="subtask-icon-btn" title="Delete" onclick="deleteOverlaySubtask(${index})"><img src="../assets/icons/delete-button.png" alt="Delete" /></button>
      <button type="button" class="subtask-icon-btn" title="Save" onclick="applyOverlaySubtaskEdit(${index})">✔</button>
    </div>
  `;
  const inp = document.getElementById(`st-edit-${index}`);
  inp.focus();
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); applyOverlaySubtaskEdit(index); }
    if (e.key === "Escape") { e.preventDefault(); renderOverlaySubtaskList(); }
  });
}

function applyOverlaySubtaskEdit(index) {
  const inp = document.getElementById(`st-edit-${index}`);
  const val = (inp?.value || "").trim();
  if (!val) { deleteOverlaySubtask(index); return; }
  overlaySubtasks[index].title = val;
  renderOverlaySubtaskList();
}

function deleteOverlaySubtask(index) {
  overlaySubtasks.splice(index, 1);
  renderOverlaySubtaskList();
}

function escapeHtml(s){return (s||"").replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]))}

function initAssigneeDropdown() {
  const badges  = document.getElementById("assigned-users");
  if (badges) badges.style.display = "";

  const trigger = document.getElementById("fa-assigned-dropdown");
  const menu    = document.getElementById("fa-assigned-container");
  if (!trigger || !menu) { showMessage("Assignee-UI fehlt."); return; }

  trigger.classList.remove("hidden");
  menu.addEventListener("click", e => e.stopPropagation());

  window.overlaySelectedAssignees = {};
  Object.keys(window.currentTaskData.assignedTo || {}).forEach(uid => {
    window.overlaySelectedAssignees[uid] = true;
  });

  loadAssigneeOptionsInto(menu, trigger).then(() => {
    updateAssigneePreviewChips(menu);
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

async function loadAssigneeOptionsInto(menu) {
  const res = await fetch(`${BASE_URL}/users.json`);
  const users = (await res.json()) || {};

  menu.innerHTML = "";
  const frag = document.createDocumentFragment();

  Object.entries(users).forEach(([uid, u]) => {
    const name = u.name || "Unnamed";
    const color = u.themeColor || "#0038ff";
    const initials = (name.trim().split(/\s+/).map(p=>p[0]).slice(0,2).join("") || name.slice(0,2)).toUpperCase();

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

  menu.addEventListener("click", (e) => {
    const row = e.target.closest(".assignee-option");
    if (!row || e.target.classList.contains("assignee-checkbox")) return;
    e.preventDefault();
    const cb = row.querySelector(".assignee-checkbox");
    const newState = !cb.checked;
    cb.checked = newState;
    row.classList.toggle("selected", newState);
    const uid = row.dataset.uid;
    if (newState) window.overlaySelectedAssignees[uid] = true;
    else delete window.overlaySelectedAssignees[uid];
    updateAssigneePreviewChips(menu);
  });

  menu.addEventListener("change", (e) => {
    if (!e.target.classList.contains("assignee-checkbox")) return;
    const row = e.target.closest(".assignee-option");
    const checked = e.target.checked;
    row.classList.toggle("selected", checked);
    const uid = row.dataset.uid;
    if (checked) window.overlaySelectedAssignees[uid] = true;
    else delete window.overlaySelectedAssignees[uid];
    updateAssigneePreviewChips(menu);
  });
}

function updateAssigneePreviewChips(menu, max = 3) {
  const container = document.getElementById("assigned-users");
  if (!container) return;
  const list = [...menu.querySelectorAll(".assignee-option.selected")].map(el => ({
    initials: el.dataset.initials,
    color: el.querySelector(".task-user-initials")?.style.backgroundColor || "#0038FF"
  }));
  renderOverlayAssigneeChips(container, list, max);
}

function saveEditedTask() {
  const taskId = window.currentTaskId;
  if (!taskId) { showMessage("Fehlende Task-ID"); return; }

  const priorityEl    = document.getElementById("edit-priority");
  const newPriority   = priorityEl ? priorityEl.getAttribute("data-selected") : null;
  const finalPriority = (newPriority !== null && newPriority !== undefined)
    ? newPriority
    : window.currentTaskData.priority;

  const assignedTo = { ...(window.overlaySelectedAssignees || {}) };
  if (!Object.keys(assignedTo).length) {
    showMessage("Bitte mindestens eine Person zuweisen.");
    return;
  }

  const updatedTask = {
    title:       document.getElementById("task-title").textContent.trim(),
    description: document.getElementById("task-description").textContent.trim(),
    dueDate:     document.getElementById("edit-due-date").value,
    priority:    finalPriority,
    subtasks:    overlaySubtasks,             // <— neue Liste
    assignedTo
  };

  fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTask),
  })
  .then(() => {
    window.currentTaskData = { ...window.currentTaskData, ...updatedTask };
    loadTasks();
    openTaskDetailOverlay(window.currentTaskData, taskId);
  })
  .catch((err) => showMessage("Fehler beim Speichern:", err));
}

function deleteTask() {
  const taskId = window.currentTaskId;
  if (!taskId) { showMessage("Task-ID fehlt!"); return; }
  if (!confirm("Möchtest du diese Aufgabe wirklich löschen?")) return;

  fetch(`${BASE_URL}/tasks/${taskId}.json`, { method: "DELETE" })
    .then(() => { showMessage(`Task ${taskId} gelöscht`); closeTaskOverlay(); loadTasks(); })
    .catch((err) => showMessage("Fehler beim Löschen:", err));
}

function toggleSubtask(index) {
  const task = window.currentTaskData;
  if (!task.subtasks || !task.subtasks[index]) return;
  task.subtasks[index].done = !task.subtasks[index].done;
  updateSubtasksInFirebase(window.currentTaskId, task.subtasks);
}

function updateSubtasksInFirebase(taskId, subtasks) {
  fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtasks }),
  })
  .then(() => { fillTaskDetails(window.currentTaskData); loadTasks(); })
  .catch((err) => showMessage("Fehler beim Subtask-Update:", err));
}

function getPriorityIcon(priority) {
  const pr = String(priority || "").trim().toLowerCase();
  if (pr === "urgent") return `<img src="../assets/icons/urgent.svg" alt="Urgent Icon" class="priority-icon">`;
  if (pr === "medium") return `<img src="../assets/icons/medium.svg" alt="Medium Icon" class="priority-icon">`;
  if (pr === "low")    return `<img src="../assets/icons/low.svg"    alt="Low Icon" class="priority-icon">`;
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