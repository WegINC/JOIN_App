
let contacts = [];
let selectedContactForOptions = null;

import {
  getContactListItemTemplate,
  getContactSeparatorTemplate,
  getContactDetailsTemplate,
  getEditOverlayTemplate,
  getEditContactMobileOverlayTemplate,
  getAddContactOverlayTemplate,
  getAddContactMobileOverlayTemplate,
  getSuccessPopupTemplate,
} from './contacts-template.js';

document.addEventListener('DOMContentLoaded', () => {
  loadContactsFromDatabase();
  window.openAddContactOverlay = openAddContactOverlay;
  window.closeAddContactOverlay = closeAddContactOverlay;
  window.createNewContact = createNewContact;
  const mobileAddBtn = document.getElementById('mobile-add-contact-btn');
  if (mobileAddBtn) {
    mobileAddBtn.addEventListener('click', openAddContactMobileOverlay);}
  document.body.addEventListener('click', (event) => {
    const target = event.target.closest('#contact-options-btn');
    if (target) {
      openMobileEditContactOverlay();
    }});
  document.querySelector('.back-arrow').addEventListener('click', () => {
    returnToContactList();
    handleMobileButtons();
  });
});

async function loadContactsFromDatabase() {
  const list = document.getElementById("contact-list");
  list.innerHTML = "";

  const res = await fetch(`${BASE_URL}/users.json`);
  const data = await res.json();

  contacts = Object.entries(data || {}).map(
    ([uid, u]) => ({ uid, ...buildContactObject(uid, u) })
  );

  const grouped = contacts.sort((a, b) => a.name.localeCompare(b.name, 'de'))
    .reduce((acc, c) => {
      const L = c.name[0].toUpperCase();
      (acc[L] ||= []).push(c);
      return acc;
    }, {});

  const simpleContacts = contacts.map(c => ({
    name: c.name,
    color: c.color || "#cccccc"
  }));

  localStorage.setItem("contacts", JSON.stringify(simpleContacts));
  console.log("Kontakte gespeichert:", simpleContacts);

  renderGroupedContacts(grouped);
}

function buildContactObject(uid, user) {
  const name = user.name || '';
  const email = user.email || '';
  const phone = user.phone || '';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const color = user.themeColor || generateRandomColor();
  return { uid, name, email, phone, initials, color };
}

