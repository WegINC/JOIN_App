/**
 * This function is used for the authentication of the Users in the Login.html
 * 
 */
async function onloadFunc() {
  const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";
  const emailInput = document.querySelector('input[name="email"]').value.trim();
  const passwordInput = document.querySelector('input[name="password"]').value;

  if (!emailInput || !passwordInput) {
    console.warn("Bitte E-Mail und Passwort eingeben.");
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
        window.location.href = "/pages/board.html";
        break;
      }
    }

    if (!matchFound) {
      console.warn("E-Mail oder Passwort falsch.");
    }
  } catch (error) {
    console.error("Login-Fehler:", error);
  }
}