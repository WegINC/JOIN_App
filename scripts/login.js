async function onloadFunc() {
  const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";
  const emailInput = document.querySelector('input[name="email"]').value.trim();
  const passwordInput = document.querySelector('input[name="password"]').value;

  hideLoginError();

  if (!emailInput || !passwordInput) {
    showLoginError("Bitte E-Mail und Passwort eingeben.");
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/users.json`);
    const users = await response.json();

    let matchFound = false;

    for (const [uid, user] of Object.entries(users)) {
      if (user.email === emailInput && user.password === passwordInput) {
        const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase();
        localStorage.setItem("userInitial", initials);
        localStorage.setItem("userId", uid);
        console.log("Login erfolgreich für:", user.name);
        matchFound = true;
        window.location.href = "./pages/summary.html";
        break;
      }
    }

    if (!matchFound) {
      showLoginError("E-Mail oder Passwort ist falsch.");
    }
  } catch (error) {
    console.error("Login-Fehler:", error);
    showLoginError("Ein Fehler ist aufgetreten. Bitte später erneut versuchen.");
  }
}

function showLoginError(message) {
  const errorDiv = document.getElementById("login-error");
  if (errorDiv) {
    errorDiv.innerText = message;
    errorDiv.style.display = "block";
  }
}

function hideLoginError() {
  const errorDiv = document.getElementById("login-error");
  if (errorDiv) {
    errorDiv.innerText = "";
    errorDiv.style.display = "none";
  }
}

window.addEventListener("load", () => {
  const logo = document.querySelector(".join-logo");
  const content = document.querySelector(".login-content");
  const sidebar = document.querySelector(".sidebar-bottom");
  const navRight = document.querySelector(".nav-right");

  // Logo-Animation starten
  document.body.classList.add("loaded");

  // Content leicht einblenden, sobald Logo anfängt zu sliden
  setTimeout(() => {
    content.style.opacity = "1";   // halbtransparent während Slide
    sidebar.style.opacity = "1";
    navRight.style.opacity = "1";
  }, 50); // kleine Verzögerung, damit CSS-Klasse geladen ist

  // Sobald Logo oben ist → Content vollständig sichtbar
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