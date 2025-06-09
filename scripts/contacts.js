document.addEventListener('DOMContentLoaded', () => {
  const contactItems = document.querySelectorAll('.contact-item');
  const contactDetailsContent = document.getElementById('contact-details-content');
  const overlayContainer = document.getElementById('edit-contact-overlay');

  // Kontakt-Item klickbar machen
  contactItems.forEach(item => {
    item.addEventListener('click', () => {
      contactItems.forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      const contact = {
        initials: item.querySelector('.contact-avatar').textContent,
        name: item.querySelector('.contact-info strong').textContent,
        email: item.querySelector('.contact-info a').textContent,
        avatarColor: item.querySelector('.contact-avatar').style.backgroundColor,
        element: item
      };

      renderContactDetails(contact);
    });
  });

  // Kontakt-Details anzeigen
  function renderContactDetails(contact) {
    const { initials, name, email, avatarColor, element } = contact;

    contactDetailsContent.innerHTML = `
      <div class="contact-details-header">
        <div class="contact-initial" style="background:${avatarColor}">
          ${initials}
        </div>
        <div class="contact-name-actions">
          <h2>${name}</h2>
          <div class="contact-actions">
            <button class="edit-btn" title="Edit">
              <img src="/assets/icons/edit-button.png" alt="Edit">Edit
            </button>
            <button class="delete-btn" title="Delete">
              <img src="/assets/icons/delete-button.png" alt="Delete">Delete
            </button>
          </div>
        </div>
      </div>
      <span class="contact-text">Contact Information</span>
      <div class="contact-info-container">
        <p><strong>Email:</strong><br><a href="mailto:${email}">${email}</a></p>
        <p><strong>Phone:</strong><br>+49 1111 111 11 11</p>
      </div>
    `;

    // Edit-Button Event
    contactDetailsContent.querySelector('.edit-btn').addEventListener('click', () => {
      openEditOverlay(contact);
    });

    // Delete-Button Event
    contactDetailsContent.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm(`Möchtest du ${name} wirklich löschen?`)) {
        element.remove();
        contactDetailsContent.innerHTML = '';
      }
    });
  }

  // Overlay zum Bearbeiten anzeigen
  function openEditOverlay(contact) {
    const { initials, name, email, avatarColor, element } = contact;

    overlayContainer.style.display = 'flex';

    overlayContainer.innerHTML = `
      <div class="contact-edit-overlay">
        <div class="edit-overlay-left">
          <img src="/assets/img/Capa 1.png" alt="Logo" class="edit-logo">
          <h1>Edit contact</h1>
          <div class="edit-underline"></div>
        </div>

        <div class="edit-overlay-right">
          <button class="edit-close-btn" title="Close">
            <img src="/assets/icons/close.png" alt="Close">
          </button>

          <div class="edit-avatar" style="background-color: ${avatarColor}">
            ${initials}
          </div>

          <div class="edit-form">
            <div class="input-group">
              <input type="text" id="edit-name" value="${name}" placeholder="Name"
                style="background-image: url('/assets/icons/person.png');
                       background-repeat: no-repeat;
                       background-position: right 10px center;
                       background-size: 20px;">
            </div>

            <div class="input-group">
              <input type="email" id="edit-email" value="${email}" placeholder="Email"
                style="background-image: url('/assets/icons/mail.png');
                       background-repeat: no-repeat;
                       background-position: right 10px center;
                       background-size: 20px;">
            </div>

            <div class="input-group">
              <input type="tel" id="edit-phone" value="+49 1111 11 111 1" placeholder="Phone"
                style="background-image: url('/assets/icons/call.png');
                       background-repeat: no-repeat;
                       background-position: right 10px center;
                       background-size: 20px;">
            </div>

            <div class="edit-actions">
              <button class="delete-btn">Delete</button>
              <button class="save-btn">
                Save <img src="/assets/icons/check.png" alt="Save Icon">
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Schließen-Button
    overlayContainer.querySelector('.edit-close-btn').addEventListener('click', () => {
      overlayContainer.innerHTML = '';
      overlayContainer.style.display = 'none';
    });

    // Löschen im Overlay
    overlayContainer.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm(`Möchtest du ${name} wirklich löschen?`)) {
        element.remove();
        overlayContainer.innerHTML = '';
        overlayContainer.style.display = 'none';
        contactDetailsContent.innerHTML = '';
      }
    });

    // Speichern im Overlay
    overlayContainer.querySelector('.save-btn').addEventListener('click', () => {
      const newName = document.getElementById('edit-name').value;
      const newEmail = document.getElementById('edit-email').value;
      const newPhone = document.getElementById('edit-phone').value;
      console.log("Geändert:", newName, newEmail, newPhone);
      overlayContainer.innerHTML = '';
      overlayContainer.style.display = 'none';
    });
  }
});