// Prototype auth: no real accounts, no credential storage or verification.
// A role picked in the form just decides which portal to redirect to.
const AUTH_DESTINATIONS = { citizen: 'citizen.html', electrician: 'electrician.html', municipal: 'dashboard.html' };

// Keep the role description in step with the selected role. Reads from the
// checked radio so a browser-restored selection (back navigation) stays in sync.
document.querySelectorAll('form[data-auth-form]').forEach(form => {
  const note = form.querySelector('[data-role-note-target]');
  const roles = form.elements.role;

  const syncNote = () => {
    if (!note || !roles) return;
    const checked = form.querySelector('[name="role"]:checked');
    if (checked && checked.dataset.roleNote) note.textContent = checked.dataset.roleNote;
  };

  form.querySelectorAll('[name="role"]').forEach(input => input.addEventListener('change', syncNote));
  syncNote();

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    if (btn.disabled) return;

    // RadioNodeList.value resolves to the checked radio's value.
    const role = roles ? roles.value : 'citizen';
    const loadingLabel = form.dataset.loadingLabel || 'Please wait...';

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ${loadingLabel}`;

    setTimeout(() => {
      window.location.href = AUTH_DESTINATIONS[role] || 'dashboard.html';
    }, 700);
  });
});

// Password reveal. Nothing is transmitted, so this only affects what's on screen.
document.querySelectorAll('[data-reveal]').forEach(toggle => {
  const input = document.getElementById(toggle.dataset.reveal);
  if (!input) return;

  toggle.addEventListener('click', () => {
    const revealing = input.type === 'password';
    const caret = input.selectionStart;

    input.type = revealing ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(revealing));
    toggle.setAttribute('aria-label', revealing ? 'Hide password' : 'Show password');
    toggle.querySelector('i').className = revealing ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';

    input.focus();
    if (caret !== null) {
      try { input.setSelectionRange(caret, caret); } catch { /* unsupported input state */ }
    }
  });
});
