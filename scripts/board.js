const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

let selectedPriority = "";
let faAssigneesLoaded = false;
let faOutsideHandler = null;
let faPreselectedAssignees = {};

function onloadBoard() {
  loadTasks();
  setupButtons();
  initUserInitial();
}
document.addEventListener("DOMContentLoaded", onloadBoard);

function toggleUserMenu() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.toggle('hidden');
}

function closeUserMenu(event) {
  const wrapper = document.getElementById('user-dropdown-wrapper');
  const dropdown = document.getElementById('user-dropdown');
  if (wrapper && dropdown && !wrapper.contains(event.target)) {
    dropdown.classList.add('hidden');
  }
}

function initUserInitial() {
  const initial = localStorage.getItem("userInitial") || "G";
  const nameBtn = document.getElementById("user-name");
  if (nameBtn) nameBtn.textContent = initial;
}

function logout() {
  localStorage.removeItem("userInitial");
  localStorage.removeItem("userId");
  window.location.href = "../index.html";
}

function setupButtons() {
  document.querySelectorAll(".column-title button").forEach(btn =>
    btn.addEventListener("click", () => openFloatingAddTaskPopup())
  );

  const addBtn = document.querySelector(".add-task-button");
  if (!addBtn) return;
  addBtn.addEventListener("click", () => {
    const smallScreen = window.innerWidth <= 798;
    if (smallScreen) {
      window.location.href = "../pages/add_task.html";
    } else {
      window.popupStatus = "toDo";
      openFloatingAddTaskPopup();
    }
  });
}

function setDefaultPriorityFloating() {
  const mediumBtn = document.getElementById("priority-medium");
  if (!mediumBtn) return;
  if (!document.querySelector(".priority-buttons .active")) {
    selectedPriority = "medium";
    selectPriority("medium");
  }
}

function openFloatingAddTaskPopup(options = {}) {
  fetch("../pages/floating_add_task.html")
    .then(r => r.text())
    .then(html => {
      const container = document.getElementById("popup-container");
      container.innerHTML = html;
      container.style.display = "block";

      ["urgent","medium","low"].forEach(level => {
        const btn = document.getElementById(`priority-${level}`);
        btn?.addEventListener("click", (e) => { e.preventDefault(); selectPriority(level, e); });
      });

      if (options.prefillTask?.priority) {
        selectPriority(options.prefillTask.priority);
      } else {
        setDefaultPriorityFloating();
      }

      initFloatingAssigneesDropdown();
      attachFloatingOutsideCloser();
    })
    .catch(err => showMessage("Fehler beim Laden des Popups:", err));
}

function attachFloatingOutsideCloser() {
  if (faOutsideHandler) {
    document.removeEventListener("click", faOutsideHandler, true);
    faOutsideHandler = null;
  }

  faOutsideHandler = (e) => {
    const wrapper = document.querySelector("#popup-container .assignee-dropdown-wrapper");
    const menu = document.getElementById("fa-assigned-container");
    const trigger = document.getElementById("fa-assigned-dropdown");
    if (!wrapper || !menu || !trigger) return;

    const clickedInside = wrapper.contains(e.target);
    if (!clickedInside) menu.classList.add("hidden");
  };

  document.addEventListener("click", faOutsideHandler, true);
}

function closePopup() {
  const popup = document.getElementById("popup-container");
  if (popup) { popup.style.display = "none"; popup.innerHTML = ""; }
  if (faOutsideHandler) {
    document.removeEventListener("click", faOutsideHandler, true);
    faOutsideHandler = null;
  }
}

function initFloatingAssigneesDropdown() {
  const trigger = document.getElementById("fa-assigned-dropdown");
  const menu = document.getElementById("fa-assigned-container");
  if (!trigger || !menu) return;

  trigger.addEventListener("click", handleFloatingAssigneeTriggerClick);

  menu.addEventListener("click", (e) => e.stopPropagation());

  if (!faOutsideHandler) {
    faOutsideHandler = (e) => {
      if (menu.classList.contains("hidden")) return;
      const inside = menu.contains(e.target) || trigger.contains(e.target);
      if (!inside) menu.classList.add("hidden");
    };
    document.addEventListener("click", faOutsideHandler);
  }
}

