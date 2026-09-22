// ── SHARED INCIDENT LEDGER ──────────────────────────────────────
// One electricity-fault record, visible from every portal.
//
// The prototype has no backend, so the ledger lives in localStorage and
// changes are announced over a BroadcastChannel. That is enough for the
// thing the product actually claims: a resident files a fault in the
// citizen portal and operations sees the same record appear — live, in
// another tab — without either side reloading.
//
// Nothing here leaves the browser. Clearing site data resets it.
(function (global) {
  'use strict';

  const STORE_KEY = 'gridsh0ck.ledger.v1';
  const CHANNEL = 'gridsh0ck.ledger';
  const REF_PREFIX = 'RPT-';

  // Bumped whenever a stored record gains fields. A browser that already holds
  // an older ledger is migrated on read (see migrate) rather than being handed
  // back records the current code cannot use — an unmigrated report has no
  // electrician on it, which makes it invisible in the field portal.
  const SCHEMA = 2;

  // Soshanguve block centroids — the same coordinates the maps already use,
  // so a report filed against a block lands on the operations map correctly.
  const BLOCK_COORDS = {
    'Block X':  [-25.5050, 28.0750],
    'Block S':  [-25.5180, 28.1020],
    'Block H':  [-25.5320, 28.0650],
    'Block F':  [-25.5400, 28.1100],
    'Block BB': [-25.5100, 28.0900],
    'Block GG': [-25.5250, 28.0800],
    'Block AA': [-25.5150, 28.1150],
    'Block R':  [-25.5290, 28.0700],
    'Block CC': [-25.5350, 28.0950],
    'Block EE': [-25.5480, 28.0820],
    'Block DD': [-25.5060, 28.1050],
    'Block T':  [-25.5420, 28.1200],
  };

  // Electricity fault types. The weight feeds the priority score below.
  const FAULT_TYPES = {
    'no-power':    { label: 'No Power',               weight: 3, icon: 'fa-plug-circle-xmark' },
    'partial':     { label: 'Partial Power',          weight: 2, icon: 'fa-plug-circle-exclamation' },
    'streetlight': { label: 'Street Light',           weight: 1, icon: 'fa-lightbulb' },
    'damage':      { label: 'Damaged Infrastructure', weight: 3, icon: 'fa-bolt' },
  };

  // How long the resident says the power has been off.
  const DURATION_WEIGHTS = {
    'Less than 1 hour': 0,
    '1-3 hours': 0,
    '3-6 hours': 0,
    'More than 6 hours': 1,
    'More than a day': 2,
  };

  // Priority is derived, not typed in — a resident cannot mark their own
  // fault critical. Fault weight plus how long the power has been off.
  function derivePriority(faultType, duration) {
    const base = (FAULT_TYPES[faultType] || FAULT_TYPES['no-power']).weight;
    const bump = DURATION_WEIGHTS[duration] || 0;
    const score = base + bump;
    if (score >= 4) return { priority: 'Critical', badge: 'red', score };
    if (score === 3) return { priority: 'High', badge: 'orange', score };
    return { priority: 'Medium', badge: 'yellow', score };
  }

  const STATUS_BADGES = {
    'New': 'red',
    'Verified': 'orange',
    'Assigned': 'purple',
    'In Progress': 'orange',
    'Resolved': 'green',
  };

  // ── FIELD CREW ────────────────────────────────────────────────
  // The electricians dispatch can draw on. `base` is where each one starts
  // the shift, which is what proximity is measured from.
  const CREW = [
    { id: 'jd', name: 'J. Dlamini', initials: 'JD', team: 'Electrical Team',  lat: -25.5055, lng: 28.0755 },
    { id: 'tm', name: 'T. Mokoena', initials: 'TM', team: 'Electrical Team',  lat: -25.5185, lng: 28.1025 },
    { id: 'pn', name: 'P. Nkosi',   initials: 'PN', team: 'Substation Team',  lat: -25.5310, lng: 28.0660 },
    { id: 'ms', name: 'M. Sithole', initials: 'MS', team: 'Electrical Team',  lat: -25.5405, lng: 28.1105 },
    { id: 'lk', name: 'L. Khumalo', initials: 'LK', team: 'Lines Team',       lat: -25.5255, lng: 28.0805 },
  ];

  // How many open tickets one electrician is allowed to hold. Past this they
  // are not offered more work — the report waits for capacity instead.
  const MAX_ACTIVE_JOBS = 2;

  function crewById(id) { return CREW.find(c => c.id === id) || null; }

  /** Rough ground distance in km. Good enough to rank crews within a township. */
  function distanceKm(a, b) {
    const latKm = 110.9, lngKm = 100.2; // at roughly -25.5 degrees latitude
    const dy = (a.lat - b.lat) * latKm;
    const dx = (a.lng - b.lng) * lngKm;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function activeJobCount(reports, crewId) {
    return reports.filter(r => r.assignedTo === crewId && r.status !== 'Resolved').length;
  }

  /**
   * Pick the electrician for a fault: nearest crew wins, with each open job
   * they already hold counting against them. The weighting is deliberately
   * plain so the dashboard can show why a crew was chosen rather than
   * asserting that an opaque model decided.
   */
  const LOAD_PENALTY_KM = 3; // one open job costs a crew the same as 3km of travel

  function pickCrew(report, reports) {
    const candidates = CREW
      .map(crew => ({ crew, jobs: activeJobCount(reports, crew.id) }))
      .filter(c => c.jobs < MAX_ACTIVE_JOBS)
      .map(c => {
        const km = distanceKm(c.crew, report);
        return { ...c, km, score: km + c.jobs * LOAD_PENALTY_KM };
      })
      .sort((a, b) => a.score - b.score || a.km - b.km);
    return candidates[0] || null;
  }

  /** Assign a report in place. Leaves it queued when every crew is at capacity. */
  function assign(report, reports) {
    const best = pickCrew(report, reports);
    if (!best) {
      report.assignedTo = null;
      report.assignedToName = null;
      report.assignedAt = null;
      report.assignmentReason = 'All crews at capacity — queued for the next available electrician.';
      report.awaitingCrew = true;
      report.status = 'New';
      report.statusBadge = STATUS_BADGES['New'];
      return report;
    }
    report.assignedTo = best.crew.id;
    report.assignedToName = best.crew.name;
    report.assignedTeam = best.crew.team;
    report.assignedAt = nowISO();
    report.assignmentKm = Math.round(best.km * 10) / 10;
    report.assignmentJobs = best.jobs;
    report.assignmentReason = best.jobs === 0
      ? `Nearest free crew — ${Math.round(best.km * 10) / 10} km away, no open tickets.`
      : `Nearest crew with capacity — ${Math.round(best.km * 10) / 10} km away, ${best.jobs} open ticket${best.jobs > 1 ? 's' : ''}.`;
    report.awaitingCrew = false;
    report.status = 'Assigned';
    report.statusBadge = STATUS_BADGES['Assigned'];
    return report;
  }

  /**
   * Try again on everything still waiting for a crew. Called whenever capacity
   * frees up, so a queued fault is picked up the moment someone closes a job
   * instead of sitting until a dispatcher notices.
   */
  function assignQueued(reports) {
    const assigned = [];
    reports
      .filter(r => r.awaitingCrew)
      .sort((a, b) => b.priorityScore - a.priorityScore ||
                      new Date(a.reportedAt) - new Date(b.reportedAt))
      .forEach(r => {
        if (pickCrew(r, reports)) { assign(r, reports); assigned.push(r); }
      });
    return assigned;
  }

  // Reports the rest of the UI already refers to by number. Seeded once so a
  // first-time visitor sees a populated ledger instead of an empty table, and
  // so duplicate detection has something to match against.
  const SEED = [
    { seq: 91, faultType: 'no-power',    block: 'Block X', address: '12 Mabunda Street', description: 'No power since this morning, the whole street is off.', duration: 'More than 6 hours', status: 'In Progress', crew: 'jd', minutesAgo: 190,   phone: '+27 82 000 0001' },
    { seq: 88, faultType: 'damage',      block: 'Block S', address: '9 Nkosi Road',      description: 'Sparking distribution box on the corner.',              duration: '1-3 hours',         status: 'Assigned',    crew: 'tm', minutesAgo: 95,    phone: '+27 82 000 0002' },
    { seq: 78, faultType: 'partial',     block: 'Block X', address: '4 Tau Street',      description: 'Flickering lights and the breaker keeps tripping.',     duration: '3-6 hours',         status: 'Resolved',    crew: 'jd', minutesAgo: 16320, phone: '+27 82 000 0001' },
    { seq: 54, faultType: 'streetlight', block: 'Block X', address: 'Mabunda Street',    description: 'Street light out for two weeks, dark at night.',        duration: 'More than a day',   status: 'Resolved',    crew: 'lk', minutesAgo: 54720, phone: '+27 82 000 0001' },
  ];

  function nowISO() { return new Date().toISOString(); }

  function readStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.reports)) {
          if (parsed.v === SCHEMA) return parsed;
          const upgraded = migrate(parsed);
          writeStore(upgraded);
          return upgraded;
        }
      }
    } catch (err) {
      // Private mode, blocked storage, or a corrupt payload — fall through to
      // a fresh seeded ledger rather than leaving the portals empty.
    }
    return seedStore();
  }

  /**
   * Bring a ledger written by an older build up to the current shape. Reports
   * the resident already filed are kept — they are the point of the thing — and
   * anything still open but undispatched is put through the engine, so an
   * upgrade never leaves a fault that no electrician can see.
   */
  function migrate(store) {
    store.reports.forEach(r => {
      if (!('assignedTo' in r)) {
        r.assignedTo = null;
        r.assignedToName = null;
        r.assignedTeam = null;
        r.assignedAt = null;
        r.assignmentKm = null;
        r.assignmentJobs = null;
        r.assignmentReason = null;
        r.acceptedAt = null;
      }
      // Fields added alongside dispatch that older records also predate.
      if (!r.faultIcon && FAULT_TYPES[r.faultType]) r.faultIcon = FAULT_TYPES[r.faultType].icon;
      if (!r.utility) r.utility = 'Electricity';
      // Open work with nobody on it goes back in the queue for the engine.
      r.awaitingCrew = !r.assignedTo && r.status !== 'Resolved';
    });
    assignQueued(store.reports);
    store.v = SCHEMA;
    return store;
  }

  function seedStore() {
    const reports = SEED.map(s => {
      const { minutesAgo, ...rest } = s;
      return buildReport(rest, new Date(Date.now() - minutesAgo * 60000).toISOString());
    });
    const store = { v: SCHEMA, seq: 93, reports };
    writeStore(store);
    return store;
  }

  function writeStore(store) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (err) {
      // Storage unavailable — the in-memory copy still drives this tab.
    }
  }

  function buildReport(data, reportedAt) {
    const block = data.block || 'Block X';
    const coords = BLOCK_COORDS[block] || BLOCK_COORDS['Block X'];
    const faultType = FAULT_TYPES[data.faultType] ? data.faultType : 'no-power';
    const { priority, badge, score } = derivePriority(faultType, data.duration);
    const status = data.status || 'New';
    const crew = data.crew ? crewById(data.crew) : null;
    return {
      // Dispatch. Filled in by assign(); a seeded report names its crew directly.
      assignedTo: crew ? crew.id : null,
      assignedToName: crew ? crew.name : null,
      assignedTeam: crew ? crew.team : null,
      assignedAt: crew ? (reportedAt || nowISO()) : null,
      assignmentKm: null,
      assignmentJobs: null,
      assignmentReason: crew ? 'Assigned by the dispatch engine.' : null,
      awaitingCrew: false,
      acceptedAt: null,
      ref: REF_PREFIX + String(data.seq).padStart(4, '0'),
      seq: data.seq,
      utility: 'Electricity',
      faultType,
      faultLabel: FAULT_TYPES[faultType].label,
      faultIcon: FAULT_TYPES[faultType].icon,
      block,
      address: data.address || '',
      description: data.description || '',
      duration: data.duration || 'Less than 1 hour',
      phone: data.phone || '',
      priority,
      priorityBadge: badge,
      priorityScore: score,
      status,
      statusBadge: STATUS_BADGES[status] || 'red',
      source: data.source || 'Citizen Portal',
      lat: coords[0],
      lng: coords[1],
      reportedAt: reportedAt || nowISO(),
    };
  }

  // ── Change notification ───────────────────────────────────────
  const listeners = new Set();
  let channel = null;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => notify('remote');
  } catch (err) {
    // No BroadcastChannel — the storage event below still covers other tabs.
  }

  global.addEventListener('storage', e => {
    if (e.key === STORE_KEY) notify('remote');
  });

  function notify(origin) {
    const reports = api.getReports();
    listeners.forEach(fn => {
      try { fn(reports, origin); } catch (err) { /* one broken listener must not stop the rest */ }
    });
  }

  function announce() {
    if (channel) { try { channel.postMessage({ t: Date.now() }); } catch (err) { /* channel closed */ } }
    notify('local');
  }

  // ── Public API ────────────────────────────────────────────────
  const api = {
    BLOCK_COORDS,
    FAULT_TYPES,
    DURATION_WEIGHTS,
    derivePriority,

    /** Every report, newest first. */
    getReports() {
      return readStore().reports.slice().sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
    },

    get(ref) {
      return readStore().reports.find(r => r.ref === ref) || null;
    },

    /**
     * File a new fault. The dispatch engine picks an electrician straight
     * away, so the record arrives in the field portal already assigned.
     * Returns the stored record, including its reference and crew.
     */
    submitReport(data) {
      const store = readStore();
      store.seq += 1;
      const report = buildReport({ ...data, seq: store.seq }, nowISO());
      store.reports.push(report);
      assign(report, store.reports);
      writeStore(store);
      announce();
      return report;
    },

    updateStatus(ref, status) {
      const store = readStore();
      const report = store.reports.find(r => r.ref === ref);
      if (!report) return null;
      const freedCapacity = report.status !== 'Resolved' && status === 'Resolved';
      report.status = status;
      report.statusBadge = STATUS_BADGES[status] || 'red';
      if (status === 'In Progress' && !report.acceptedAt) report.acceptedAt = nowISO();
      // Closing a ticket frees the crew, so anything that was waiting for
      // capacity gets picked up now rather than sitting until someone looks.
      if (freedCapacity) assignQueued(store.reports);
      writeStore(store);
      announce();
      return report;
    },

    /** The electrician accepts the ticket and starts travelling. */
    acceptTicket(ref) {
      return api.updateStatus(ref, 'In Progress');
    },

    /** Hand a report to a different electrician by hand. */
    reassign(ref, crewId) {
      const store = readStore();
      const report = store.reports.find(r => r.ref === ref);
      const crew = crewById(crewId);
      if (!report || !crew) return null;
      report.assignedTo = crew.id;
      report.assignedToName = crew.name;
      report.assignedTeam = crew.team;
      report.assignedAt = nowISO();
      report.assignmentKm = Math.round(distanceKm(crew, report) * 10) / 10;
      report.assignmentJobs = activeJobCount(store.reports, crew.id);
      report.assignmentReason = 'Reassigned by a dispatcher.';
      report.awaitingCrew = false;
      if (report.status === 'New') {
        report.status = 'Assigned';
        report.statusBadge = STATUS_BADGES['Assigned'];
      }
      writeStore(store);
      announce();
      return report;
    },

    /** The crew roster, each with the open tickets they currently hold. */
    getCrew() {
      const reports = readStore().reports;
      return CREW.map(c => ({
        ...c,
        activeJobs: activeJobCount(reports, c.id),
        atCapacity: activeJobCount(reports, c.id) >= MAX_ACTIVE_JOBS,
      }));
    },

    crewById,
    MAX_ACTIVE_JOBS,

    /** Open tickets for one electrician, most urgent first. */
    getTicketsFor(crewId, includeResolved) {
      return api.getReports()
        .filter(r => r.assignedTo === crewId && (includeResolved || r.status !== 'Resolved'))
        .sort((a, b) => b.priorityScore - a.priorityScore ||
                        new Date(b.reportedAt) - new Date(a.reportedAt));
    },

    /**
     * Faults already on file for the same block and fault type inside the
     * window. Used to warn a resident before they file a duplicate — the
     * existing report is more useful to them than a second reference number.
     */
    findSimilar(block, faultType, withinHours = 6) {
      const cutoff = Date.now() - withinHours * 3600000;
      return api.getReports().filter(r =>
        r.block === block &&
        r.faultType === faultType &&
        r.status !== 'Resolved' &&
        new Date(r.reportedAt).getTime() >= cutoff
      );
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** Wipe the ledger back to its seeded state. */
    reset() {
      try { localStorage.removeItem(STORE_KEY); } catch (err) { /* nothing to clear */ }
      seedStore();
      announce();
    },
  };

  // ── Formatting helpers shared by the portals ──────────────────
  /**
   * Whether this page can actually share the ledger with the other portals.
   * Opening the HTML files straight off disk (file://) gives each page an
   * opaque origin, so nothing written in one portal is readable in another —
   * which looks exactly like a report vanishing. Worth saying out loud.
   */
  api.storageWorks = function () {
    try {
      const probe = STORE_KEY + '.probe';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return global.location ? global.location.protocol !== 'file:' : true;
    } catch (err) {
      return false;
    }
  };

  api.formatDateTime = function (iso) {
    const d = new Date(iso);
    return d.toLocaleString('en-ZA', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  };

  api.formatDate = function (iso) {
    return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  api.timeAgo = function (iso) {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.round(hrs / 24) + 'd ago';
  };

  global.GridState = api;
})(window);
