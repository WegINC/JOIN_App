
import {
  getContactListItemTemplate,
  getContactDetailsTemplate,
  getEditOverlayTemplate,
  getAddContactOverlayTemplate
} from './contacts-template.js';


async function loadContactsFromDatabase() {
  const contactList = document.getElementById("contact-list");
  contactList.innerHTML = "";

  try {
    const response = await fetch(`${BASE_URL}/users.json`);
    const users = await response.json();

    for (let uid in users) {
      const user = users[uid];
      const name = user.name || '';
      const email = user.email || '';
      const phone = user.phone || '';
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

      const item = document.createElement("div");
      item.className = "contact-item";
      item.innerHTML = getContactListItemTemplate({ initials, name, email, avatarColor: color });

      contactList.appendChild(item);

      const contact = { uid, initials, name, email, phone, avatarColor: color, element: item };

      item.addEventListener("click", () => {
        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        renderContactDetails(contact);
      });
    }
  } catch (err) {
    console.error("Fehler beim Laden:", err);
  }
}

function renderContactDetails(contact) {
  const { uid, initials, name, email, phone, avatarColor, element } = contact;
  const contactDetailsContent = document.getElementById('contact-details-content');

  contactDetailsContent.innerHTML = getContactDetailsTemplate({ initials, name, email, phone, avatarColor });

  contactDetailsContent.querySelector('.edit-btn').addEventListener('click', () => {
    openEditOverlay(contact);
  });

  contactDetailsContent.querySelector('.delete-btn').addEventListener('click', async () => {
    if (confirm(`Möchtest du ${name} wirklich löschen?`)) {
      await fetch(`${BASE_URL}/users/${uid}.json`, { method: 'DELETE' });
      element.remove();
      contactDetailsContent.innerHTML = '';
    }
  });
}

function openEditOverlay(contact) {
  const { uid, initials, name, email, phone, avatarColor, element } = contact;
  const overlayContainer = document.getElementById('edit-contact-overlay');

  overlayContainer.style.display = 'flex';
  overlayContainer.innerHTML = getEditOverlayTemplate({ initials, name, email, phone, avatarColor });

  overlayContainer.addEventListener('click', event => {
    if (event.target === overlayContainer) {
      overlayContainer.innerHTML = '';
      overlayContainer.style.display = 'none';
    }
  });

  overlayContainer.querySelector('.edit-close-btn').addEventListener('click', () => {
    overlayContainer.innerHTML = '';
    overlayContainer.style.display = 'none';
  });

  overlayContainer.querySelector('.delete-btn').addEventListener('click', async () => {
    if (confirm(`Möchtest du ${name} wirklich löschen?`)) {
      await fetch(`${BASE_URL}/users/${uid}.json`, { method: 'DELETE' });
      element.remove();
      overlayContainer.innerHTML = '';
      overlayContainer.style.display = 'none';
      document.getElementById('contact-details-content').innerHTML = '';
    }
  });

  overlayContainer.querySelector('.save-btn').addEventListener('click', async () => {
    const newName = document.getElementById('edit-name').value.trim();
    const newEmail = document.getElementById('edit-email').value.trim();
    const newPhone = document.getElementById('edit-phone').value.trim();

    if (!newName || !newEmail || !newPhone) {
      alert('Bitte fülle alle Felder aus!');
      return;
    }

    try {
      await fetch(`${BASE_URL}/users/${uid}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, email: newEmail, phone: newPhone })
      });

      contact.name = newName;
      contact.email = newEmail;
      contact.phone = newPhone;
      contact.initials = newName.split(' ').map(n => n[0]).join('').toUpperCase();

      contact.element.querySelector('.contact-avatar').textContent = contact.initials;
      contact.element.querySelector('.contact-info').innerHTML = `
        <strong>${newName}</strong><br>
        <a href="mailto:${newEmail}">${newEmail}</a>
      `;
      overlayContainer.innerHTML = '';
      overlayContainer.style.display = 'none';
      renderContactDetails(contact);
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      alert("Fehler beim Speichern der Änderungen.");
    }
  });
}

function openAddContactOverlay() {
  const overlay = document.getElementById('add-contact-overlay');
  overlay.classList.remove('hidden');
  overlay.style.display = 'flex';
  overlay.innerHTML = getAddContactOverlayTemplate();

  overlay.addEventListener('click', event => {
    if (event.target === overlay) {
      overlay.innerHTML = '';
      overlay.style.display = 'none';
    }
  });
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

  if (!name || !email || !phone) {
    alert('Bitte fülle alle Felder aus!');
    return;
  }

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

  try {
    const response = await fetch(`${BASE_URL}/users.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone })
    });
    const data = await response.json();
    const uid = data.name;

    const contact = { uid, name, email, phone, initials, avatarColor: color };

    const contactList = document.getElementById('contact-list');
    const item = document.createElement('div');
    item.className = 'contact-item';
    item.innerHTML = getContactListItemTemplate({ initials, name, email, avatarColor: color });
    contact.element = item;
    contactList.appendChild(item);

    item.addEventListener('click', () => {
      document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      renderContactDetails(contact);
    });

    closeAddContactOverlay();
  } catch (err) {
    console.error("Fehler beim Erstellen:", err);
    alert("Fehler beim Erstellen des Kontakts.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadContactsFromDatabase();
  window.openAddContactOverlay = openAddContactOverlay;
  window.closeAddContactOverlay = closeAddContactOverlay;
  window.createNewContact = createNewContact;
});