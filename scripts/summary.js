const SUMMARY_BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

async function updateSummary() {
  try {
    const res = await fetch(`${SUMMARY_BASE_URL}/tasks.json`);
    const data = await res.json() || {};

    const totalCount = Object.keys(data).length;
    document.getElementById("total-count").textContent = totalCount;

    const counts = {
      toDo: 0,
      inProgress: 0,
      awaitFeedback: 0,
      done: 0
    };

    let earliestDate = null;

    for (const id in data) {
      const task = data[id];

      if (counts[task.status] !== undefined) {
        counts[task.status]++;
      }

      if (task.dueDate) {
        const d = new Date(task.dueDate);
        if (!earliestDate || d < earliestDate) {
          earliestDate = d;
        }
      }
    }

    document.getElementById("todo-count").textContent          = counts.toDo;
    document.getElementById("inProgress-count").textContent    = counts.inProgress;
    document.getElementById("awaitFeedback-count").textContent = counts.awaitFeedback;
    document.getElementById("done-count").textContent          = counts.done;

    const urgentCountEl = document.getElementById("urgent-count");
    const urgentDateEl  = document.getElementById("summary_urgent_date");

    if (earliestDate) {
      urgentCountEl.textContent = "1";
      urgentDateEl.textContent  = earliestDate.toLocaleDateString("de-DE");
    } else {
      urgentCountEl.textContent = "0";
      urgentDateEl.textContent  = "-";
    }

  } catch (err) {
    console.error("Summary‑Daten konnten nicht geladen werden:", err);
  }
}

async function loadUserName() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    const res  = await fetch(`${SUMMARY_BASE_URL}/users/${userId}.json`);
    const user = await res.json();
    const name = user.name || "";

    const mainEl   = document.getElementById("greeting-user");
    if (mainEl) mainEl.textContent = name;

    const splashEl = document.getElementById("splash-user");
    if (splashEl) splashEl.textContent = name;

  } catch (err) {
    console.error("User‑Daten konnten nicht geladen werden:", err);
  }
}

function handleSplash() {
  const splash   = document.getElementById('splash-greeting');
  const wrapper  = document.querySelector('.wrapper');
  const smallScreen = window.innerWidth <= 1124;

  if (smallScreen) {
    splash.classList.remove('hidden');
    wrapper.classList.add('hidden');

    setTimeout(() => {
      splash.classList.add('fade-out');
      wrapper.classList.remove('hidden');
      wrapper.classList.add('visible');
    }, 2000);
  } else {
    splash.style.display = 'none';
    wrapper.classList.remove('hidden');
  }
}

window.addEventListener("DOMContentLoaded", () => {
  handleSplash();
  updateSummary();
  loadUserName();
});

