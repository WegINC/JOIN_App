


document.addEventListener('DOMContentLoaded', () => {
    const contactItems = document.querySelectorAll('.contact-item');
    const contactDetailsContent = document.getElementById('contact-details-content');
  
    contactItems.forEach(item => {
      item.addEventListener('click', () => {
        // Aktives Item visuell markieren
        contactItems.forEach(el => el.classList.remove('active'));
        item.classList.add('active');
  
        // Kontakt-Daten aus dem DOM extrahieren
        const contact = {
          initials: item.querySelector('.contact-avatar').textContent,
          name: item.querySelector('.contact-info strong').textContent,
          email: item.querySelector('.contact-info a').textContent,
          avatarColor: item.querySelector('.contact-avatar').style.backgroundColor,
          element: item // Referenz für späteres Entfernen
        };
  
        renderContactDetails(contact);
      });
    });
  
    function renderContactDetails(contact) {
      const { initials, name, email, avatarColor, element } = contact;
  
      contactDetailsContent.innerHTML = `
        <div class="contact-initial" style="background:${avatarColor}">
          ${initials}
        </div>
        <h2>${name}</h2>
        <div class="contact-actions">
          <button class="edit-btn" title="Edit"><img src="/assets/icons/edit-button.png" alt="Edit">Edit</button>
          <button class="delete-btn" title="Delete"><img src="/assets/icons/delete-button.png" alt="Delete">Delete</button>
        </div>
        <span class="contact-text">Contact Information</span>
        <div class="contact-info-container">
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> +49 1111 111 11 11</p>
        </div>
      `;
  
      // Event Listener für Edit
      contactDetailsContent.querySelector('.edit-btn').addEventListener('click', () => {
        alert(`Bearbeiten von ${name} (Funktion folgt)`);
      });
  
      // Event Listener für Delete
      contactDetailsContent.querySelector('.delete-btn').addEventListener('click', () => {
        if (confirm(`Möchtest du ${name} wirklich löschen?`)) {
          element.remove();
          contactDetailsContent.innerHTML = ''; // Detailsbereich leeren
        }
      });
    }
  });