function generateRandomColor() {
  const colors = ['#29ABE2', '#FF7A00', '#6E52FF', '#FC71FF', '#1FD7C1', '#FFBB2B'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function renderGroupedContacts(groups) {
  const list = document.getElementById("contact-list");
  list.innerHTML = "";

  Object.keys(groups).sort().forEach(letter => {
    const sep = document.createElement("div");
    sep.innerHTML = getContactSeparatorTemplate(letter);
    sep.className = "contact-separator";
    list.appendChild(sep);

    groups[letter].forEach(contact => {
      const item = document.createElement("div");
      item.className = "contact-item";
      item.innerHTML = getContactListItemTemplate(contact);
      contact.element = item;
      item.addEventListener("click", () => {
        selectContact(item, contact);
        selectedContactForOptions = contact;  
      });
      list.appendChild(item);
    });
  });
}

function renderContactListItem(contact) {
  const contactList = document.getElementById("contact-list");
  const item = document.createElement("div");
  item.className = "contact-item";
  item.innerHTML = getContactListItemTemplate(contact);
  contact.element = item;

  item.addEventListener("click", () => selectContact(item, contact));
  contactList.appendChild(item);
}

function renderContactDetails(contact) {
  const content = document.getElementById('contact-details-content');
  content.innerHTML = getContactDetailsTemplate(contact);

  content.querySelector('.edit-btn').addEventListener('click', () => openEditOverlay(contact));
  content.querySelector('.delete-btn').addEventListener('click', () => deleteContact(contact));
}

async function deleteContact(contact) {
  if (!confirm(`Möchtest du ${contact.name} wirklich löschen?`)) return;

  try {
    await fetch(`${BASE_URL}/users/${contact.uid}.json`, { method: 'DELETE' });
    contact.element.remove();
    document.getElementById('contact-details-content').innerHTML = '';
    closeEditOverlay();
  } catch (err) {
    alert("Fehler beim Löschen.");
  }
}

function openEditOverlay(contact) {
  const overlay = document.getElementById('edit-contact-overlay');
  overlay.style.display = 'flex';
  overlay.innerHTML = getEditOverlayTemplate(contact);

  overlay.addEventListener('click', e => e.target === overlay && closeEditOverlay());
  overlay.querySelector('.edit-close-btn').addEventListener('click', closeEditOverlay);
  overlay.querySelector('.delete-btn').addEventListener('click', () => deleteContact(contact));
  overlay.querySelector('.save-btn').addEventListener('click', () => saveContactChanges(contact));
}

function closeEditOverlay() {
  const overlay = document.getElementById('edit-contact-overlay');
  overlay.innerHTML = '';
  overlay.style.display = 'none';
}

async function saveContactChanges(contact) {
  const newName = document.getElementById('edit-name').value.trim();
  const newEmail = document.getElementById('edit-email').value.trim();
  const newPhone = document.getElementById('edit-phone').value.trim();

  if (!newName || !newEmail || !newPhone) return alert('Bitte fülle alle Felder aus!');

  try {
    await updateContactInDB(contact.uid, { name: newName, email: newEmail, phone: newPhone });
    updateContactData(contact, newName, newEmail, newPhone);
    renderContactDetails(contact);
    closeEditOverlay();
  } catch (err) {
    alert("Fehler beim Speichern der Änderungen.");
  }
}

async function updateContactInDB(uid, data) {
  await fetch(`${BASE_URL}/users/${uid}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

function updateContactData(contact, name, email, phone) {
  contact.name = name;
  contact.email = email;
  contact.phone = phone;
  contact.initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  contact.element.querySelector('.contact-avatar').textContent = contact.initials;
  contact.element.querySelector('.contact-info').innerHTML = `
    <strong>${name}</strong><br>
    <a href="mailto:${email}">${email}</a>
  `;
}

function openAddContactOverlay() {
  const overlay = document.getElementById('add-contact-overlay');
  overlay.classList.remove('hidden');
  overlay.style.display = 'flex';
  overlay.innerHTML = getAddContactOverlayTemplate();

  overlay.addEventListener('click', event => event.target === overlay && closeAddContactOverlay());
}

function closeAddContactOverlay() {
  const overlay = document.getElementById('add-contact-overlay');
  overlay.innerHTML = '';
  overlay.classList.add('hidden');
  overlay.style.display = 'none';
}

async function createNewContact() {
  const name = document.getElementById('new-name').value.trim();
  const email = document.getElementById('new-email').value.trim();
  const phone = document.getElementById('new-phone').value.trim();

  if (!name || !email || !phone) return alert('Bitte fülle alle Felder aus!');

  try {
    const color = generateRandomColor();
    const contact = buildContactObject('', { name, email, phone, themeColor: color });

    const res = await fetch(`${BASE_URL}/users.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, themeColor: color })
    });

    const data = await res.json();
    contact.uid = data.name;
    renderContactListItem(contact);
    closeAddContactOverlay();
    showSuccessPopup();
  } catch (err) {
    alert("Fehler beim Erstellen des Kontakts.");
  }
}

function showSuccessPopup() {
  const popup = document.createElement('div');
  popup.innerHTML = getSuccessPopupTemplate();
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 3000);
}

function toggleUserMenu() {
  const menu = document.getElementById('user-dropdown');
  menu.classList.toggle('hidden');
}

function closeUserMenu(event) {
  const menu = document.getElementById('user-dropdown');
  const button = document.getElementById('user-name');
  const overlay = document.getElementById('contact-options-overlay');


  if (!menu.contains(event.target) && event.target !== button) {
    menu.classList.add('hidden');
  }
}

function selectContact(item, contact) {
  selectedContactForOptions = contact; 

  document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
  item.classList.add('active');
  renderContactDetails(contact);
  showContactDetailsMobile(); 
  handleMobileButtons(); 
}

function showContactDetailsMobile() {
  document.body.classList.add('show-contact-details-mobile');
}

function returnToContactList() {
  document.body.classList.remove('show-contact-details-mobile');
  handleMobileButtons(); 
}

function showContactList() {
  document.getElementById('contact-list-content').classList.remove('d-none');
  document.getElementById('contact-details-container').classList.add('d-none');
  handleMobileButtons(); 
}

function showContactDetails() {
  document.getElementById('contact-list-content').classList.add('d-none');
  document.getElementById('contact-details-container').classList.remove('d-none');
  handleMobileButtons(); 
}

