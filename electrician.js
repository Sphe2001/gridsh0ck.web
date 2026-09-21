// Navigation
function nav(target) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const link = document.querySelector(`.nav-item[data-section="${target}"]`);
  if (link) link.classList.add('active');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('section-' + target);
  if (sec) sec.classList.add('active');
  if (target === 'jobs') renderJobsGrid();
}

document.querySelectorAll('.nav-item[data-section]').forEach(link => {
  link.addEventListener('click', e => { e.preventDefault(); nav(link.dataset.section); });
});

// Type selectors
document.querySelectorAll('.type-selector').forEach(sel => {
  sel.querySelectorAll('.type-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      sel.querySelectorAll('.type-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });
});

// Job data
const JOBS = [
  { id: 'OT1042', ref: '#OT-1042', type: 'Electricity', area: 'Block X', address: '12 Mabunda Street, Block X', lat: -25.5050, lng: 28.0750, priority: 'Critical', status: 'In Progress', duration: '3h 20m', desc: 'No power to entire street. Transformer suspected. Affects 25 households.', reported: '21 Sep, 06:50' },
  { id: 'OT1047', ref: '#OT-1047', type: 'Electricity', area: 'Block GG', address: '3 Sithole Avenue, Block GG', lat: -25.5250, lng: 28.0800, priority: 'High', status: 'In Progress', duration: '1h 05m', desc: 'Flickering lights and tripped circuit breaker. Possible overload.', reported: '21 Sep, 09:00' },
  { id: 'OT1051', ref: '#OT-1051', type: 'Electricity', area: 'Block S', address: '9 Nkosi Road, Block S', lat: -25.5180, lng: 28.1020, priority: 'Critical', status: 'Assigned', duration: '45m', desc: 'Complete blackout. Affects 40+ households. Substation fault suspected.', reported: '21 Sep, 09:20' },
  { id: 'OT1055', ref: '#OT-1055', type: 'Electricity', area: 'Block AA', address: '14 Tau Street, Block AA', lat: -25.5150, lng: 28.1150, priority: 'Critical', status: 'Pending', duration: '25m', desc: 'Exposed live wire reported near school. Dangerous situation.', reported: '21 Sep, 09:40' },
  { id: 'OT1058', ref: '#OT-1058', type: 'Electricity', area: 'Block R', address: '7 Mabunda Street, Block R', lat: -25.5290, lng: 28.0700, priority: 'High', status: 'Pending', duration: '10m', desc: 'Street lights out for 3 days. Safety concern at night.', reported: '21 Sep, 09:55' },
];

const jobStatuses = {};
JOBS.forEach(j => { jobStatuses[j.id] = j.status; });

// Render jobs grid
function renderJobsGrid(filter = 'all') {
  const grid = document.getElementById('jobsGrid');
  if (!grid) return;
  const filtered = filter === 'all' ? JOBS : JOBS.filter(j => {
    if (filter === 'critical') return j.priority === 'Critical';
    if (filter === 'high') return j.priority === 'High';
    if (filter === 'assigned') return j.status === 'Assigned';
    if (filter === 'inprogress') return j.status === 'In Progress';
    return true;
  });
  grid.innerHTML = filtered.map(j => {
    const st = jobStatuses[j.id] || j.status;
    const stClass = st === 'Critical' ? 'red' : st === 'In Progress' ? 'orange' : st === 'Assigned' ? 'teal' : st === 'Pending' ? 'purple' : 'green';
    const prClass = j.priority === 'Critical' ? 'red' : j.priority === 'High' ? 'orange' : 'green';
    return `<div class="job-card" onclick="openJob('${j.id}')">
      <div class="jc-header"><div class="jr-badge electricity"><i class="fa-solid fa-bolt"></i> ${j.type}</div><span class="badge ${prClass}">${j.priority}</span></div>
      <div class="jc-id">${j.ref}</div>
      <div class="jc-area"><i class="fa-solid fa-location-dot"></i> ${j.address}</div>
      <div class="jc-desc">${j.desc}</div>
      <div class="jc-footer"><span class="badge ${stClass}">${st}</span><span class="jc-time"><i class="fa-solid fa-clock"></i> ${j.duration}</span></div>
    </div>`;
  }).join('');
}

// Filter buttons on jobs page
document.querySelectorAll('.job-filters .tog').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.job-filters .tog').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderJobsGrid(btn.dataset.filter);
  });
});

// Open job detail modal
let detailMapInstance = null;

