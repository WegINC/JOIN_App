const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

export const Assignees = (() => {
  let cfg = { dropdownId: "assigned-dropdown", containerId: "assigned-container" };
  let selected = {};

  const getEl = id => document.getElementById(id);

  function getInitials(name="") {
    const p = name.trim().split(/\s+/);
    return (p[0]?.[0] + (p[1]?.[0] || "")).toUpperCase() || (p[0]||"").slice(0,2).toUpperCase();
  }

  function renderOption(uid, name, initials, color) {
    return `
      <label class="assignee-option" data-uid="${uid}" data-name="${name}" data-initials="${initials}" data-color="${color}">
        <div class="task-user-initials" style="background-color:${color}">${initials}</div>
        <span>${name}</span>
        <input type="checkbox" class="assignee-checkbox" />
      </label>
    `;
  }

  async function load() {
    const container = getEl(cfg.containerId);
    if (!container) return;
    container.innerHTML = "";
    try {
      const res = await fetch(`${BASE_URL}/users.json`);
      const data = await res.json() || {};
      Object.entries(data).forEach(([uid, u]) => {
        const name = u.name || "Unnamed";
        const color = u.themeColor || "#0038FF";
        const initials = getInitials(name);
        container.insertAdjacentHTML("beforeend", renderOption(uid, name, initials, color));
      });
      container.addEventListener("click", onOptionClick);
      updateView();
    } catch (e) {
      console.error("Assignees load error:", e);
    }
  }

  function onOptionClick(e) {
    const opt = e.target.closest(".assignee-option");
    if (!opt) return;
    const uid = opt.dataset.uid;
    const checkbox = opt.querySelector(".assignee-checkbox");
    if (selected[uid]) {
      delete selected[uid];
      opt.classList.remove("selected");
      if (checkbox) checkbox.checked = false;
    } else {
      selected[uid] = true;
      opt.classList.add("selected");
      if (checkbox) checkbox.checked = true;
    }
    updateView();
  }

  function updateView() {
    const view = getEl(cfg.dropdownId);
    const cont = getEl(cfg.containerId);
    if (!view || !cont) return;
    const initials = Array.from(cont.querySelectorAll(".assignee-option.selected"))
      .map(el => el.dataset.initials);
    view.innerText = initials.length ? initials.join(", ") : "Select contacts to assign";
  }

  function toggleDropdown() {
    const dd = getEl(cfg.containerId);
    if (dd) dd.classList.toggle("hidden");
  }

  function clickOutsideCloser(e) {
    const dd = getEl(cfg.containerId);
    const trigger = getEl(cfg.dropdownId);
    if (!dd || !trigger) return;
    const inside = dd.contains(e.target) || trigger.contains(e.target);
    if (!inside) dd.classList.add("hidden");
  }

  function init(userCfg = {}) {
    cfg = { ...cfg, ...userCfg };
    selected = {};
    load();
    document.addEventListener("click", clickOutsideCloser);
    const trigger = getEl(cfg.dropdownId);
    if (trigger) trigger.addEventListener("click", toggleDropdown);
  }

  function getSelectedMap() { return { ...selected }; }
  function hasSelection() { return Object.keys(selected).length > 0; }

  return { init, getSelectedMap, hasSelection, toggleDropdown };
})();