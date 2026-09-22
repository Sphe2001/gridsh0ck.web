# gridsh0ck

A front-end prototype for municipal **electricity** outage management in Soshanguve, City of
Tshwane. It covers the same fault from three sides: the operations centre that sees every outage,
the resident who reports one, and the electrician who gets sent to fix it. Water, sewage and roads
are deliberately out of scope — this is an electricity product.

**Live site:** https://GITHUB_USER_PLACEHOLDER.github.io/gridsh0ck.web/

> **Prototype.** Every figure, outage, electrician and map marker on these pages is simulated data
> generated in the browser. Nothing here is connected to City of Tshwane systems, and the numbers
> shown are not real service information.

## Pages

| Page | Who it's for | What it does |
| --- | --- | --- |
| [`index.html`](index.html) | Everyone | Public marketing home page — Home / About / Contact Us, links into Sign In, Sign Up and all three portals |
| [`signup.html`](signup.html) | Everyone | Prototype sign-up form — picks a role (citizen / electrician / municipal) and routes to that portal |
| [`signin.html`](signin.html) | Everyone | Prototype sign-in form — same role-based routing, no real credentials are checked or stored |
| [`dashboard.html`](dashboard.html) | Municipal operations | Outage dashboard — KPIs, citizen fault reports, live map, AI dispatch, crew tracking, workforce, performance, predictive risk, maintenance and analytics |
| [`citizen.html`](citizen.html) | Residents | Report an electricity fault, track its status, view outages in the area |
| [`electrician.html`](electrician.html) | Field crews | Dispatched tickets (downloadable), assigned jobs, routing, and status updates from the field |

## Reporting a fault

A fault filed in the citizen portal is written to a shared ledger (`grid-state.js`) that the
dashboard and the electrician portal both read, so all three sides work one record:

1. A resident fills in **Report Outage** in [`citizen.html`](citizen.html). Priority is *derived*
   from the fault type and how long the power has been off — a resident cannot mark their own fault
   critical. The ledger is checked first for an open fault of the same type on the same block, and
   the existing reference is offered instead.
2. **Dispatch runs on submit.** The engine picks the nearest electrician who still has capacity and
   assigns the fault immediately, so the resident's confirmation already names the crew coming out.
3. The electrician's copy appears under **Dispatched Tickets** in
   [`electrician.html`](electrician.html) — with a toast and a sidebar count, no reload. They can
   **Download ticket** (a self-contained file that opens with no signal), print it, get directions,
   accept it, and mark it resolved.
4. Operations watches the same record under **Fault Reports** in [`dashboard.html`](dashboard.html):
   who it went to, why, and its live status. Faults that arrive with every crew at capacity are
   flagged **Awaiting crew** there and assign themselves the moment someone closes a job.

### How a crew is chosen

Nearest crew wins, with each open ticket they already hold counting against them as 3 km of
notional travel (`LOAD_PENALTY_KM` in `grid-state.js`). That keeps work spread instead of stacking
on whoever happens to be closest. An electrician holds at most `MAX_ACTIVE_JOBS` (2) open tickets;
past that they are not offered more. Every assignment stores the reason it was made, which is what
the dashboard and the printed ticket show — the routing is inspectable rather than asserted.

A dispatcher can override any of it with `GridState.reassign(ref, crewId)`.

### Downloads

Per-fault downloads belong to the **electrician**, who has to work the ticket: `Download ticket`
and `Print` on each card, plus `Export` in the topbar for their whole shift as CSV. Operations
keeps the queue-level **Export CSV** and **Export JSON** for records, and no longer downloads
individual faults.

The ledger lives in `localStorage` and syncs between open tabs over a `BroadcastChannel`. Nothing
leaves the browser. **Reset demo data** in the Fault Reports toolbar returns it to its seeded state.

To see the whole thing work, open [`citizen.html`](citizen.html), [`dashboard.html`](dashboard.html)
and [`electrician.html`](electrician.html) in three tabs of the same browser, submit a report in the
first, and watch it reach the other two. The electrician portal has a **Signed in as** picker so you
can view whichever crew the engine chose.

The sidebar on each portal links to the other portals and back to the home page. Sign In / Sign Up
are UI-only: submitting either form just redirects to the portal matching the selected role — there
is no backend, and no account or password is actually created or verified.

## Built with

Plain HTML, CSS and JavaScript — no framework, no build step, no bundler. Three libraries load from
CDNs at runtime:

- [Leaflet](https://leafletjs.com/) 1.9.4 (+ `leaflet.heat`) — maps and outage heatmaps
- [Chart.js](https://www.chartjs.org/) — dashboard charts
- [Font Awesome](https://fontawesome.com/) 6.5.0 — icons
- Map tiles from [OpenStreetMap](https://www.openstreetmap.org/copyright)

Because the libraries are fetched over the network, the pages need an internet connection to render
maps and charts.

## Running it locally

There is nothing to install or compile. Either open `index.html` (the home page) in a browser, or
serve the folder to avoid any file-protocol quirks:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

VS Code's Live Server extension works too — the workspace is set to port 5501.

## Deployment

The site is served by GitHub Pages from the `main` branch, root folder. Anything pushed to `main`
publishes automatically, usually within a minute.

`.nojekyll` is present so Pages serves the files as-is instead of running them through Jekyll.

## Structure

```
index.html  home.css  home.js                 home page (Home / About / Contact Us)
signup.html  signin.html  auth.css  auth.js    prototype sign up / sign in
dashboard.html  app.js  historical-data.js     operations dashboard
citizen.html  citizen.css  citizen.js          citizen portal
electrician.html  electrician.css  electrician.js
grid-state.js                                  shared fault ledger — storage, priority, dispatch, cross-tab sync
report-export.js                               CSV / JSON exports and the downloadable fault ticket
style.css                                      shared shell — layout, sidebar, cards, colour variables
favicon.svg
.nojekyll                                      disables Jekyll processing on Pages
```

`grid-state.js` is the one place a fault record is defined, and it also holds the crew roster and
the dispatch engine. All three portals load it, which is what lets a report filed on one surface
appear on the others.

`style.css` holds the shared shell — layout, sidebar, cards, colour variables — and each page's
own stylesheet layers on top of it. `historical-data.js` holds the simulated 90-day historical
outage dataset and the priority-flagging logic used by the dashboard's Predictive Risk section.