function openJob(id) {
  const job = JOBS.find(j => j.id === id);
  if (!job) return;
  const st = jobStatuses[id] || job.status;
  const steps = ['Assigned', 'In Progress', 'Completed'];
  const stepIdx = steps.indexOf(st);

  document.getElementById('modalTitle').textContent = `${job.ref} — ${job.area}`;
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-body-inner">
      <div class="detail-meta">
        <div class="detail-meta-item"><div class="detail-meta-label">Type</div><div class="detail-meta-val"><i class="fa-solid fa-bolt" style="color:var(--orange)"></i> ${job.type}</div></div>
        <div class="detail-meta-item"><div class="detail-meta-label">Priority</div><div class="detail-meta-val">${job.priority}</div></div>
        <div class="detail-meta-item"><div class="detail-meta-label">Address</div><div class="detail-meta-val">${job.address}</div></div>
        <div class="detail-meta-item"><div class="detail-meta-label">Reported</div><div class="detail-meta-val">${job.reported}</div></div>
      </div>
      <div class="card" style="padding:14px;background:var(--bg);">
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">Issue Description</div>
        <div style="font-size:13px;color:var(--text);">${job.desc}</div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;">Update Status</div>
        <div class="status-stepper" id="stepper-${id}">
          ${steps.map((s, i) => `<button class="step-btn ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}" onclick="setStatus('${id}', '${s}', ${i})">${i < stepIdx ? '✓ ' : ''}${s}</button>`).join('')}
        </div>
      </div>
      <div id="detailMap-${id}" style="height:240px;border-radius:10px;overflow:hidden;"></div>
      <div class="detail-actions">
        <a class="nav-directions" href="https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}" target="_blank"><i class="fa-solid fa-diamond-turn-right"></i> Get Directions</a>
        <button class="btn-primary" onclick="closeModal();nav('notes')"><i class="fa-solid fa-pen-to-square"></i> Add Notes</button>
        <button class="btn-primary" onclick="closeModal();nav('evidence')"><i class="fa-solid fa-camera"></i> Upload Evidence</button>
        <button class="complete-btn" onclick="markComplete('${id}')"><i class="fa-solid fa-circle-check"></i> Mark as Resolved</button>
      </div>
      <div id="complete-msg-${id}" class="success-banner" style="display:none;"><i class="fa-solid fa-circle-check"></i><div><b>Job ${job.ref} marked as Resolved.</b> The municipality has been notified.</div></div>
    </div>`;

  document.getElementById('jobModal').style.display = 'flex';

  // Init map inside modal after render
  setTimeout(() => {
    const mapEl = document.getElementById(`detailMap-${id}`);
    if (mapEl && !mapEl._leaflet_id) {
      const m = L.map(mapEl).setView([job.lat, job.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(m);
      L.marker([job.lat, job.lng]).bindPopup(`<b>${job.ref}</b><br>${job.address}`).openPopup().addTo(m);
    }
  }, 100);
}

function closeModal() {
  document.getElementById('jobModal').style.display = 'none';
}

document.getElementById('jobModal').addEventListener('click', e => {
  if (e.target === document.getElementById('jobModal')) closeModal();
});

// Set status via stepper
function setStatus(id, status, idx) {
  jobStatuses[id] = status;
  const steps = ['Assigned', 'In Progress', 'Completed'];
  const stepper = document.getElementById(`stepper-${id}`);
  if (!stepper) return;
  stepper.querySelectorAll('.step-btn').forEach((btn, i) => {
    btn.className = 'step-btn' + (i < idx ? ' done' : i === idx ? ' active' : '');
    btn.textContent = (i < idx ? '✓ ' : '') + steps[i];
  });
}

// Mark complete
function markComplete(id) {
  setStatus(id, 'Completed', 2);
  jobStatuses[id] = 'Completed';
  const msg = document.getElementById(`complete-msg-${id}`);
  if (msg) { msg.style.display = 'flex'; msg.scrollIntoView({ behavior: 'smooth' }); }
}

// Accept / Reject job requests
function acceptJob(id) {
  const card = document.getElementById(`req-${id}`);
  if (card) {
    card.style.borderLeft = '3px solid var(--primary)';
    card.querySelector('.jr-actions').innerHTML = '<span class="badge green" style="padding:8px 14px;">Accepted</span>';
    jobStatuses[id] = 'Assigned';
  }
}

function rejectJob(id) {
  const card = document.getElementById(`req-${id}`);
  if (card) {
    card.style.opacity = '.4';
    card.querySelector('.jr-actions').innerHTML = '<span class="badge red" style="padding:8px 14px;">Rejected</span>';
  }
}

// Notes save
function saveNotes() {
  const el = document.getElementById('notes-success');
  if (el) { el.style.display = 'flex'; el.scrollIntoView({ behavior: 'smooth' }); }
}

// Evidence submit
function submitEvidence() {
  const el = document.getElementById('evidence-success');
  if (el) { el.style.display = 'flex'; el.scrollIntoView({ behavior: 'smooth' }); }
}

// File drop zone mock
const dropZone = document.getElementById('dropZone');
const preview = document.getElementById('uploadPreview');
if (dropZone) {
  dropZone.addEventListener('click', () => {
    const count = (preview?.children.length || 0) + 1;
    const thumb = document.createElement('div');
    thumb.className = 'preview-thumb';
    thumb.innerHTML = `<i class="fa-solid fa-image"></i><span class="rm" onclick="this.parentElement.remove()">×</span>`;
    preview?.appendChild(thumb);
  });
}

// Init jobs grid on load
renderJobsGrid();
