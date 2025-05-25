const tasks = [
  {
    title: "Kochwelt Page & Recipe Recommender",
    description: "Build start page with recipe recommendation...",
    status: "in-progress",
    category: "User Story",
    subtasks: { done: 1, total: 2 },
    assignees: ["AA", "MB"]
  },
  {
    title: "HTML Base Template Creation",
    description: "Create reusable HTML base templates...",
    status: "await-feedback",
    category: "Technical Task",
    assignees: ["CE", "CA", "AV"]
  },
  {
    title: "Daily Kochwelt Recipe",
    description: "Implement daily recipe and portion calculator...",
    status: "await-feedback",
    category: "User Story",
    assignees: ["ES", "TW"]
  },
  {
    title: "CSS Architecture Planning",
    description: "Define CSS naming conventions and structure...",
    status: "done",
    category: "Technical Task",
    subtasks: { done: 2, total: 2 },
    assignees: ["EK", "EZ"]
  }
];

const statusOrder = ["to-do", "in-progress", "await-feedback", "done"];

function createTaskCard(task, index) {
  const card = document.createElement("div");
  card.classList.add("task-card");
  card.classList.add(task.category.toLowerCase().replace(" ", "-"));

  const title = document.createElement("p");
  title.className = "task-title";
  title.innerText = task.title;

  const desc = document.createElement("p");
  desc.innerText = task.description;

  card.appendChild(title);
  card.appendChild(desc);

  if (task.subtasks) {
    const subtask = document.createElement("div");
    subtask.className = "subtask";
    subtask.innerText = `${task.subtasks.done}/${task.subtasks.total} Subtasks`;
    card.appendChild(subtask);
  }

  const assignees = document.createElement("div");
  assignees.className = "assigned-users";
  assignees.innerText = task.assignees.join(" ");
  card.appendChild(assignees);

  // Arrow Controls
  const arrows = document.createElement("div");
  arrows.style.display = "flex";
  arrows.style.justifyContent = "space-between";
  arrows.style.marginTop = "10px";

  const left = document.createElement("button");
  left.innerText = "←";
  left.onclick = () => moveTask(index, -1);

  const right = document.createElement("button");
  right.innerText = "→";
  right.onclick = () => moveTask(index, 1);

  arrows.appendChild(left);
  arrows.appendChild(right);
  card.appendChild(arrows);

  return card;
}

function moveTask(index, direction) {
  const currentStatus = tasks[index].status;
  const currentIdx = statusOrder.indexOf(currentStatus);
  const newIdx = currentIdx + direction;
  if (newIdx >= 0 && newIdx < statusOrder.length) {
    tasks[index].status = statusOrder[newIdx];
    renderTasks();
  }
}

function renderTasks() {
  const columns = {
    "to-do": document.querySelector(".column:nth-child(1)"),
    "in-progress": document.querySelector(".column:nth-child(2)"),
    "await-feedback": document.querySelector(".column:nth-child(3)"),
    "done": document.querySelector(".column:nth-child(4)")
  };

  for (let col in columns) {
    columns[col].querySelectorAll(".task-card").forEach((e) => e.remove());
  }

  tasks.forEach((task, index) => {
    const card = createTaskCard(task, index);
    if (task.status && columns[task.status]) {
      columns[task.status].appendChild(card);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderTasks();

  document.querySelector(".add-task").addEventListener("click", () => {
    window.open("floating_add_task.html", "_blank", "width=800,height=600");
  });
});