async function handleFloatingAssigneeTriggerClick(e) {
  e?.stopPropagation();
  const menu = document.getElementById("fa-assigned-container");
  if (!menu) return;

  const opening = menu.classList.contains("hidden");
  menu.classList.toggle("hidden");

  if (opening && !faAssigneesLoaded) {
    try {
      await loadFloatingAssigneeSuggestions();
      faAssigneesLoaded = true;
      applyFloatingPreselection();
      updateFloatingSelectedView();
    } catch (err) {
      showMessage("Floating Assignees konnten nicht geladen werden:", err);
    }
  }
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || "").slice(0, 2).toUpperCase();
}

function renderAssignedToContacts(uid, name, initials, color) {
  return `
    <label class="assignee-option" data-uid="${uid}" data-initials="${initials}">
      <div class="task-user-initials" style="background-color:${color}">${initials}</div>
      <span>${name}</span>
      <input type="checkbox" class="assignee-checkbox" />
    </label>
  `;
}

async function loadFloatingAssigneeSuggestions() {
  const container = document.getElementById("fa-assigned-container");
  if (!container) return;
  if (container.innerHTML.trim() !== "") return;

  try {
    const res = await fetch(`${BASE_URL}/users.json`);
    const data = (await res.json()) || {};

    const frag = document.createDocumentFragment();
    Object.entries(data).forEach(([uid, u]) => {
      const name = u.name || "Unnamed";
      const color = u.themeColor || "#0038ff";
      const initials = getInitials(name);

      const wrapper = document.createElement("div");
      wrapper.innerHTML = renderAssignedToContacts(uid, name, initials, color);
      frag.appendChild(wrapper.firstElementChild);
    });
    container.appendChild(frag);

    if (!container._boundClickHandler) {
      container._boundClickHandler = (e) => {
        const row = e.target.closest(".assignee-option");
        if (!row) return;

        const cb  = row.querySelector(".assignee-checkbox");
        const uid = row.dataset.uid;

        if (e.target !== cb) e.preventDefault();

        const willSelect = (e.target === cb)
          ? cb.checked
          : !row.classList.contains("selected");

        row.classList.toggle("selected", willSelect);
        if (cb) cb.checked = willSelect;

        if (willSelect) {
          faPreselectedAssignees[uid] = true;
        } else {
          delete faPreselectedAssignees[uid];
        }

        updateFloatingSelectedView();
      };

      container.addEventListener("click", container._boundClickHandler);
    }
  } catch (err) {
    showMessage("Fehler beim Laden der Kontakte:", err);
  }
}

