
export function getContactListItemTemplate({ initials, name, email, color }) {
  return `
    <div class="contact-avatar" style="background-color:${color}">${initials}</div>
    <div class="contact-info">
      <strong>${name}</strong><br>
      <a href="mailto:${email}">${email}</a>
    </div>
  `;
}

export function getContactSeparatorTemplate(letter) {
  return `
    <div class="contact-separator">
      <span>${letter}</span>
      <div class="separator-line"></div>
    </div>
  `;
}

  
  export function getContactDetailsTemplate({ initials, name, email, phone, color }) {
    return `
      <div class="contact-details-header">
        <div class="contact-initial" style="background:${color}">${initials}</div>
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
  
  export function getEditOverlayTemplate({ initials, name, email, phone, color }) {
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
          <div class="edit-avatar" style="background-color: ${color}">${initials}</div>
          <div class="edit-form">
            <div class="input-group">
              <input type="text" id="edit-name" value="${name}" placeholder="Name">
            </div>
            <div class="input-group">
              <input type="email" id="edit-email" value="${email}" placeholder="Email">
            </div>
            <div class="input-group">
              <input type="tel" id="edit-phone" value="${phone}" placeholder="Phone">
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
              <input type="text" id="new-name" placeholder="Name" required>
            </div>
            <div class="input-group">
              <input type="email" id="new-email" placeholder="Email" required>
            </div>
            <div class="input-group">
              <input type="tel" id="new-phone" placeholder="Phone" required>
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
      </div>
    `;
  }
  
  export function getSuccessPopupTemplate() {
    return `
      <div style="
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #2A3647;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        font-size: 14px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: fadeInOut 3s ease-in-out;
      ">
        Contact successfully created
      </div>
    `;
  }

  export function getMobileAddContactTemplate() {
    return `
      <div id="mobile-add-contact-overlay" class="mobile-contact-overlay">
        <div class="contact-add-overlay">
          <div class="add-overlay-top">
            <h1>Add contact</h1>
            <p>Tasks are better with a team!</p>
            <div class="add-underline"></div>
          </div>
          <div class="add-overlay-buttom">
            <button class="add-close-btn" onclick="closeMobileAddContactOverlay()">
              <img src="img/close.png" alt="Close">
            </button>
            <form class="add-form">
              <div class="add-avatar">
                <img src="../assets/icons/person-add-profile.png" alt="Person Icon" width="50">
              </div>
  
              <div class="input-group">
                <div class="input-wrapper">
                 style="background-image: url(/assets/icons/person.png)"
                  <input type="text" placeholder="Name" required>
                </div>
              </div>
  
              <div class="input-group">
                <div class="input-wrapper">
                  style="background-image: url(/assets/icons/mail.png)"
                  <input type="email" placeholder="Email" required>
                </div>
              </div>
  
              <div class="input-group">
                <div class="input-wrapper">
                  style="background-image: url(/assets/icons/call.png)"
                  <input type="tel" placeholder="Phone" required>
                </div>
              </div>
  
              <div class="add-actions">
                <button type="submit" class="create-btn">
                  <img src="../assets/icons/check.png"> Create contact
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }