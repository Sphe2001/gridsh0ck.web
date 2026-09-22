// Navigation
function nav(target) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const link = document.querySelector(`.nav-item[data-section="${target}"]`);
  if (link) link.classList.add('active');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('section-' + target);
  if (sec) sec.classList.add('active');
  if (target === 'jobs') renderJobsGrid();
  if (target === 'tickets') renderTickets();
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

// ── DISPATCHED TICKETS ────────────────────────────────────────
// The field end of the shared ledger. A fault filed by a resident is assigned
// by the dispatch engine and lands here as a ticket the electrician can take
// to site — downloadable, so it still opens with no signal.

const CREW_KEY = 'gridsh0ck.crew.v1';

function currentCrewId() {
  try {
    const saved = localStorage.getItem(CREW_KEY);
    if (saved && GridState.crewById(saved)) return saved;
  } catch (err) { /* storage blocked — fall back to the default crew */ }
  return 'jd';
}

function setCrew(id) {
  try { localStorage.setItem(CREW_KEY, id); } catch (err) { /* not fatal */ }
  knownTickets = new Set(GridState.getTicketsFor(id, true).map(t => t.ref));
  renderCrewIdentity();
  renderTickets();
}

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderCrewIdentity() {
  const id = currentCrewId();
  const crew = GridState.crewById(id);
  if (!crew) return;

  const select = document.getElementById('crewSelect');
  if (select) {
    const roster = GridState.getCrew();
    select.innerHTML = roster.map(c =>
      `<option value="${esc(c.id)}"${c.id === id ? ' selected' : ''}>${esc(c.name)} (${c.activeJobs})</option>`
    ).join('');
  }

  const set = (elId, value) => { const el = document.getElementById(elId); if (el) el.textContent = value; };
  set('crewAvatar', crew.initials);
  set('crewName', crew.name);
  set('crewTeam', crew.team);
  set('ticketCrewLabel', 'Listening for tickets — ' + crew.name);
}

function storageWarning() {
  if (GridState.storageWorks()) return '';
  return '<div class="storage-warning">' +
    '<i class="fa-solid fa-triangle-exclamation"></i>' +
    '<div><b>The portals cannot share data right now.</b> This page was opened straight ' +
    'from disk, so the browser keeps each page storage separate and a report filed in ' +
    'one portal never reaches the others. Serve the folder instead &mdash; ' +
    '<code>python -m http.server 8000</code> &mdash; and open it from ' +
    '<code>http://localhost:8000</code>.</div></div>';
}

function renderTickets() {
  const crewId = currentCrewId();
  const all = GridState.getTicketsFor(crewId, true);
  const open = all.filter(t => t.status !== 'Resolved');

  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set('tk-open', open.length);
  set('tk-critical', open.filter(t => t.priority === 'Critical').length);
  set('tk-progress', all.filter(t => t.status === 'In Progress').length);
  set('tk-done', all.filter(t => t.status === 'Resolved').length);

  const badge = document.getElementById('navTicketCount');
  if (badge) {
    const fresh = all.filter(t => t.status === 'Assigned').length;
    badge.textContent = fresh;
    badge.hidden = fresh === 0;
  }

  const list = document.getElementById('ticketList');
  if (!list) return;

  const warning = storageWarning();

  if (!all.length) {
    // "Where is my ticket?" is the obvious question here, so answer it: a
    // fault dispatched to a different crew is not missing, it is just on
    // somebody else's list. Name them and offer to switch.
    const elsewhere = GridState.getCrew()
      .filter(c => c.id !== crewId && GridState.getTicketsFor(c.id).length > 0);

    const others = elsewhere.length
      ? '<div class="ticket-elsewhere"><b>Open tickets are with other crews:</b> ' +
        elsewhere.map(c =>
          `<button class="btn-ghost" onclick="setCrew('${esc(c.id)}')">` +
          `${esc(c.name)} (${GridState.getTicketsFor(c.id).length})</button>`
        ).join(' ') +
        '<div class="ticket-elsewhere-note">The dispatch engine sends each fault to the nearest ' +
        'crew with capacity, so a report you just filed may have gone to one of them.</div></div>'
      : '';

    list.innerHTML = warning + '<div class="card ticket-empty">' +
      '<i class="fa-solid fa-ticket"></i>' +
      '<div><b>No tickets assigned to you.</b> When a resident reports a fault nearby and you ' +
      'have capacity, the dispatch engine will send it here.' + others + '</div></div>';
    return;
  }

  list.innerHTML = warning + all.map(t => {
    const resolved = t.status === 'Resolved';
    const started = t.status === 'In Progress';
    const action = resolved ? ''
      : started
        ? `<button class="btn-ghost ticket-done" onclick="resolveTicket('${esc(t.ref)}')"><i class="fa-solid fa-circle-check"></i> Mark resolved</button>`
        : `<button class="btn-ghost ticket-accept" onclick="acceptTicket('${esc(t.ref)}')"><i class="fa-solid fa-play"></i> Accept and start</button>`;

    return `<div class="ticket-card ${resolved ? 'is-resolved' : ''}" data-ref="${esc(t.ref)}">
      <div class="ticket-head">
        <div>
          <div class="ticket-ref">#${esc(t.ref)}</div>
          <div class="ticket-fault"><i class="fa-solid ${esc(t.faultIcon)}"></i> ${esc(t.faultLabel)}</div>
        </div>
        <div class="ticket-badges">
          <span class="badge ${esc(t.priorityBadge)}">${esc(t.priority)}</span>
          <span class="badge ${esc(t.statusBadge)}">${esc(t.status)}</span>
        </div>
      </div>
      <div class="ticket-where">
        <i class="fa-solid fa-location-dot"></i>
        <span><b>${esc(t.block)}</b>${t.address ? ' — ' + esc(t.address) : ''}</span>
      </div>
      <div class="ticket-desc">${esc(t.description)}</div>
      <div class="ticket-meta">
        <span><i class="fa-regular fa-clock"></i> Reported ${esc(GridState.timeAgo(t.reportedAt))}</span>
        <span><i class="fa-solid fa-hourglass-half"></i> Off for ${esc(t.duration.toLowerCase())}</span>
        ${t.phone ? `<span><i class="fa-solid fa-phone"></i> ${esc(t.phone)}</span>` : ''}
      </div>
      ${t.assignmentReason ? `<div class="ticket-why"><i class="fa-solid fa-route"></i> ${esc(t.assignmentReason)}</div>` : ''}
      <div class="ticket-actions">
        <button class="btn-primary sm" onclick="downloadTicket('${esc(t.ref)}')"><i class="fa-solid fa-download"></i> Download ticket</button>
        <button class="btn-ghost" onclick="printTicket('${esc(t.ref)}')"><i class="fa-solid fa-print"></i> Print</button>
        <a class="btn-ghost" href="https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}" target="_blank" rel="noopener"><i class="fa-solid fa-diamond-turn-right"></i> Directions</a>
        ${action}
      </div>
    </div>`;
  }).join('');
}

