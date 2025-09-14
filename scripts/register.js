let users = []
const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app"

function onloadFunc(){
  const email = document.querySelector("input[name='email']")
  if(email){
    email.setAttribute("required","true")
  }
}

document.addEventListener("DOMContentLoaded", () => {
  onloadFunc()
  const btn = document.querySelector(".sign-up")
  if(!btn){ return }
  btn.addEventListener("click", () => {
    handleSignup()
  })
})

function handleSignup(){
  const nameEl = document.querySelector("input[name='name']")
  const emailEl = document.querySelector("input[name='email']")
  const pwdEl = document.querySelector("input[name='password']")
  const pwd2El = document.querySelector("input[name='confirmPassword']")
  const ok = document.getElementById("checkbox")
  const name = nameEl ? nameEl.value.trim() : ""
  const pwd = pwdEl ? pwdEl.value : ""
  const pwd2 = pwd2El ? pwd2El.value : ""
  if(!name || !emailEl || !pwd || !pwd2){ showMessage("Bitte alle Felder ausfüllen."); return }
  if(!emailEl.checkValidity()){ showMessage("Bitte eine gültige E-Mail."); return }
  if(pwd !== pwd2){ showMessage("Die Passwörter stimmen nicht überein."); return }
  if(!ok || !ok.checked){ showMessage("Bitte akzeptiere die Datenschutzrichtlinie."); return }
  const email = emailEl.value.trim().toLowerCase()
  submitSignup(name,email,pwd)
}

function submitSignup(name,email,pwd){
  fetch(BASE_URL + "/users.json")
  .then(r => r.json())
  .then(data => {
    if(!data){ data = {} }
    let exists = false
    for(const k in data){
      const em = (data[k].email||"").trim().toLowerCase()
      if(em===email){ exists = true }
    }
    if(exists){ showMessage("E-Mail existiert bereits."); return }
    const newUid = "uid_" + (Object.keys(data).length+1)
    const body = JSON.stringify({name:name,email:email,password:pwd})
    return fetch(BASE_URL + "/users/"+newUid+".json",{method:"PUT",headers:{"Content-Type":"application/json"},body:body})
  })
  .then(res => {
    if(!res){return}
    if(!res.ok){showMessage("Es ist ein Fehler aufgetreten.");return}
    showIcon("../assets/img/signedUp-successfully.svg")
    setTimeout(()=>{window.location.href="../index.html"},1500)
  })
  .catch(()=>{showMessage("Es ist ein Fehler aufgetreten.")})
}

function showIcon(src,duration){
  if(duration===undefined){duration=1500}
  const icon = document.getElementById("alert-icon")
  if(!icon){return}
  icon.src = src
  icon.classList.remove("hidden")
  setTimeout(()=>{icon.classList.add("hidden")},duration)
}

function showMessage(message,duration){
  if(duration===undefined){duration=1500}
  const msg = document.getElementById("alert-text-message")
  if(!msg){return}
  msg.textContent = message
  msg.classList.remove("hidden")
  void msg.offsetWidth
  setTimeout(()=>{msg.classList.add("hidden")},duration)
}

window.ensureEmailValid = function(inputEl){
  if(!inputEl){return {ok:false,msg:"E-Mail-Feld fehlt"}}
  inputEl.setAttribute("required","true")
  if(!inputEl.checkValidity()){return {ok:false,msg:"Bitte eine gültige E-Mail."}}
  return {ok:true,email:(inputEl.value||"").trim().toLowerCase()}
}