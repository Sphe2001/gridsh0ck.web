document.getElementById('contactForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const note = document.getElementById('contactNote');
  note.textContent = 'Thanks! This is a prototype, so your message was not actually sent anywhere.';
  note.style.display = 'block';
  e.target.reset();
});

// The nav rides transparently over the hero photograph, then solidifies once it
// would otherwise sit on white page content.
const homeNav = document.getElementById('homeNav');
const syncNav = () => homeNav?.classList.toggle('is-solid', window.scrollY > 24);
syncNav();
window.addEventListener('scroll', syncNav, { passive: true });

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
