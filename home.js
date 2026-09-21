document.getElementById('contactForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const note = document.getElementById('contactNote');
  note.textContent = 'Thanks! This is a prototype, so your message was not actually sent anywhere.';
  note.style.display = 'block';
  e.target.reset();
});

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
navToggle?.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});
// Close the mobile menu after tapping a link inside it
navMenu?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});
