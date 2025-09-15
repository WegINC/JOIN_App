async function onloadFunc() {
  const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";
  const emailEl = document.querySelector('input[name="email"]');
  const pwdEl   = document.querySelector('input[name="password"]');

  clearAllErrors(emailEl, pwdEl);

  const email = (emailEl?.value || "").trim();
  const pwd   = (pwdEl?.value || "");

  let hasError = false;
  if (!email) {
    setInputError(emailEl, "Please enter your email.");
    hasError = true;
  }
  if (!pwd) {
    setInputError(pwdEl, "Please enter your password.");
    hasError = true;
  }
  if (hasError) return;

  try {
    const res   = await fetch(`${BASE_URL}/users.json`);
    const users = await res.json();

    let ok = false;
    for (const [uid, user] of Object.entries(users || {})) {
      if (user.email === email && user.password === pwd) {
        const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase();
        localStorage.setItem("userInitial", initials);
        localStorage.setItem("userId", uid);
        ok = true;
        break;
      }
    }

    if (!ok) {
      setInputError(emailEl);
      setInputError(pwdEl, "Check your email and password. Please try again.");
      return;
    }

    window.location.href = "./pages/summary.html";
  } catch (e) {
    setInputError(pwdEl, "Something went wrong. Please try again later.");
  }
}

function setInputError(input, message) {
  if (!input) return;
  input.classList.add("input-error");

  let msg = input.nextElementSibling;
  if (!msg || !msg.classList.contains("input-error-text")) {
    msg = document.createElement("div");
    msg.className = "input-error-text";
    input.parentNode.insertBefore(msg, input.nextSibling);
  }
  msg.textContent = message || "";
}

function clearInputError(input) {
  if (!input) return;
  input.classList.remove("input-error");
  const msg = input.nextElementSibling;
  if (msg && msg.classList.contains("input-error-text")) {
    msg.remove();
  }
}

function clearAllErrors(...inputs) {
  inputs.forEach(clearInputError);
}

window.addEventListener("DOMContentLoaded", () => {
  const emailEl = document.querySelector('input[name="email"]');
  const pwdEl   = document.querySelector('input[name="password"]');
  [emailEl, pwdEl].forEach(el => {
    el?.addEventListener("input", () => clearInputError(el));
  });
});

window.addEventListener("load", () => {
  const logo = document.querySelector(".join-logo");
  const content = document.querySelector(".login-content");
  const sidebar = document.querySelector(".sidebar-bottom");
  const navRight = document.querySelector(".nav-right");

  document.body.classList.add("loaded");

  setTimeout(() => {
    content.style.opacity = "1";
    sidebar.style.opacity = "1";
    navRight.style.opacity = "1";
  }, 50);

  logo.addEventListener(
    "transitionend",
    () => {
      content.classList.add("visible");
      sidebar.classList.add("visible");
      navRight.classList.add("visible");
    },
    { once: true }
  );
});