// ── REPORT EXPORT ───────────────────────────────────────────────
// Turns ledger records into files operations staff can actually keep: a CSV
// of the whole queue for a spreadsheet, and a single self-contained incident
// report per fault. Both are built in the browser from a Blob — no backend
// and no export library.
(function (global) {
  'use strict';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Excel reads a leading "=", "+", "-" or "@" as a formula, so a cell that
  // starts with one gets a quote prefix before it is written.
  function csvCell(value) {
    let s = String(value == null ? '' : value);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function stamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a moment to start the download before the URL dies.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const CSV_COLUMNS = [
    ['Reference',     r => r.ref],
    ['Received',      r => GridState.formatDateTime(r.reportedAt)],
    ['Utility',       r => r.utility],
    ['Fault Type',    r => r.faultLabel],
    ['Block',         r => r.block],
    ['Street Address',r => r.address],
    ['Description',   r => r.description],
    ['Reported Duration', r => r.duration],
    ['Priority',      r => r.priority],
    ['Priority Score',r => r.priorityScore],
    ['Status',        r => r.status],
    ['Assigned To',   r => r.assignedToName || (r.awaitingCrew ? 'Awaiting crew' : '')],
    ['Assigned Team', r => r.assignedTeam],
    ['Assigned At',   r => (r.assignedAt ? GridState.formatDateTime(r.assignedAt) : '')],
    ['Assignment Reason', r => r.assignmentReason],
    ['Source',        r => r.source],
    ['Contact Number',r => r.phone],
    ['Latitude',      r => r.lat],
    ['Longitude',     r => r.lng],
  ];

  const api = {
    /** The whole queue (or a filtered slice of it) as a spreadsheet. */
    csv(reports, filename) {
      const header = CSV_COLUMNS.map(c => csvCell(c[0])).join(',');
      const rows = reports.map(r => CSV_COLUMNS.map(c => csvCell(c[1](r))).join(','));
      // BOM so Excel opens the file as UTF-8 and South African names survive.
      const content = '﻿' + [header].concat(rows).join('\r\n') + '\r\n';
      download(filename || `gridsh0ck-fault-reports-${stamp()}.csv`, content, 'text/csv');
    },

    /** The machine-readable version of the same queue. */
    json(reports, filename) {
      const payload = {
        exported: new Date().toISOString(),
        source: 'gridsh0ck prototype — simulated data, not an official City of Tshwane record',
        count: reports.length,
        reports,
      };
      download(filename || `gridsh0ck-fault-reports-${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
    },

    /** One fault as a standalone document that opens in any browser. */
    singleReport(report) {
      download(`gridsh0ck-${report.ref}.html`, api.buildReportDocument(report), 'text/html');
    },

    /** The same fault as a field ticket — what the electrician takes to site. */
    ticket(report) {
      download(`gridsh0ck-ticket-${report.ref}.html`,
        api.buildReportDocument(report, { ticket: true }), 'text/html');
    },

    printTicket(report) {
      const w = global.open('', '_blank');
      if (!w) return false;
      w.document.write(api.buildReportDocument(report, { autoPrint: true, ticket: true }));
      w.document.close();
      return true;
    },

    /** The same document, opened for the browser's print / save-as-PDF dialog. */
    printReport(report) {
      const w = global.open('', '_blank');
      if (!w) return false;
      w.document.write(api.buildReportDocument(report, { autoPrint: true }));
      w.document.close();
      return true;
    },

    buildReportDocument(r, opts) {
      const autoPrint = opts && opts.autoPrint;
      const ticket = opts && opts.ticket;
      const field = (label, value) =>
        `<div class="field"><div class="label">${esc(label)}</div><div class="value">${esc(value || '—')}</div></div>`;

      const kind = ticket ? 'Field Ticket' : 'Fault Report';
      const crewLine = r.assignedToName
        ? `<div class="assigned">
             <div class="label">Assigned Electrician</div>
             <div class="assigned-name">${esc(r.assignedToName)}${r.assignedTeam ? ' &middot; ' + esc(r.assignedTeam) : ''}</div>
             ${r.assignmentReason ? `<div class="assigned-why">${esc(r.assignmentReason)}</div>` : ''}
           </div>`
        : `<div class="assigned waiting">
             <div class="label">Assigned Electrician</div>
             <div class="assigned-name">Awaiting an available crew</div>
             ${r.assignmentReason ? `<div class="assigned-why">${esc(r.assignmentReason)}</div>` : ''}
           </div>`;

      return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(r.ref)} — gridsh0ck ${esc(kind)}</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font:14px/1.55 'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif;color:#1a2b3c;background:#f4f6f9;padding:32px 16px}
  .sheet{max-width:760px;margin:0 auto;background:#fff;border:1px solid #e8edf2;border-radius:12px;padding:36px 40px}
  header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;
         padding-bottom:18px;border-bottom:2px solid #1abc9c;margin-bottom:24px}
  .brand{font-size:22px;font-weight:700;letter-spacing:-.02em}
  .brand .zero{color:#0b7a64}
  .brand-sub{font-size:12px;color:#5c7083;margin-top:2px}
  .ref{text-align:right}
  .ref-num{font-size:22px;font-weight:700;font-variant-numeric:tabular-nums}
  .ref-label{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#5c7083}
  h1{font-size:17px;margin-bottom:18px}
  .badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700}
  .red{background:#fdecea;color:#e74c3c}.orange{background:#fef3e2;color:#c77c0a}
  .green{background:#e8faf5;color:#0b7a64}.purple{background:#f0ebff;color:#8b5cf6}
  .yellow{background:#fef9e7;color:#a07c06}.grey{background:#eef2f6;color:#5c7083}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px 24px;margin-bottom:24px}
  .field .label{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#5c7083;font-weight:700;margin-bottom:3px}
  .field .value{font-size:14px}
  .block{background:#f4f6f9;border:1px solid #e8edf2;border-radius:8px;padding:16px 18px;margin-bottom:24px}
  .assigned{background:#e8faf5;border:1px solid #b9ecdf;border-radius:8px;padding:14px 18px;margin-bottom:24px}
  .assigned.waiting{background:#fef3e2;border-color:#f6d9a8}
  .assigned .label{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#5c7083;font-weight:700;margin-bottom:4px}
  .assigned-name{font-size:16px;font-weight:700}
  .assigned-why{font-size:12px;color:#5c7083;margin-top:3px}
  .block .label{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#5c7083;font-weight:700;margin-bottom:6px}
  .note{font-size:12px;color:#5c7083;border-top:1px solid #e8edf2;padding-top:16px;margin-top:8px}
  .disclosure{background:#fef3e2;border:1px solid #f6d9a8;border-radius:8px;padding:12px 14px;
              font-size:12px;color:#8a5a00;margin-bottom:24px}
  .actions{max-width:760px;margin:0 auto 16px;display:flex;justify-content:flex-end}
  button{background:#1abc9c;color:#06202a;border:0;border-radius:8px;padding:9px 18px;
         font:inherit;font-size:13px;font-weight:600;cursor:pointer}
  a{color:#0b7a64}
  @media print{
    body{background:#fff;padding:0}
    .sheet{border:0;max-width:none;padding:0}
    .actions{display:none}
  }
</style>
</head>
<body>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="sheet">
  <header>
    <div>
      <div class="brand">gridsh<span class="zero">0</span>ck</div>
      <div class="brand-sub">Electricity ${esc(kind)} &middot; Soshanguve, City of Tshwane</div>
    </div>
    <div class="ref">
      <div class="ref-label">Reference</div>
      <div class="ref-num">${esc(r.ref)}</div>
    </div>
  </header>

  <div class="disclosure">
    <strong>Prototype document.</strong> Generated by a prototype built for a City of Tshwane Smart
    Outage Management challenge. This is not an official City of Tshwane record and the fault data
    it contains is simulated.
  </div>

  <h1>${esc(r.faultLabel)} &mdash; ${esc(r.block)}</h1>
  <div class="badges">
    <span class="badge ${esc(r.priorityBadge)}">${esc(r.priority)} priority</span>
    <span class="badge ${esc(r.statusBadge)}">${esc(r.status)}</span>
    <span class="badge grey">${esc(r.source)}</span>
  </div>

  ${crewLine}

  <div class="grid">
    ${field('Received', GridState.formatDateTime(r.reportedAt))}
    ${field('Utility', r.utility)}
    ${field('Fault Type', r.faultLabel)}
    ${field('Reported Duration', r.duration)}
    ${field('Block / Area', r.block)}
    ${field('Street Address', r.address)}
    ${field('Contact Number', r.phone)}
    ${field('Coordinates', r.lat.toFixed(4) + ', ' + r.lng.toFixed(4))}
    ${field('Priority Score', r.priorityScore + ' / 5')}
  </div>

  <div class="block">
    <div class="label">Reported Description</div>
    <div>${esc(r.description) || '&mdash;'}</div>
  </div>

  <div class="note">
    Priority is derived from the fault type and how long the resident reported the power being off;
    it is not selected by the person filing the report.
    Location on <a href="https://www.google.com/maps/search/?api=1&amp;query=${r.lat},${r.lng}">Google Maps</a>.
    <br/>Document generated ${esc(GridState.formatDateTime(new Date().toISOString()))}.
  </div>
</div>
${autoPrint ? '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},250)})<\/script>' : ''}
</body>
</html>`;
    },
  };

  global.GridExport = api;
})(window);
