// Navigation
document.querySelectorAll('.nav-item[data-section]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.dataset.section;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + target).classList.add('active');
    initSection(target);
  });
});

document.querySelector('.see-all')?.addEventListener('click', e => {
  e.preventDefault();
  const target = e.currentTarget.dataset.section;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-section="${target}"]`)?.classList.add('active');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + target).classList.add('active');
  initSection(target);
});

document.querySelectorAll('.toggle-group').forEach(group => {
  group.querySelectorAll('.tog').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.tog').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});

const initialized = new Set();
function initSection(name) {
  if (initialized.has(name)) return;
  initialized.add(name);
  if (name === 'overview') initOverview();
  if (name === 'reports') initReports();
  if (name === 'map') initFullMap();
  if (name === 'dispatch') initDispatch();
  if (name === 'tracking') initTracking();
  if (name === 'workforce') initWorkforce();
  if (name === 'performance') initPerformance();
  if (name === 'predictive') initPredictive();
  if (name === 'analytics') initAnalytics();
}

Chart.defaults.font.family = "'Segoe UI', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#7a8fa6';

const TEAL = '#1abc9c', ORANGE = '#f39c12', RED = '#e74c3c', BLUE = '#0ea5e9', PURPLE = '#8b5cf6', YELLOW = '#eab308';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];

// Soshanguve centre
const SOSH = [-25.5231, 28.0900];

// Outages across Soshanguve blocks (real block approximate coords)
const outages = [
  { lat: -25.5050, lng: 28.0750, label: 'Block X — No Power (Critical)', color: RED },
  { lat: -25.5180, lng: 28.1020, label: 'Block S — Damaged Infrastructure (Critical)', color: RED },
  { lat: -25.5250, lng: 28.0800, label: 'Block GG — No Power (Critical)', color: RED },
  { lat: -25.5150, lng: 28.1150, label: 'Block AA — No Power (Critical)', color: RED },
  { lat: -25.5290, lng: 28.0700, label: 'Block R — Street Light (In Progress)', color: ORANGE },
  { lat: -25.5350, lng: 28.0950, label: 'Block CC — Partial Power (In Progress)', color: ORANGE },
  { lat: -25.5480, lng: 28.0820, label: 'Block EE — Partial Power (In Progress)', color: ORANGE },
  { lat: -25.5060, lng: 28.1050, label: 'Block DD — No Power (Resolved)', color: TEAL },
  { lat: -25.5100, lng: 28.0900, label: 'Block BB — Street Light (Resolved)', color: TEAL },
];

// Electricity heatmap points [lat, lng, intensity]
// Denser clusters around Block X, S, GG, AA, R (high-outage zones)
const heatPoints = [
  // Block X cluster
  [-25.5050, 28.0750, 1.0], [-25.5060, 28.0760, 0.9], [-25.5040, 28.0740, 0.8],
  [-25.5070, 28.0770, 0.7], [-25.5030, 28.0730, 0.6], [-25.5080, 28.0780, 0.5],
  // Block S cluster
  [-25.5180, 28.1020, 1.0], [-25.5190, 28.1030, 0.9], [-25.5170, 28.1010, 0.8],
  [-25.5200, 28.1040, 0.7], [-25.5160, 28.1000, 0.6],
  // Block GG cluster
  [-25.5250, 28.0800, 0.9], [-25.5260, 28.0810, 0.8], [-25.5240, 28.0790, 0.7],
  [-25.5270, 28.0820, 0.6], [-25.5230, 28.0780, 0.5],
  // Block AA cluster
  [-25.5150, 28.1150, 0.9], [-25.5160, 28.1160, 0.8], [-25.5140, 28.1140, 0.7],
  [-25.5170, 28.1170, 0.6],
  // Block R cluster
  [-25.5290, 28.0700, 0.8], [-25.5300, 28.0710, 0.7], [-25.5280, 28.0690, 0.6],
  // Block CC (medium)
  [-25.5350, 28.0950, 0.6], [-25.5360, 28.0960, 0.5], [-25.5340, 28.0940, 0.4],
  // Block DD (resolved, low)
  [-25.5060, 28.1050, 0.3], [-25.5070, 28.1060, 0.2],
  // Scattered low-intensity across township
  [-25.5120, 28.0850, 0.3], [-25.5200, 28.0900, 0.4], [-25.5380, 28.1050, 0.3],
  [-25.5450, 28.0880, 0.2], [-25.5100, 28.0980, 0.4], [-25.5220, 28.1100, 0.3],
];

const electricians = [
  { lat: -25.5055, lng: 28.0755, label: 'J. Dlamini — On-Site (Block X)' },
  { lat: -25.5185, lng: 28.1025, label: 'T. Mokoena — Assigned (Block S)' },
  { lat: -25.5310, lng: 28.0660, label: 'P. Nkosi — Available' },
  { lat: -25.5405, lng: 28.1105, label: 'M. Sithole — On-Site (Block F)' },
  { lat: -25.5255, lng: 28.0805, label: 'L. Khumalo — Available' },
];

function circleIcon(color, size = 14) {
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    className: '', iconSize: [size, size]
  });
}

// MINI MAP
let miniMapInit = false;
function initMiniMap() {
  if (miniMapInit) return;
  miniMapInit = true;
  const map = L.map('miniMap', { zoomControl: false, attributionControl: false }).setView(SOSH, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  outages.forEach(o => L.marker([o.lat, o.lng], { icon: circleIcon(o.color, 12) }).addTo(map));
  // Mini heatmap
  L.heatLayer(heatPoints, { radius: 22, blur: 18, maxZoom: 15, gradient: { 0.3: 'blue', 0.5: 'cyan', 0.7: 'yellow', 1.0: 'red' } }).addTo(map);
}

// FULL MAP with toggle
let fullMapObj = null;
let markerLayerGroup = null;
let heatLayer = null;
let electricianLayerGroup = null;

function initFullMap() {
  const map = L.map('fullMap').setView(SOSH, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
  fullMapObj = map;

  // Marker layer
  markerLayerGroup = L.layerGroup();
  outages.forEach(o => {
    L.marker([o.lat, o.lng], { icon: circleIcon(o.color) })
      .bindPopup(`<b>${o.label}</b>`)
      .addTo(markerLayerGroup);
  });

  // Electrician layer
  electricianLayerGroup = L.layerGroup();
  electricians.forEach(t => {
    L.marker([t.lat, t.lng], { icon: circleIcon(BLUE, 16) })
      .bindPopup(`<b>👷 ${t.label}</b>`)
      .addTo(electricianLayerGroup);
  });

  // Heatmap layer
  heatLayer = L.heatLayer(heatPoints, {
    radius: 30, blur: 22, maxZoom: 15,
    gradient: { 0.2: '#0000ff', 0.4: '#00cfff', 0.6: '#00ff88', 0.8: '#ffff00', 1.0: '#ff0000' }
  });

  // Default: markers + electricians
  markerLayerGroup.addTo(map);
  electricianLayerGroup.addTo(map);

  // Toolbar buttons
  document.getElementById('btnMarkers').addEventListener('click', () => {
    map.addLayer(markerLayerGroup);
    map.addLayer(electricianLayerGroup);
    map.removeLayer(heatLayer);
  });
  document.getElementById('btnHeatmap').addEventListener('click', () => {
    map.removeLayer(markerLayerGroup);
    map.removeLayer(electricianLayerGroup);
    map.addLayer(heatLayer);
  });
  document.getElementById('btnBoth').addEventListener('click', () => {
    map.addLayer(markerLayerGroup);
    map.addLayer(electricianLayerGroup);
    map.addLayer(heatLayer);
  });
}

function barChart(id, labels, datasets, opts = {}) {
  return new Chart(document.getElementById(id), {
    type: 'bar',
    data: { labels, datasets },
    options: { responsive: true, plugins: { legend: { display: datasets.length > 1 } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f0f4f8' }, beginAtZero: true } }, ...opts }
  });
}

function lineChart(id, labels, datasets) {
  return new Chart(document.getElementById(id), {
    type: 'line',
    data: { labels, datasets },
    options: { responsive: true, plugins: { legend: { display: datasets.length > 1 } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f0f4f8' }, beginAtZero: true } } }
  });
}

function doughnutChart(id, labels, data, colors) {
  return new Chart(document.getElementById(id), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2 }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '65%' }
  });
}

function initOverview() {
  barChart('outagesChart',
    ['18 Sep','19 Sep','20 Sep','21 Sep','22 Sep','23 Sep','24 Sep','25 Sep'],
    [
      { label: 'New', data: [12,18,9,22,15,11,19,14], backgroundColor: TEAL, borderRadius: 4 },
      { label: 'Resolved', data: [8,14,7,18,12,9,16,11], backgroundColor: '#b2f0e0', borderRadius: 4 }
    ]
  );
  initMiniMap();
}

function initWorkforce() {
  barChart('workloadChart',
    ['Block X','Block S','Block GG','Block AA','Block R','Block CC'],
    [{ label: 'Electricity Jobs', data: [8, 6, 5, 4, 3, 2], backgroundColor: [RED,RED,ORANGE,ORANGE,ORANGE,BLUE], borderRadius: 4 }]
  );
  barChart('responseChart',
    ['J. Dlamini','T. Mokoena','P. Nkosi','M. Sithole','L. Khumalo'],
    [{ label: 'Avg Response (min)', data: [22, 28, 18, 31, 20], backgroundColor: TEAL, borderRadius: 4 }]
  );
}

function initPerformance() {
  lineChart('kpiChart', MONTHS,
    [
      { label: 'Avg Response (min)', data: [35,32,30,28,26,25,24,24,24], borderColor: TEAL, backgroundColor: 'rgba(26,188,156,.1)', fill: true, tension: .4 },
      { label: 'Avg Repair (min)', data: [180,170,160,155,145,140,135,132,130], borderColor: ORANGE, backgroundColor: 'rgba(243,156,18,.08)', fill: true, tension: .4 }
    ]
  );
  doughnutChart('reportsChart', ['Resolved','Pending','Escalated'], [94, 4, 2], [TEAL, ORANGE, RED]);
}

const PRIORITY_COLORS = { critical: RED, medium: ORANGE, low: YELLOW, normal: BLUE };

function initPredictive() {
  barChart('riskChart',
    TSHWANE_PRIORITY_AREAS.map(a => a.area),
    [{
      label: 'Outage Rate % (90d)',
      data: TSHWANE_PRIORITY_AREAS.map(a => a.ratePct),
      backgroundColor: TSHWANE_PRIORITY_AREAS.map(a => PRIORITY_COLORS[a.level]),
      borderRadius: 4
    }]
  );

  const counts = { critical: 0, medium: 0, low: 0, flagged: 0 };
  TSHWANE_PRIORITY_AREAS.forEach(a => {
    if (a.level !== 'normal') counts[a.level]++;
    if (a.flagged) counts.flagged++;
  });
  document.getElementById('pr-critical').textContent = counts.critical;
  document.getElementById('pr-medium').textContent = counts.medium;
  document.getElementById('pr-low').textContent = counts.low;
  document.getElementById('pr-flagged').textContent = counts.flagged;

  document.getElementById('pr-priority-table').innerHTML = TSHWANE_PRIORITY_AREAS.map(a => `
    <tr>
      <td>${a.area}</td>
      <td><b>${a.ratePct}%</b></td>
      <td>${a.incidents}</td>
      <td>${a.commonCause}</td>
      <td><span class="badge ${a.badge}">${a.label}${a.flagged ? ' · Flagged' : ''}</span></td>
    </tr>`).join('');

  document.getElementById('pr-recommendations').innerHTML = TSHWANE_PRIORITY_AREAS
    .filter(a => a.flagged)
    .map(a => `<li><span class="dot ${a.badge}"></span> ${a.area} — ${a.commonCause} (${a.ratePct}% outage rate)</li>`)
    .join('');
}

function initAnalytics() {
  barChart('areaChart',
    ['Block X','Block S','Block GG','Block AA','Block R','Block CC','Block DD'],
    [{ label: 'Electricity Outages', data: [22, 18, 15, 12, 10, 8, 4], backgroundColor: TEAL, borderRadius: 4 }]
  );
  doughnutChart('causeChart',
    ['Transformer Fault','Cable Damage','Overload','Substation Trip','Meter Fault','Weather'],
    [32, 24, 18, 14, 8, 4],
    [RED, ORANGE, PURPLE, BLUE, TEAL, '#94a3b8']
  );
  lineChart('trendChart', MONTHS,
    [{ label: 'Electricity Outages', data: [45,52,38,61,47,55,42,49,47], borderColor: TEAL, backgroundColor: 'rgba(26,188,156,.1)', fill: true, tension: .4 }]
  );
  barChart('teamChart',
    ['J. Dlamini','T. Mokoena','P. Nkosi','M. Sithole','L. Khumalo'],
    [
      { label: 'Jobs Resolved', data: [18, 14, 16, 12, 15], backgroundColor: TEAL, borderRadius: 4 },
      { label: 'Avg Repair (min)', data: [95, 110, 80, 120, 88], backgroundColor: ORANGE, borderRadius: 4 }
    ]
  );
}

initSection('overview');

// ── FLAGGED AREAS (auto-detected from historical outage-rate data) ──
// Runs immediately on load — independent of section navigation — so any
// area above the 50% outage-rate threshold is flagged on the admin
// dashboard the moment the data is available, not only when the
// Predictive Risk section is opened.
function renderFlaggedAreasBanner() {
  const banner = document.getElementById('flaggedAreasBanner');
  if (!banner) return;
  const flagged = TSHWANE_PRIORITY_AREAS.filter(a => a.flagged);
  if (flagged.length === 0) { banner.innerHTML = ''; return; }

  const hasCritical = flagged.some(a => a.level === 'critical');
  banner.innerHTML = `
    <div class="flagged-banner ${hasCritical ? 'has-critical' : ''}">
      <div class="flagged-banner-head">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <b>${flagged.length} area${flagged.length > 1 ? 's' : ''} flagged</b>&nbsp;— historical outage rate above 50%. Prioritise before they escalate.
      </div>
      <div class="flagged-banner-list">
        ${flagged.map(a => `
          <span class="flagged-pill ${a.badge}">
            <b>${a.area}</b> ${a.ratePct}% <span class="flagged-pill-status">${a.label}</span>
          </span>`).join('')}
      </div>
    </div>`;
}

function alertCriticalAreas() {
  const critical = TSHWANE_PRIORITY_AREAS.filter(a => a.level === 'critical');
  if (critical.length === 0) return;

  const toast = document.createElement('div');
  toast.className = 'critical-toast';
  toast.innerHTML = `
    <div class="critical-toast-head">
      <span><i class="fa-solid fa-bolt"></i> Critical outage risk detected</span>
      <button class="critical-toast-close" aria-label="Dismiss">&times;</button>
    </div>
    <div class="critical-toast-body">
      ${critical.map(a => `<div><b>${a.area}</b> — ${a.ratePct}% outage rate (${a.commonCause})</div>`).join('')}
    </div>`;
  document.body.appendChild(toast);
  toast.querySelector('.critical-toast-close').addEventListener('click', () => toast.remove());
  requestAnimationFrame(() => toast.classList.add('show'));
}

renderFlaggedAreasBanner();
alertCriticalAreas();

// ── AI DISPATCH ──────────────────────────────────────────────
const BLOCKS = ['Block X','Block S','Block GG','Block AA','Block R','Block CC','Block H','Block F','Block BB','Block DD'];
const FREQ   = [22, 18, 15, 12, 10, 8, 7, 6, 4, 3]; // historical outage counts

const AI_ELECTRICIANS = [
  { name: 'P. Nkosi',   area: 'Block BB', jobs: 0, lat: -25.5310, lng: 28.0660 },
  { name: 'L. Khumalo', area: 'Block GG', jobs: 0, lat: -25.5255, lng: 28.0805 },
  { name: 'J. Dlamini', area: 'Block X',  jobs: 1, lat: -25.5055, lng: 28.0755 },
  { name: 'M. Sithole', area: 'Block F',  jobs: 1, lat: -25.5405, lng: 28.1105 },
  { name: 'T. Mokoena', area: 'Block S',  jobs: 1, lat: -25.5185, lng: 28.1025 },
];

const UNASSIGNED_OUTAGES = [
  { id: '#OT-1060', block: 'Block X',  freq: 22, priority: 'Critical', lat: -25.5050, lng: 28.0750 },
  { id: '#OT-1061', block: 'Block S',  freq: 18, priority: 'Critical', lat: -25.5180, lng: 28.1020 },
  { id: '#OT-1062', block: 'Block GG', freq: 15, priority: 'High',     lat: -25.5250, lng: 28.0800 },
  { id: '#OT-1063', block: 'Block AA', freq: 12, priority: 'High',     lat: -25.5150, lng: 28.1150 },
  { id: '#OT-1064', block: 'Block R',  freq: 10, priority: 'Medium',   lat: -25.5290, lng: 28.0700 },
  { id: '#OT-1065', block: 'Block CC', freq: 8,  priority: 'Medium',   lat: -25.5350, lng: 28.0950 },
];

function initDispatch() {
  barChart('freqChart', BLOCKS, [
    { label: 'Outage Frequency', data: FREQ,
      backgroundColor: FREQ.map(v => v >= 15 ? RED : v >= 8 ? ORANGE : TEAL),
      borderRadius: 4 }
  ]);
}

function dist(a, b) {
  return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2));
}

function runAIDispatch() {
  const btn = document.getElementById('btnRunAI');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analysing...';
  btn.disabled = true;

  setTimeout(() => {
    // Sort outages by frequency desc (highest-risk first)
    const sorted = [...UNASSIGNED_OUTAGES].sort((a, b) => b.freq - a.freq);
    // Available electricians sorted by jobs asc then proximity
    const available = [...AI_ELECTRICIANS].filter(t => t.jobs < 2);

    const assignments = sorted.map((outage, i) => {
      // Score each electrician: lower jobs + closer = better
      const scored = available.map(t => ({
        electrician: t,
        score: t.jobs * 10 + dist(t, outage) * 100
      })).sort((a, b) => a.score - b.score);
      const best = scored[i % scored.length];
      return { outage, electrician: best.electrician };
    });

    const html = `<table class="data-table">
      <thead><tr><th>Outage</th><th>Block</th><th>Freq (90d)</th><th>Priority</th><th>AI Recommended Electrician</th><th>Reason</th><th>Action</th></tr></thead>
      <tbody>${assignments.map(a => `
        <tr>
          <td>${a.outage.id}</td>
          <td>${a.outage.block}</td>
          <td><b>${a.outage.freq}</b> outages</td>
          <td><span class="badge ${a.outage.priority === 'Critical' ? 'red' : a.outage.priority === 'High' ? 'orange' : 'green'}">${a.outage.priority}</span></td>
          <td><b>${a.electrician.name}</b></td>
          <td style="font-size:11px;color:var(--text-muted)">Nearest available · ${a.electrician.jobs} active job(s)</td>
          <td><button class="btn-primary sm" onclick="confirmDispatch(this,'${a.outage.id}','${a.electrician.name}')">Dispatch</button></td>
        </tr>`).join('')}
      </tbody></table>`;

    document.getElementById('aiResults').innerHTML = html;
    btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Re-run AI';
    btn.disabled = false;
  }, 1800);
}

function confirmDispatch(btn, outageId, electricianName) {
  btn.textContent = '\u2713 Dispatched';
  btn.style.background = 'var(--green)';
  btn.disabled = true;
  document.getElementById('ai-unassigned').textContent =
    Math.max(0, parseInt(document.getElementById('ai-unassigned').textContent) - 1);
}

function mergeDupe(btn) {
  btn.textContent = '\u2713 Merged';
  btn.style.background = 'var(--green)';
  btn.disabled = true;
  document.getElementById('ai-dupes').textContent =
    Math.max(0, parseInt(document.getElementById('ai-dupes').textContent) - 1);
}

// ── LIVE TRACKING ─────────────────────────────────────────────
let trackingMapInit = false;
function initTracking() {
  if (trackingMapInit) return;
  trackingMapInit = true;
  const map = L.map('trackingMap').setView(SOSH, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '\u00a9 OpenStreetMap' }).addTo(map);

  const electricianColors = { 'On-Site': TEAL, 'En Route': ORANGE, 'Available': '#1abc9c' };
  const liveTeam = [
    { lat: -25.5055, lng: 28.0755, name: 'J. Dlamini', status: 'On-Site',   job: '#OT-1042 — Block X' },
    { lat: -25.5185, lng: 28.1025, name: 'T. Mokoena', status: 'En Route',  job: '#OT-1038 — Block S' },
    { lat: -25.5405, lng: 28.1105, name: 'M. Sithole', status: 'En Route',  job: '#OT-1035 — Block F' },
    { lat: -25.5255, lng: 28.0805, name: 'L. Khumalo', status: 'On-Site',   job: '#OT-1047 — Block GG' },
    { lat: -25.5310, lng: 28.0660, name: 'P. Nkosi',   status: 'On-Site',   job: '#OT-1055 — Block AA' },
  ];

  liveTeam.forEach(t => {
    const color = electricianColors[t.status] || BLUE;
    const icon = L.divIcon({
      html: `<div style="background:${color};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">${t.name.split(' ')[1][0]}${t.name.split(' ')[0][0]}</div>`,
      className: '', iconSize: [32, 32]
    });
    L.marker([t.lat, t.lng], { icon })
      .bindPopup(`<b>\u{1F477} ${t.name}</b><br/>${t.status}<br/>${t.job}`)
      .addTo(map);
  });

  // Outage pins
  outages.forEach(o => {
    L.circleMarker([o.lat, o.lng], { radius: 7, color: o.color, fillColor: o.color, fillOpacity: .7, weight: 2 })
      .bindPopup(`<b>${o.label}</b>`).addTo(map);
  });

  // Simulate movement every 5s
  setInterval(() => {
    const feed = document.getElementById('liveFeed');
    if (!feed) return;
    const msgs = [
      'J. Dlamini — Repair 80% complete · Block X',
      'T. Mokoena — Arrived on-site · Block S',
      'M. Sithole — ETA 3 min · Block F',
    ];
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.innerHTML = `<div class="feed-dot teal"></div><div><div class="feed-title">${msgs[Math.floor(Math.random()*msgs.length)]}</div><div class="feed-time">Just now</div></div>`;
    feed.prepend(item);
    if (feed.children.length > 8) feed.lastChild.remove();
  }, 5000);
}

// ── CITIZEN FAULT REPORTS ─────────────────────────────────────
// The operations end of the shared ledger. A resident submits in the citizen
// portal, the record is written to the ledger, and this section renders it —
// in an already-open tab, without a refresh.

const REPORT_STATUSES = ['New', 'Verified', 'Assigned', 'In Progress', 'Resolved'];
let reportFilter = 'all';

function escHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The rows currently on screen — what an export writes out. */
function visibleReports() {
  const all = GridState.getReports();
  return reportFilter === 'all' ? all : all.filter(r => r.status === reportFilter);
}

function isToday(iso) {
  const d = new Date(iso), n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function reportsStorageWarning() {
  if (GridState.storageWorks()) return '';
  return '<div class="storage-warning">' +
    '<i class="fa-solid fa-triangle-exclamation"></i>' +
    '<div><b>The portals cannot share data right now.</b> This page was opened straight ' +
    'from disk, so the browser keeps each page storage separate and a report filed in ' +
    'one portal never reaches the others. Serve the folder instead &mdash; ' +
    '<code>python -m http.server 8000</code> &mdash; and open it from ' +
    '<code>http://localhost:8000</code>.</div></div>';
}

function renderReports() {
  const all = GridState.getReports();

  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set('rp-total', all.length);
  set('rp-new', all.filter(r => r.awaitingCrew).length);
  set('rp-critical', all.filter(r => r.priority === 'Critical').length);
  set('rp-today', all.filter(r => isToday(r.reportedAt)).length);

  // Sidebar count: reports nobody has triaged yet.
  const badge = document.getElementById('navReportCount');
  if (badge) {
    const untriaged = all.filter(r => r.awaitingCrew).length;
    badge.textContent = untriaged;
    badge.hidden = untriaged === 0;
  }

  const body = document.getElementById('reportsBody');
  if (!body) return;

  const intro = document.querySelector('#section-reports .reports-intro');
  if (intro && !GridState.storageWorks() && !document.querySelector('.storage-warning')) {
    intro.insertAdjacentHTML('beforebegin', reportsStorageWarning());
  }

  const rows = visibleReports();
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="7" class="reports-empty">No reports match this filter.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map(r => {
    // Dispatch is automatic, so this column reports what the engine decided
    // and why — a dispatcher overrides it rather than driving it.
    const crewCell = r.assignedToName
      ? `<b>${escHtml(r.assignedToName)}</b>
         <div class="cell-sub">${escHtml(r.assignmentReason || r.assignedTeam || '')}</div>`
      : `<span class="badge red">Awaiting crew</span>
         <div class="cell-sub">${escHtml(r.assignmentReason || 'Not yet assigned.')}</div>`;

    return `<tr data-ref="${escHtml(r.ref)}" class="${r.awaitingCrew ? 'row-waiting' : ''}">
      <td><b>#${escHtml(r.ref)}</b></td>
      <td>${escHtml(GridState.formatDateTime(r.reportedAt))}<div class="cell-sub">${escHtml(GridState.timeAgo(r.reportedAt))}</div></td>
      <td><i class="fa-solid ${escHtml(r.faultIcon)}" style="color:var(--orange)"></i> ${escHtml(r.faultLabel)}</td>
      <td>${escHtml(r.block)}<div class="cell-sub">${escHtml(r.address || 'No street given')}</div></td>
      <td><span class="badge ${escHtml(r.priorityBadge)}">${escHtml(r.priority)}</span></td>
      <td class="crew-cell">${crewCell}</td>
      <td>
        <select class="status-select" onchange="changeReportStatus('${escHtml(r.ref)}', this.value)" aria-label="Status for ${escHtml(r.ref)}">
          ${REPORT_STATUSES.map(s => `<option value="${s}"${s === r.status ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>`;
  }).join('');
}