function applyFloatingPreselection() {
    const cont = document.getElementById("fa-assigned-container");
    if (!cont) return;
    Object.keys(faPreselectedAssignees || {}).forEach(uid => {
      const row = cont.querySelector(`.assignee-option[data-uid="${uid}"]`);
      if (!row) return;
      row.classList.add("selected");
      const cb = row.querySelector(".assignee-checkbox");
      if (cb) cb.checked = true;
    });
  }

  function updateFloatingSelectedView() {
    const view = document.getElementById("fa-assigned-dropdown");
    const cont = document.getElementById("fa-assigned-container");
    if (!view || !cont) return;
    const initials = Array.from(cont.querySelectorAll(".assignee-option.selected"))
      .map(el => el.dataset.initials);
    view.innerText = initials.length ? initials.join(", ") : "Select contacts to assign";
  }

  function getFloatingSelectedAssignees() {
    const cont = document.getElementById('fa-assigned-container');
    if (!cont) return {};
    const checked = cont.querySelectorAll('.assignee-checkbox:checked');
    const uids = Array.from(checked)
      .map(cb => cb.closest('.assignee-option')?.dataset.uid)
      .filter(Boolean);
    return Object.fromEntries(uids.map(uid => [uid, true]));
  }

  function selectPriority(level, ev) {
    ev?.preventDefault?.();
    selectedPriority = level;
    ["urgent", "medium", "low"].forEach(l => {
      const b = document.getElementById(`priority-${l}`);
      if (b) b.classList.remove("active");
    });
    const activeBtn = document.getElementById(`priority-${level}`);
    if (activeBtn) activeBtn.classList.add("active");
  }

  function addSubtaskInput() {
    const container = document.getElementById("subtask-container");
    if (!container) return;

    const row = document.createElement("div");
    row.className = "subtask-wrapper";
    row.innerHTML = `
    <input type="text" class="subtask-input" placeholder="Add new subtask" />
    <button type="button" class="subtask-button" onclick="this.parentElement.remove()">−</button>
  `;
    container.appendChild(row);
  }

  function createTask() {
    const title = (document.getElementById("title")?.value || "").trim();
    const description = (document.getElementById("description")?.value || "").trim();
    const dueDate = document.getElementById("due")?.value || "";
    const selectedCategory = document.getElementById("category")?.value || "";
    const priority = selectedPriority || "low";

    let assignedTo = getFloatingSelectedAssignees();

    if (!Object.keys(assignedTo).length) {
      const select = document.getElementById("assigned");
      if (select) {
        const assignedUids = Array.from(select.selectedOptions)
          .filter(opt => !opt.disabled)
          .map(opt => opt.value);
        assignedTo = Object.fromEntries(assignedUids.map(uid => [uid, true]));
      }
    }

    const categoryValid = selectedCategory && selectedCategory !== "Select task category";
    const hasAssignees = Object.keys(assignedTo).length > 0;

    if (!title || !dueDate || !categoryValid || !hasAssignees) {
      showMessage("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    const subtasks = Array.from(document.querySelectorAll(".subtask-input"))
      .map(i => i.value.trim())
      .filter(Boolean)
      .map(t => ({ title: t, done: false }));

    const userInitial = localStorage.getItem("userInitial") || "G";

    const taskData = {
      title,
      description,
      dueDate,
      category: selectedCategory,
      priority,
      assignedTo,
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
          if (typeof closeTaskOverlay === "function") closeTaskOverlay();
        })
        .catch(err => showMessage("Fehler beim Aktualisieren:", err));
    } else {
      fetch(`${BASE_URL}/tasks.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      })
        .then(() => {
          showIcon("../assets/img/task-added-toBoard.svg");
          closePopup();
          loadTasks();
        })
        .catch(err => showMessage("Fehler beim Erstellen:", err));
    }
  }

  async function startEditTask(taskId) {
    try {
      const res = await fetch(`${BASE_URL}/tasks/${taskId}.json`);
      const task = await res.json();
      if (!task) return;

      window.editingTaskId = taskId;

      faPreselectedAssignees = {};
      Object.keys(task.assignedTo || {}).forEach(uid => faPreselectedAssignees[uid] = true);

      openFloatingAddTaskPopup({ prefillTask: task });
    } catch (e) {
      showMessage("Fehler beim Laden des Tasks fürs Edit:", e);
    }
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
      showMessage("Fehler beim Laden der Benutzer:", err);
      return {};
    }
  }

  function getRandomColor() {
    const colors = ["#FF5733", "#009688", "#3F51B5", "#795548", "#FF9800"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  const categoryColors = {
    "Technical Task": "#1FD7C1",
    "User Story": "#0038FF"
  };

  function getPriorityData(p) {
    const key = (p || "low").toLowerCase();
    const map = {
      urgent: { label: "Urgent", color: "#FF3D00", icon: "../assets/icons/urgent.svg" },
      medium: { label: "Medium", color: "#FFA800", icon: "../assets/icons/medium.svg" },
      low: { label: "Low", color: "#7AE229", icon: "../assets/icons/low.svg" }
    };
    return map[key] || map.low;
  }

  async function loadTasks() {
    const userInitialsMap = await fetchUsers();

    fetch(`${BASE_URL}/tasks.json`)
      .then((res) => res.json())
      .then((tasks) => {
        const columns = ["toDo", "inProgress", "awaitFeedback", "done"];
        columns.forEach(id => {
          const column = document.getElementById(id);
          if (column) column.innerHTML = "";
        });

        if (!tasks) return;

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

          const color = categoryColors[task.category] || "#ccc";
          const pr = getPriorityData(task.priority);

          card.innerHTML = `
          <div class="task-category" style="background-color: ${color};">
            ${task.category}
          </div>
          <div class="task-title"><strong>${task["title"]}</strong></div>
          <div class="task-description">${task["description"] || ""}</div>

          <div class="subtask-counter">
            <progress value="${getSubtaskProgress(task)}" max="100"></progress>
            <span>${getSubtaskLabel(task)}</span>
          </div>

          <div class="task-footer">
            <div class="task-user">
              ${userBadges}
            </div>
            <img class="task-priority-icon" src="${pr.icon}" alt="${pr.label}">
          </div>
        `;

          column.appendChild(card);
        }
      })
      .catch((error) => {
        showMessage("Fehler beim Laden der Tasks:", error);
      });
  }

  let draggedCard = null;

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
        .then(() => showMessage(`Task ${taskId} verschoben nach ${newStatus}`))
        .catch((err) => showMessage("Fehler beim Aktualisieren:", err));
    }
  }

  function openTaskDetailOverlay(task, taskId) {
    fetch("../pages/task_detail_overlay.html")
      .then((response) => response.text())
      .then((html) => {
        const container = document.getElementById("task-detail-container");
        container.innerHTML = html;
        container.style.display = "block";

        window.currentTaskId = taskId;
        window.currentTaskData = task;

        const overlayEvent = new CustomEvent("taskDataReady", { detail: task });
        document.dispatchEvent(overlayEvent);

      })
      .catch((error) => {
        showMessage("Fehler beim Laden des Task-Details:", error);
      });
  }

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
      showMessage("Fehler beim Laden der Kontakte für das Dropdown:", error);
    }
  }

  function enableDragScroll(el) {
  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;

  el.addEventListener('mousedown', (e) => {
    isDown = true;
    el.classList.add('is-dragging');
    startX = e.pageX - el.getBoundingClientRect().left;
    startScrollLeft = el.scrollLeft;
    e.preventDefault();
  });

  document.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    el.classList.remove('is-dragging');
  });

  el.addEventListener('mouseleave', () => {
    if (!isDown) return;
    isDown = false;
    el.classList.remove('is-dragging');
  });

  el.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - el.getBoundingClientRect().left;
    const delta = (x - startX) * 1;
    el.scrollLeft = startScrollLeft - delta;
  }, { passive: true });

  el.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });
}

function initBoardColumnDragScroll() {
  if (window.matchMedia('(max-width: 863px)').matches) {
    document.querySelectorAll('.board-column').forEach(enableDragScroll);
  }
}

document.addEventListener('DOMContentLoaded', initBoardColumnDragScroll);
window.addEventListener('resize', () => {
  initBoardColumnDragScroll();
});

  function showIcon(src, duration = 1500) {
    const icon = document.getElementById("alert-icon");
    if (!icon) return;
    icon.src = src;
    icon.classList.remove("hidden");
    setTimeout(() => {
      icon.classList.add("hidden");
    }, duration);
  }

  function showMessage(message, duration = 1500) {
    const msg = document.getElementById("alert-text-message");
    if (!msg) return;

    msg.textContent = message;
    msg.classList.remove("hidden");
    void msg.offsetWidth;

    setTimeout(() => {
      msg.classList.add("hidden");
    }, duration);
  }