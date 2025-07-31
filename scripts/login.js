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
  const introLogo = document.getElementById("intro-logo");

  if (introLogo) {
    // ➤ Animation auslösen
    introLogo.classList.add("animate-logo");

    // ➤ Dann Element nach 2s entfernen
    setTimeout(() => {
      introLogo.remove();
      document.body.classList.add("loaded");
    }, 1000);
  } else {
    document.body.classList.add("loaded");
  }
});