let users = [];
const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".sign-up");
  btn?.addEventListener("click", handleSignup);

  ["name","email","password","confirmPassword"].forEach(n => {
    const el = document.querySelector(`input[name="${n}"]`);
    el?.addEventListener("input", () => clearInputError(el));
  });
  const checkbox = document.getElementById("checkbox");
  checkbox?.addEventListener("change", () => clearCheckboxError(checkbox));
});

async function handleSignup(){
  const nameEl  = document.querySelector("input[name='name']");
  const emailEl = document.querySelector("input[name='email']");
  const pwdEl   = document.querySelector("input[name='password']");
  const pwd2El  = document.querySelector("input[name='confirmPassword']");
  const okEl    = document.getElementById("checkbox");

  clearAllErrors(nameEl, emailEl, pwdEl, pwd2El);
  clearCheckboxError(okEl);

  const name  = (nameEl?.value || "").trim();
  const email = (emailEl?.value || "").trim();
  const pwd   = (pwdEl?.value || "");
  const pwd2  = (pwd2El?.value || "");

  let hasError = false;

  if (!name)   { setInputError(nameEl,  "Please enter your name."); hasError = true; }
  if (!email)  { setInputError(emailEl, "Please enter your email."); hasError = true; }
  else if (!isValidEmail(email)) {
    setInputError(emailEl, "Please enter a valid email.");
    hasError = true;
  }
  if (!pwd)    { setInputError(pwdEl,   "Please enter a password."); hasError = true; }
  if (!pwd2)   { setInputError(pwd2El,  "Please confirm your password."); hasError = true; }
  if (pwd && pwd2 && pwd !== pwd2) {
    setInputError(pwd2El, "Passwords do not match.");
    hasError = true;
  }
  if (!okEl?.checked) {
    setCheckboxError(okEl, "Please accept the Privacy Policy.");
    hasError = true;
  }

  if (hasError) return;
  submitSignup(name, email.toLowerCase(), pwd);
}

async function submitSignup(name, email, pwd){
  try {
    const r = await fetch(BASE_URL + "/users.json");
    const data = await r.json() || {};

    for (const k in data) {
      const em = (data[k].email || "").trim().toLowerCase();
      if (em === email) {
        const emailEl = document.querySelector("input[name='email']");
        setInputError(emailEl, "Email already exists.");
        return;
      }
    }

    const newUid = "uid_" + (Object.keys(data).length + 1);
    const body = JSON.stringify({ name, email, password: pwd });

    const put = await fetch(BASE_URL + "/users/" + newUid + ".json", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body
    });

    if (!put.ok) {
      const pwdEl = document.querySelector("input[name='password']");
      setInputError(pwdEl, "Something went wrong. Please try again.");
      return;
    }

    showIcon("../assets/img/signedUp-successfully.svg");
    setTimeout(() => { window.location.href = "../index.html"; }, 1200);
  } catch (e) {
    const pwdEl = document.querySelector("input[name='password']");
    setInputError(pwdEl, "Something went wrong. Please try again later.");
  }
}

function isValidEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function setInputError(input, message){
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

function clearInputError(input){
  if (!input) return;
  input.classList.remove("input-error");
  const msg = input.nextElementSibling;
  if (msg && msg.classList.contains("input-error-text")) msg.remove();
}

function clearAllErrors(...inputs){
  inputs.forEach(clearInputError);
}

function setCheckboxError(checkbox, message){
  if (!checkbox) return;
  const label = checkbox.closest("label");
  if (!label) return;

  let msg = label.nextElementSibling;
  if (!msg || !msg.classList.contains("checkbox-error-text")) {
    msg = document.createElement("div");
    msg.className = "checkbox-error-text";
    label.parentNode.insertBefore(msg, label.nextSibling);
  }
  msg.textContent = message;
}

function clearCheckboxError(checkbox){
  if (!checkbox) return;
  const label = checkbox.closest("label");
  if (!label) return;
  const msg = label.nextElementSibling;
  if (msg && msg.classList.contains("checkbox-error-text")) msg.remove();
}

function showIcon(src, duration = 1500) {
  const icon = document.getElementById("alert-icon");
  if (!icon) return;
  icon.src = src;
  icon.classList.remove("hidden");
  setTimeout(() => icon.classList.add("hidden"), duration);
}

window.ensureEmailValid = function(inputEl){
  if(!inputEl){ return { ok:false, msg:"E-Mail-Feld fehlt" }; }
  const val = (inputEl.value || "").trim();
  if(!isValidEmail(val)){ return { ok:false, msg:"Bitte eine gültige E-Mail." }; }
  return { ok:true, email: val.toLowerCase() };
};