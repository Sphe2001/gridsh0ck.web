// Prototype auth: no real accounts, no credential storage or verification.
// A role picked in the form just decides which portal to redirect to.
const AUTH_DESTINATIONS = { citizen: 'citizen.html', electrician: 'electrician.html', municipal: 'dashboard.html' };

document.querySelectorAll('form[data-auth-form]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const role = form.querySelector('[name="role"]').value;
    const loadingLabel = form.dataset.loadingLabel || 'Please wait...';

    btn.disabled = true;
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingLabel}`;

    setTimeout(() => {
      window.location.href = AUTH_DESTINATIONS[role] || 'dashboard.html';
    }, 700);
  });
});
