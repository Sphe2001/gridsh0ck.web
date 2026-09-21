// Navigation
function nav(target) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const link = document.querySelector(`.nav-item[data-section="${target}"]`);
  if (link) link.classList.add('active');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + target).classList.add('active');
  if (target === 'view') initCitizenMap();
}

document.querySelectorAll('.nav-item[data-section]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    nav(link.dataset.section);
  });
});

document.querySelector('.notif-btn')?.addEventListener('click', () => nav('emergency'));

// Type selectors
document.querySelectorAll('.type-selector').forEach(sel => {
  sel.querySelectorAll('.type-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      sel.querySelectorAll('.type-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });
});

// Submit report with duplicate detection
function submitReport() {
  const type = document.querySelector('#section-report .type-opt.active')?.dataset.type || 'electricity';
  const block = document.querySelector('#section-report select.form-input')?.value || '';
  // Simulate AI duplicate check: electricity + Block X = likely duplicate
  if (type === 'electricity' && block.includes('Block X')) {
    document.getElementById('dupe-warning').style.display = 'flex';
    document.getElementById('dupe-warning').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  document.getElementById('report-success').style.display = 'flex';
  document.getElementById('report-success').scrollIntoView({ behavior: 'smooth' });
}

// Submit emergency
function submitEmergency() {
  document.getElementById('emergency-success').style.display = 'flex';
  document.getElementById('emergency-success').scrollIntoView({ behavior: 'smooth' });
}

// Track report
function doTrack() {
  const val = document.getElementById('trackInput').value.trim();
  if (val) {
    document.getElementById('track-result').style.display = 'block';
    document.getElementById('track-result').scrollIntoView({ behavior: 'smooth' });
  }
}

// Confirm resolution
function confirmResolved(btn) {
  btn.closest('.confirm-item').style.display = 'none';
  document.getElementById('confirm-done').style.display = 'flex';
}

function reopenReport(btn) {
  const item = btn.closest('.confirm-item');
  item.style.border = '1.5px solid var(--red)';
  item.querySelector('.confirm-desc').textContent += ' — Reopened for review';
  btn.disabled = true;
  btn.closest('.confirm-actions').querySelector('.btn-primary').disabled = true;
}

// Citizen Map
const SOSH = [-25.5231, 28.0900];
let citizenMapInit = false;

const citizenOutages = [
  { lat: -25.5050, lng: 28.0750, label: 'Block X — Electricity (Critical)', color: '#e74c3c' },
  { lat: -25.5180, lng: 28.1020, label: 'Block S — Electricity (Critical)', color: '#e74c3c' },
  { lat: -25.5320, lng: 28.0650, label: 'Block H — Water (In Progress)', color: '#0ea5e9' },
  { lat: -25.5250, lng: 28.0800, label: 'Block GG — Electricity (In Progress)', color: '#f39c12' },
  { lat: -25.5100, lng: 28.0900, label: 'Block BB — Roads (Resolved)', color: '#1abc9c' },
  { lat: -25.5400, lng: 28.1100, label: 'Block F — Sewage (In Progress)', color: '#f39c12' },
  { lat: -25.5150, lng: 28.1150, label: 'Block AA — Electricity (Critical)', color: '#e74c3c' },
];

function initCitizenMap() {
  if (citizenMapInit) return;
  citizenMapInit = true;
  const map = L.map('citizenMap').setView(SOSH, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
  citizenOutages.forEach(o => {
    const icon = L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:${o.color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
      className: '', iconSize: [14, 14]
    });
    L.marker([o.lat, o.lng], { icon }).bindPopup(`<b>${o.label}</b>`).addTo(map);
  });
}
