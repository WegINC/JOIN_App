function addSubtaskInput() {
  const container = document.getElementById("subtask-container");
  if (!container) return;

  const inputWrapper = document.createElement("div");
  inputWrapper.style.display = "flex";
  inputWrapper.style.gap = "10px";
  inputWrapper.style.marginBottom = "5px";

  inputWrapper.innerHTML = `
    <input type="text" class="subtask-input" placeholder="Add new subtask" />
    <button type="button" onclick="addSubtaskInput()">+</button>
  `;
  container.appendChild(inputWrapper);
}

let currentSubtasks = [];

function addSubtaskInput() {
  const inputFields = document.querySelectorAll(".subtask-input");
  const lastInput = inputFields[inputFields.length - 1];
  const title = lastInput.value.trim();

  if (!title) return;

  currentSubtasks.push({ title, done: false });

  lastInput.value = "";

  renderSubtasks();
}
let assigneeMap = {};

document.addEventListener("DOMContentLoaded", () => {
  loadAssigneeSuggestions();

  const input = document.getElementById("assignee-input");
  const suggestionBox = document.getElementById("assignee-suggestions");

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    suggestionBox.innerHTML = "";

    const matches = Object.entries(assigneeMap).filter(([uid, name]) =>
      name.toLowerCase().includes(query)
    );

    if (matches.length === 0 || query.length === 0) {
      suggestionBox.classList.add("hidden");
      return;
    }

    matches.forEach(([uid, name]) => {
      const div = document.createElement("div");
      div.textContent = name;
      div.addEventListener("click", () => {
        input.value = name;
        input.dataset.uid = uid;
        suggestionBox.classList.add("hidden");
      });
      suggestionBox.appendChild(div);
    });

    suggestionBox.classList.remove("hidden");
  });

  input.addEventListener("blur", () => {
    setTimeout(() => suggestionBox.classList.add("hidden"), 150);
  });
});

async function loadAssigneeSuggestions() {
  try {
    const res = await fetch(`${BASE_URL}/users.json`);
    const data = await res.json();

    assigneeMap = {};
    for (const uid in data) {
      assigneeMap[uid] = data[uid].name;
    }
  } catch (err) {
    console.error("Fehler beim Laden der Kontakte:", err);
  }
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
    console.error("Fehler beim Laden der Kontakte für das Dropdown:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  populateAssigneeDropdown();
});

function renderSubtasks() {
  const list = document.getElementById("rendered-subtasks");
  if (!list) {
    const container = document.getElementById("subtask-container");
    const listWrapper = document.createElement("div");
    listWrapper.id = "rendered-subtasks";
    listWrapper.style.marginTop = "10px";
    container.appendChild(listWrapper);
  }

  const renderedList = document.getElementById("rendered-subtasks");
  renderedList.innerHTML = "";

  currentSubtasks.forEach((sub, idx) => {
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.gap = "10px";
    item.style.marginBottom = "5px";

    item.innerHTML = `
      <input type="checkbox" ${sub.done ? "checked" : ""} onchange="toggleSubtask(${idx})" />
      <span>${sub.title}</span>
    `;
    renderedList.appendChild(item);
  });
}

function toggleSubtask(index) {
  currentSubtasks[index].done = !currentSubtasks[index].done;
}

function getCurrentSubtasks() {
  return currentSubtasks;
}



function populateAssignedDropdown() {
  if (typeof BASE_URL === "undefined") return;

  fetch(`${BASE_URL}/contacts.json`)
    .then((res) => res.json())
    .then((data) => {
      const select = document.getElementById("assigned");
      if (!select) return;
      select.innerHTML =
        "<option disabled selected>Select contacts to assign</option>";

      for (let id in data) {
        const contact = data[id];
        const option = document.createElement("option");
        option.value = id;
        option.textContent = contact.name;
        select.appendChild(option);
      }
    })
    .catch((err) => console.error("Fehler beim Laden der Kontakte:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  populateAssignedDropdown();
});