function handleMobileButtons() {
  const addBtn = document.getElementById('mobile-add-contact-btn');
  const optionsBtn = document.getElementById('contact-options-btn');
  const isMobile = window.innerWidth <= 1024;
  const isDetailVisible = document.body.classList.contains('show-contact-details-mobile');

  if (isMobile && optionsBtn && !optionsBtn.dataset.listenerAttached) {
    optionsBtn.addEventListener('click', () => {
      openMobileEditContactOverlay();
    });
    optionsBtn.dataset.listenerAttached = 'true';
  }

  if (!addBtn || !optionsBtn) return;

  if (isMobile) {
    if (isDetailVisible) {
      addBtn.classList.add('hidden');
      optionsBtn.classList.remove('hidden');
    } else {
      addBtn.classList.remove('hidden');
      optionsBtn.classList.add('hidden');
    }
  } else {
    addBtn.classList.add('hidden');
    optionsBtn.classList.add('hidden');
  }
}

function openMobileEditContactOverlay() {
  const overlay = document.getElementById('contact-options-overlay');
  if (!selectedContactForOptions) return;

  overlay.innerHTML = `
    <button class="edit-btn" title="Edit" onclick="editContactOptions()">
    <img src="../assets/icons/edit-button.png">Edit</button>
    <button class="delete-btn" title="Delete" onclick="deleteContactOptions()">
    <img src="../assets/icons/delete-button.png">Delete</button>
  `;
  overlay.classList.remove('hidden');
}

document.addEventListener('click', function (event) {
  const overlay = document.getElementById('contact-options-overlay');
  const isOverlayVisible = !overlay.classList.contains('hidden');

  if (!isOverlayVisible) return;

  const clickedInsideOverlay = overlay.contains(event.target);
  const clickedOnOptionsBtn = event.target.closest('#contact-options-btn');

  if (!clickedInsideOverlay && !clickedOnOptionsBtn) {
    closeContactOptionsOverlay();
  }
});

function closeContactOptionsOverlay() {
  const overlay = document.getElementById('contact-options-overlay');
  overlay.classList.add('hidden');
}

function editContactOptions() {
  if (!selectedContactForOptions) return;

  closeContactOptionsOverlay();

  const isMobile = window.innerWidth <= 1024;

  if (isMobile) {
    openEditMobileOverlay(selectedContactForOptions); 
  } else {
    openEditOverlay(selectedContactForOptions);
  }
}

async function deleteContactOptions() {
  if (!selectedContactForOptions) return;
  if (!confirm(`Möchtest du ${selectedContactForOptions.name} wirklich löschen?`)) return;

  try {
    await fetch(`${BASE_URL}/users/${selectedContactForOptions.uid}.json`, {
      method: 'DELETE',
    });

    selectedContactForOptions.element.remove();
    document.getElementById('contact-details-content').innerHTML = '';
    closeContactOptionsOverlay();
  } catch (err) {
    alert("Fehler beim Löschen.");
  }
}

function openEditMobileOverlay(contact) {
  const overlay = document.getElementById('edit-contact-overlay');
  overlay.style.display = 'flex';
  overlay.innerHTML = getEditContactMobileOverlayTemplate(contact);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeEditOverlay();
  });
  overlay.querySelector('.edit-close-btn').addEventListener('click', closeEditOverlay);
  overlay.querySelector('.delete-btn').addEventListener('click', () => deleteContact(contact));
  overlay.querySelector('.save-btn').addEventListener('click', () => saveContactChanges(contact));
}

function openEditOverlayWrapper(contact) {
  if (window.innerWidth <= 768) {
    openEditMobileOverlay(contact);
  } else {
    openEditOverlay(contact);
  }
}

function openAddContactMobileOverlay() {
  const overlay = document.getElementById('add-contact-overlay');
  overlay.classList.remove('hidden');
  overlay.style.display = 'flex';
  overlay.innerHTML = getAddContactMobileOverlayTemplate({});

  overlay.addEventListener('click', event => {
    if (event.target.classList.contains('overlay-bg')) {
      closeAddContactOverlay();
    }
  });
}

window.deleteContactOptions = deleteContactOptions;
window.addEventListener('resize', handleMobileButtons);
window.returnToContactList = returnToContactList;
window.selectContact = selectContact;
window.editContactOptions = editContactOptions;
window.closeEditOverlay = closeEditOverlay;