function downloadTicket(ref) {
  const t = GridState.get(ref);
  if (t) GridExport.ticket(t);
}

function printTicket(ref) {
  const t = GridState.get(ref);
  if (!t) return;
  if (!GridExport.printTicket(t)) GridExport.ticket(t); // pop-up blocked
}

/** Every ticket for this electrician, as one spreadsheet for the shift. */
function downloadMyTickets() {
  const tickets = GridState.getTicketsFor(currentCrewId(), true);
  if (!tickets.length) return;
  const crew = GridState.crewById(currentCrewId());
  GridExport.csv(tickets, 'gridsh0ck-tickets-' + crew.name.replace(/[^\w]+/g, '-').toLowerCase() + '.csv');
}

function acceptTicket(ref) { GridState.acceptTicket(ref); }
function resolveTicket(ref) { GridState.updateStatus(ref, 'Resolved'); }

document.getElementById('crewSelect')?.addEventListener('change', e => setCrew(e.target.value));

// ── LIVE ARRIVALS ─────────────────────────────────────────────
let knownTickets = new Set(GridState.getTicketsFor(currentCrewId(), true).map(t => t.ref));

function ticketToast(ticket) {
  const toast = document.createElement('div');
  toast.className = 'report-toast';
  toast.innerHTML =
    '<div class="report-toast-head">' +
      '<span><i class="fa-solid fa-ticket"></i> New ticket dispatched to you</span>' +
      '<button class="report-toast-close" aria-label="Dismiss">&times;</button>' +
    '</div>' +
    '<div class="report-toast-body"><b>#' + esc(ticket.ref) + '</b> — ' +
      esc(ticket.faultLabel) + ', ' + esc(ticket.block) +
      ' <span class="badge ' + esc(ticket.priorityBadge) + '">' + esc(ticket.priority) + '</span></div>' +
    '<button class="btn-primary sm report-toast-go">Open ticket</button>';
  document.body.appendChild(toast);

  const dismiss = () => toast.remove();
  toast.querySelector('.report-toast-close').addEventListener('click', dismiss);
  toast.querySelector('.report-toast-go').addEventListener('click', () => {
    nav('tickets');
    const card = document.querySelector('.ticket-card[data-ref="' + ticket.ref + '"]');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    dismiss();
  });
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(dismiss, 12000);
}

GridState.subscribe(() => {
  const mine = GridState.getTicketsFor(currentCrewId(), true);
  mine.forEach(t => { if (!knownTickets.has(t.ref)) ticketToast(t); });
  knownTickets = new Set(mine.map(t => t.ref));
  renderCrewIdentity();
  renderTickets();
});

renderCrewIdentity();
renderTickets();
