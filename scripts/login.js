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
        console.log("Login erfolgreich für:", user.name);
        matchFound = true;
        localStorage.setItem("userInitial", user.name.charAt(0).toUpperCase());
        window.location.href = "/pages/summary.html";
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