function initReports() {
  document.querySelectorAll('.reports-filter .tog').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.reports-filter .tog').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reportFilter = btn.dataset.status;
      renderReports();
    });
  });
  renderReports();
}

function changeReportStatus(ref, status) {
  GridState.updateStatus(ref, status);
}

// ── EXPORTS ───────────────────────────────────────────────────
// Operations keeps the queue-level exports for records and reporting. The
// per-fault ticket download belongs to the electrician who has to work it,
// so it lives in the field portal rather than here.
function exportReportsCSV() {
  GridExport.csv(visibleReports());
}

function exportReportsJSON() {
  GridExport.json(visibleReports());
}

function resetLedger() {
  if (confirm('Reset the report ledger back to its seeded demo data? Any reports filed in the citizen portal will be removed.')) {
    GridState.reset();
  }
}

// ── LIVE ARRIVALS ─────────────────────────────────────────────
let knownRefs = new Set(GridState.getReports().map(r => r.ref));

function reportToast(report) {
  const toast = document.createElement('div');
  toast.className = 'report-toast';
  toast.innerHTML = `
    <div class="report-toast-head">
      <span><i class="fa-solid fa-inbox"></i> New citizen report</span>
      <button class="report-toast-close" aria-label="Dismiss">&times;</button>
    </div>
    <div class="report-toast-body">
      <b>#${escHtml(report.ref)}</b> — ${escHtml(report.faultLabel)}, ${escHtml(report.block)}
      <span class="badge ${escHtml(report.priorityBadge)}">${escHtml(report.priority)}</span>
    </div>
    <button class="btn-primary sm report-toast-go">Open report queue</button>`;
  document.body.appendChild(toast);

  const dismiss = () => toast.remove();
  toast.querySelector('.report-toast-close').addEventListener('click', dismiss);
  toast.querySelector('.report-toast-go').addEventListener('click', () => {
    document.querySelector('.nav-item[data-section="reports"]')?.click();
    dismiss();
  });
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(dismiss, 12000);
}

GridState.subscribe(reports => {
  // Announce anything that arrived since the last render, then repaint.
  reports.forEach(r => {
    if (!knownRefs.has(r.ref)) reportToast(r);
  });
  knownRefs = new Set(reports.map(r => r.ref));
  renderReports();
});

// Keep the sidebar count and KPIs honest from first paint, even if the
// dispatcher never opens the section.
renderReports();
