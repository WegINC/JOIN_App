function toggleUserMenu() {
    let dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('hidden');
  }

  function closeUserMenu(event) {
    let dropdownWrapper = document.getElementById('user-dropdown-wrapper');
    let dropdown = document.getElementById('user-dropdown');

    if (!dropdownWrapper.contains(event.target)) {
      dropdown.classList.add('hidden');
    }
  }