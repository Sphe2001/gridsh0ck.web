// ── HISTORICAL OUTAGE DATA (City of Tshwane) ───────────────────
// Data source note: OurPower (ourpower.co.za) compiles public City of
// Tshwane outage announcements, but has moved to a permission-based API
// model and no longer allows open scraping of their site. This dataset is
// therefore a representative/simulated 90-day sample modelled on the
// publicly reported suburb, substation and cause patterns described on
// their site and in City of Tshwane announcements — not a live or scraped
// feed. Swap this file for a real import once API access is granted.
const OBSERVATION_WINDOW_DAYS = 90;

const TSHWANE_HISTORICAL_OUTAGES = [
  { area: 'Soshanguve',    daysWithOutage: 71, incidents: 94, commonCause: 'Transformer faults & vandalism' },
  { area: 'Mamelodi',      daysWithOutage: 64, incidents: 81, commonCause: 'Cable faults' },
  { area: 'Atteridgeville',daysWithOutage: 58, incidents: 70, commonCause: 'Transformer overload' },
  { area: 'Pyramid / Rooiwal', daysWithOutage: 56, incidents: 66, commonCause: 'Transformer trips' },
  { area: 'Centurion',     daysWithOutage: 50, incidents: 58, commonCause: 'Substation faults' },
  { area: 'Wonderboom',    daysWithOutage: 47, incidents: 53, commonCause: 'Cable faults' },
  { area: 'Daspoort',      daysWithOutage: 44, incidents: 49, commonCause: 'MV cable faults' },
  { area: 'Rietfontein',   daysWithOutage: 39, incidents: 42, commonCause: 'Equipment failure' },
  { area: 'Pienaarspoort', daysWithOutage: 33, incidents: 35, commonCause: 'Unknown / under investigation' },
  { area: 'Zandfontein',   daysWithOutage: 22, incidents: 24, commonCause: 'Meter faults' },
].map(a => ({
  ...a,
  observedDays: OBSERVATION_WINDOW_DAYS,
  ratePct: Math.round((a.daysWithOutage / OBSERVATION_WINDOW_DAYS) * 1000) / 10,
}));

// ── PRIORITY THRESHOLDS ─────────────────────────────────────────
// >70% = Critical, >60% = Medium, >50% = Low. Anything above 50% is
// flagged as a problem so it can be addressed before it escalates.
const PRIORITY_THRESHOLDS = { CRITICAL: 70, MEDIUM: 60, LOW: 50 };

function classifyOutageRate(ratePct) {
  if (ratePct > PRIORITY_THRESHOLDS.CRITICAL) {
    return { level: 'critical', label: 'Critical', badge: 'red', flagged: true };
  }
  if (ratePct > PRIORITY_THRESHOLDS.MEDIUM) {
    return { level: 'medium', label: 'Medium', badge: 'orange', flagged: true };
  }
  if (ratePct > PRIORITY_THRESHOLDS.LOW) {
    return { level: 'low', label: 'Low', badge: 'yellow', flagged: true };
  }
  return { level: 'normal', label: 'Normal', badge: 'green', flagged: false };
}

const TSHWANE_PRIORITY_AREAS = TSHWANE_HISTORICAL_OUTAGES
  .map(a => ({ ...a, ...classifyOutageRate(a.ratePct) }))
  .sort((a, b) => b.ratePct - a.ratePct);
