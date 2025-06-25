export function getContactListItemTemplate({ initials, name, email, avatarColor }) {
    return `
      <div class="contact-avatar" style="background-color:${avatarColor}">${initials}</div>
      <div class="contact-info">
        <strong>${name}</strong><br>
        <a href="mailto:${email}">${email}</a>
      </div>
    `;
  }
  
  export function getContactDetailsTemplate({ initials, name, email, phone, avatarColor }) {
    return `
      <div class="contact-details-header">
        <div class="contact-initial" style="background:${avatarColor}">${initials}</div>
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
        <p><strong>Phone:</strong><br>${phone}</p>
      </div>
    `;
  }
  
  export function getEditOverlayTemplate({ initials, name, email, phone, avatarColor }) {
    return `
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
          <div class="edit-avatar" style="background-color: ${avatarColor}">${initials}</div>
          <div class="edit-form">
            <div class="input-group">
              <input type="text" id="edit-name" value="${name}" placeholder="Name" style="background-image: url('/assets/icons/person.png'); background-repeat: no-repeat; background-position: right 10px center; background-size: 20px;">
            </div>
            <div class="input-group">
              <input type="email" id="edit-email" value="${email}" placeholder="Email" style="background-image: url('/assets/icons/mail.png'); background-repeat: no-repeat; background-position: right 10px center; background-size: 20px;">
            </div>
            <div class="input-group">
              <input type="tel" id="edit-phone" value="${phone}" placeholder="Phone" style="background-image: url('/assets/icons/call.png'); background-repeat: no-repeat; background-position: right 10px center; background-size: 20px;">
            </div>
            <div class="edit-actions">
              <button class="delete-btn">Delete</button>
              <button class="save-btn">Save <img src="/assets/icons/check.png" alt="Save Icon"></button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  export function getAddContactOverlayTemplate() {
    return `
      <div class="contact-add-overlay">
        <div class="add-overlay-left">
          <img src="../assets/icons/Capa 1.png" alt="Logo" class="add-logo">
          <h1>Add contact</h1>
          <p>Tasks are better with a team!</p>
          <div class="add-underline"></div>
        </div>
        <div class="add-overlay-right">
          <button class="add-close-btn" onclick="closeAddContactOverlay()">
            <img src="../assets/icons/close.png" alt="Close">
          </button>
          <div class="add-avatar">
            <img src="../assets/icons/person-add-profile.png" alt="User">
          </div>
          <form class="add-form">
            <div class="input-group">
              <input type="text" id="new-name" placeholder="Name" required style="background-image: url('../assets/icons/person.png'); background-repeat: no-repeat; background-position: right 10px center; background-size: 20px;">
            </div>
            <div class="input-group">
              <input type="email" id="new-email" placeholder="Email" required style="background-image: url('../assets/icons/mail.png'); background-repeat: no-repeat; background-position: right 10px center; background-size: 20px;">
            </div>
            <div class="input-group">
              <input type="tel" id="new-phone" placeholder="Phone" required style="background-image: url('../assets/icons/call.png'); background-repeat: no-repeat; background-position: right 10px center; background-size: 20px;">
            </div>
            <div class="add-actions">
              <button type="button" class="cancel-btn delete-btn" onclick="closeAddContactOverlay()">
                Cancel <img src="../assets/icons/close.png">
              </button>
              <button type="button" class="create-btn" onclick="createNewContact()">
                Create contact <img src="../assets/icons/check.png">
              </button>
            </div>
          </form>
        </div>
      </div>`;
  }