
let users = [];
const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app";

function onloadFunc(){
  var email = document.querySelector("input[name='email']");
  if(email){ email.setAttribute("required","true"); }
}

document.addEventListener("DOMContentLoaded", function () {
  onloadFunc();
  var btn = document.querySelector(".sign-up");
  if(!btn) return;
  btn.addEventListener("click", function(){ handleSignup(); });
});

function handleSignup(){
  var name = (document.querySelector("input[name='name']")?.value||"").trim();
  var emailEl = document.querySelector("input[name='email']");
  var pwd = document.querySelector("input[name='password']")?.value||"";
  var pwd2 = document.querySelector("input[name='confirmPassword']")?.value||"";
  var ok = document.getElementById("checkbox")?.checked;
  if(!name || !emailEl || !pwd || !pwd2){ showMessage("Bitte alle Felder ausfüllen."); return; }
  if(!emailEl.checkValidity()){ showMessage("Bitte eine gültige E-Mail."); return; }
  if(pwd !== pwd2){ showMessage("Die Passwörter stimmen nicht überein."); return; }
  if(!ok){ showMessage("Bitte akzeptiere die Datenschutzrichtlinie."); return; }
  var email = emailEl.value.trim().toLowerCase();
  submitSignup(name, email, pwd);
}

async function submitSignup(name, email, pwd){
  try{
    var res = await fetch(BASE_URL + "/users.json");
    var users = await res.json() || {};
    for(var id in users){
      var em = (users[id].email||"").trim().toLowerCase();
      if(em===email){ showMessage("E-Mail existiert bereits."); return; }
    }
    var newUid = "uid_"+(Object.keys(users).length+1);
    var body = JSON.stringify({ name:name, email:email, password:pwd });
    await fetch(BASE_URL + "/users/"+newUid+".json",{ method:"PUT", headers:{ "Content-Type":"application/json" }, body:body });
    showIcon("../assets/img/signedUp-successfully.svg");
    setTimeout(function(){ window.location.href="../index.html"; },1500);
  }catch(e){ showMessage("Es ist ein Fehler aufgetreten."); }
}


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

window.ensureEmailValid = function(inputEl){
  if(!inputEl){ return { ok:false, msg:"E-Mail-Feld fehlt" }; }
  inputEl.setAttribute("required","true");
  if(!inputEl.checkValidity()){ return { ok:false, msg:"Bitte eine gültige E-Mail." }; }
  return { ok:true, email:(inputEl.value||"").trim().toLowerCase() };
};