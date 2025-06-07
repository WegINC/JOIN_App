document.addEventListener("DOMContentLoaded", function () {
  const signupBtn = document.querySelector(".sign-up");

  signupBtn.addEventListener("click", async function () {
    const name = document.querySelector('input[name="name"]').value.trim();
    const email = document.querySelector('input[name="email"]').value.trim();
    const password = document.querySelector('input[name="password"]').value;
    const confirmPassword = document.querySelector('input[name="confirmPassword"]').value;
    const acceptedPolicy = document.getElementById("checkbox").checked;

    if (!name || !email || !password || !confirmPassword) {
      alert("Bitte alle Felder ausfüllen.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (!acceptedPolicy) {
      alert("Bitte akzeptiere die Datenschutzrichtlinie.");
      return;
    }

    const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

    try {
      const res = await fetch(`${BASE_URL}/users.json`);
      const users = await res.json() || {};
      const newUid = `uid_${Object.keys(users).length + 1}`;

      const userData = {
        name,
        email,
        password
      };

      await fetch(`${BASE_URL}/users/${newUid}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });

      alert("Registrierung erfolgreich!");
      window.location.href = "/board.html";
    } catch (error) {
      console.error("Fehler bei der Registrierung:", error);
      alert("Es ist ein Fehler aufgetreten.");
    }
  });
});
