function onloadFunc(){
        console.log("test");
}

let users = [];
const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app/";

document.addEventListener("DOMContentLoaded", function () {
  const signupBtn = document.querySelector(".sign-up");

  signupBtn.addEventListener("click", async function () {
    const name = document.querySelector('input[name="name"]').value.trim();
    const email = document.querySelector('input[name="email"]').value.trim();
    const password = document.querySelector('input[name="password"]').value;
    const confirmPassword = document.querySelector('input[name="confirmPassword"]').value;
    const acceptedPolicy = document.getElementById("checkbox").checked;

    if (!name || !email || !password || !confirmPassword) {
      showMessage("Bitte alle Felder ausfüllen.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (!acceptedPolicy) {
      showMessage("Bitte akzeptiere die Datenschutzrichtlinie.");
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
      })

      .then(() => {
      showIcon("../assets/img/signedUp-successfully.svg");
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1500);
    })

    } catch (error) {
      showMessage("Es ist ein Fehler aufgetreten.");
    }
  });
});

window.addEventListener("load", () => {
  const introLogo = document.getElementById("intro-logo");

  if (introLogo) {
    
    introLogo.classList.add("animate-logo");

    setTimeout(() => {
      introLogo.remove();
      document.body.classList.add("loaded");
    }, 1000);
  } else {
    document.body.classList.add("loaded");
  }
});

function showIcon(src, duration = 1500) {
  const icon = document.getElementById("alert-icon");
  if (!icon) return;
  icon.src = src;
  icon.classList.remove("hidden");
  setTimeout(() => {
    icon.classList.add("hidden");
  }, duration);
}

function showMessage(message, duration = 1500) {
  const msg = document.getElementById("alert-text-message");
  if (!msg) return;

  msg.textContent = message;
  msg.classList.remove("hidden");
  void msg.offsetWidth;

  setTimeout(() => {
    msg.classList.add("hidden");
  }, duration);
}