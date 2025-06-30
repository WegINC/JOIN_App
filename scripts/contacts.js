
import {
  getContactListItemTemplate,
  getContactSeparatorTemplate,
  getContactDetailsTemplate,
  getEditOverlayTemplate,
  getAddContactOverlayTemplate,
  getSuccessPopupTemplate
} from './contacts-template.js';

document.addEventListener('DOMContentLoaded', () => {
  loadContactsFromDatabase();
  window.openAddContactOverlay = openAddContactOverlay;
  window.closeAddContactOverlay = closeAddContactOverlay;
  window.createNewContact = createNewContact;
});

async function loadContactsFromDatabase() {
  const list = document.getElementById("contact-list");
  list.innerHTML = "";

  const res = await fetch(`${BASE_URL}/users.json`);
  const data = await res.json();
  const contacts = Object.entries(data || {}).map(
    ([uid, u]) => ({ uid, ...buildContactObject(uid, u) })
  );

  const grouped = contacts.sort((a,b) => a.name.localeCompare(b.name, 'de'))
    .reduce((acc, c) => {
      const L = c.name[0].toUpperCase();
      (acc[L] ||= []).push(c);
      return acc;
    }, {});

  renderGroupedContacts(grouped);
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
      item.addEventListener("click", () => selectContact(item, contact));
      list.appendChild(item);
    });
  });
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
