
import {
  getContactListItemTemplate,
  getContactDetailsTemplate,
  getEditOverlayTemplate,
  getAddContactOverlayTemplate
} from './contacts-template.js';


document.addEventListener('DOMContentLoaded', () => {
  loadContactsFromDatabase();
  window.openAddContactOverlay = openAddContactOverlay;
  window.closeAddContactOverlay = closeAddContactOverlay;
  window.createNewContact = createNewContact;
});

async function loadContactsFromDatabase() {
  const contactList = document.getElementById("contact-list");
  contactList.innerHTML = "";

  try {
    const response = await fetch(`${BASE_URL}/users.json`);
    const users = await response.json();

    for (let uid in users) {
      const contact = buildContactObject(uid, users[uid]);
      renderContactListItem(contact);
    }
  } catch (err) {
    console.error("Fehler beim Laden:", err);
  }
}

function buildContactObject(uid, user) {
  const name = user.name || '';
  const email = user.email || '';
  const phone = user.phone || '';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const avatarColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  return { uid, name, email, phone, initials, avatarColor };
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

function selectContact(item, contact) {
  document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
  item.classList.add('active');
  renderContactDetails(contact);
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

  const contact = buildContactObject('', { name, email, phone });

  try {
    const res = await fetch(`${BASE_URL}/users.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone })
    });
    const data = await res.json();
    contact.uid = data.name;
    renderContactListItem(contact);
    closeAddContactOverlay();
  } catch (err) {
    alert("Fehler beim Erstellen des Kontakts.");
  }
}
