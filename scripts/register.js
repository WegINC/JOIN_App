/**
 * This function is used for the authentication of the Users in the Login.html
 * 
 */
function onloadFunc(){
        console.log("test");
        signupContacts("",{"anton@gmail.com": "password"});
}

let users = [];
const BASE_URL = "https://join-applikation-default-rtdb.europe-west1.firebasedatabase.app/:";



async function loadContacts(path){
    let response = await fetch(BASE_URL + path + ".json");
    return responseToJson = await response.json();
}

async function signupContacts(path= "", data) {
    let response = await fetch(BASE_URL + path + ".json",{
        method: "POST",
        header: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    });
    return responseToJson = await response.json();
}