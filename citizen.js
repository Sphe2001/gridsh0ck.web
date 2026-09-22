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

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── REPORTING A FAULT ─────────────────────────────────────────
// A submitted report is written to the shared ledger, which is what the
// operations dashboard reads. The resident and the dispatcher end up looking
// at the same record from two different portals.

function readReportForm() {
  return {
    faultType: document.querySelector('#faultType .type-opt.active')?.dataset.type || 'no-power',
    block: document.getElementById('reportBlock')?.value || 'Block X',
    address: document.getElementById('reportAddress')?.value.trim() || '',
    description: document.getElementById('reportDesc')?.value.trim() || '',
    duration: document.getElementById('reportDuration')?.value || 'Less than 1 hour',
    phone: document.getElementById('reportPhone')?.value.trim() || '',
  };
}

function showFormError(message) {
  const box = document.getElementById('report-error');
  const text = document.getElementById('report-error-text');
  if (!box || !text) return;
  text.innerHTML = message;
  box.style.display = 'flex';
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideFormError() {
  const box = document.getElementById('report-error');
  if (box) box.style.display = 'none';
}

function submitReport() {
  hideFormError();
  document.getElementById('dupe-warning').style.display = 'none';

  const data = readReportForm();

  if (!data.description) return showFormError('<b>Description is required.</b> Tell us what is wrong so the right crew is sent.');

  // Real duplicate check against the ledger, not a hardcoded block. If the
  // same fault is already open on the same block, the existing reference is
  // more useful to the resident than a second one.
  const similar = GridState.findSimilar(data.block, data.faultType, 6);
  if (similar.length) {
    const match = similar[0];
    document.getElementById('dupe-warning-text').innerHTML =
      `<b>Possible duplicate.</b> A ${escapeHtml(match.faultLabel.toLowerCase())} fault in ` +
      `${escapeHtml(match.block)} is already on file (<b>#${escapeHtml(match.ref)}</b>, reported ` +
      `${escapeHtml(GridState.timeAgo(match.reportedAt))}, currently ${escapeHtml(match.status)}). ` +
      `<a href="#" onclick="nav('track');document.getElementById('trackInput').value='#${escapeHtml(match.ref)}';doTrack();return false;">Track that report</a> ` +
      `or submit yours anyway — extra reports help us confirm how many households are affected.`;
    const warn = document.getElementById('dupe-warning');
    warn.style.display = 'flex';
    warn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  fileReport(data);
}

// "Submit Anyway" on the duplicate warning — the resident has seen the
// existing report and still wants their own on record.
function submitAnyway() {
  document.getElementById('dupe-warning').style.display = 'none';
  const data = readReportForm();
  if (!data.description) return submitReport();
  fileReport(data);
}

function fileReport(data) {
  const report = GridState.submitReport(data);

  // Dispatch happens on submit, so the resident is told who is coming rather
  // than just that the report was received.
  const dispatched = report.assignedToName
    ? `An electrician has already been assigned: <b>${escapeHtml(report.assignedToName)}</b>` +
      `${report.assignedTeam ? ' (' + escapeHtml(report.assignedTeam) + ')' : ''}.`
    : `Every crew is on a job right now, so your report is first in the queue for the next ` +
      `electrician who becomes available.`;

  document.getElementById('report-success-text').innerHTML =
    `<b>Report submitted.</b> Your reference number is <b>#${escapeHtml(report.ref)}</b>, logged as ` +
    `<b>${escapeHtml(report.priority.toLowerCase())}</b> priority. ${dispatched} ` +
    `You will receive updates via SMS.`;
  const banner = document.getElementById('report-success');
  banner.style.display = 'flex';
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Clear the parts of the form that are specific to this fault, so a second
  // report is not accidentally filed as a copy of the first.
  const desc = document.getElementById('reportDesc');
  const addr = document.getElementById('reportAddress');
  if (desc) desc.value = '';
  if (addr) addr.value = '';

  renderCitizenReports();
}

// ── RENDERING THE RESIDENT'S OWN REPORTS ──────────────────────
function statusBadge(report) {
  return `<span class="badge ${report.statusBadge}">${escapeHtml(report.status)}</span>`;
}

function renderCitizenReports() {
  const reports = GridState.getReports();

  const recent = document.getElementById('recentReportsBody');
  if (recent) {
    recent.innerHTML = reports.slice(0, 4).map(r => `
      <tr>
        <td>#${escapeHtml(r.ref)}</td>
        <td>${escapeHtml(r.faultLabel)}</td>
        <td>${escapeHtml(r.block)}</td>
        <td>${escapeHtml(GridState.formatDate(r.reportedAt))}</td>
        <td>${statusBadge(r)}</td>
      </tr>`).join('') ||
      '<tr><td colspan="5" style="color:var(--text-muted)">No reports filed yet.</td></tr>';
  }

  const history = document.getElementById('historyBody');
  if (history) {
    history.innerHTML = reports.map(r => `
      <tr>
        <td>#${escapeHtml(r.ref)}</td>
        <td>${escapeHtml(r.faultLabel)}</td>
        <td>${escapeHtml(r.block)}</td>
        <td>${escapeHtml(r.description)}</td>
        <td>${escapeHtml(GridState.formatDate(r.reportedAt))}</td>
        <td>${statusBadge(r)}</td>
      </tr>`).join('') ||
      '<tr><td colspan="6" style="color:var(--text-muted)">No reports filed yet.</td></tr>';
  }
}

// Operations can change a report's status from the dashboard; reflect that
// here without the resident reloading the page.
GridState.subscribe(() => renderCitizenReports());
renderCitizenReports();

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
  { lat: -25.5050, lng: 28.0750, label: 'Block X — No Power (Critical)', color: '#e74c3c' },
  { lat: -25.5180, lng: 28.1020, label: 'Block S — Damaged Infrastructure (Critical)', color: '#e74c3c' },
  { lat: -25.5250, lng: 28.0800, label: 'Block GG — No Power (In Progress)', color: '#f39c12' },
  { lat: -25.5150, lng: 28.1150, label: 'Block AA — No Power (Critical)', color: '#e74c3c' },
  { lat: -25.5290, lng: 28.0700, label: 'Block R — Street Light (In Progress)', color: '#f39c12' },
  { lat: -25.5060, lng: 28.1050, label: 'Block DD — Partial Power (Resolved)', color: '#1abc9c' },
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
