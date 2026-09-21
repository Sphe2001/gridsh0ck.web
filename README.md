# PowerPulse

A front-end prototype for municipal outage management in Soshanguve, City of Tshwane. It covers
the same incident from three sides: the operations centre that sees every outage, the resident who
reports one, and the technician who gets sent to fix it.

**Live site:** https://GITHUB_USER_PLACEHOLDER.github.io/gridsh0ck.web/

> **Prototype.** Every figure, outage, technician and map marker on these pages is simulated data
> generated in the browser. Nothing here is connected to City of Tshwane systems, and the numbers
> shown are not real service information.

## The three portals

| Page | Who it's for | What it does |
| --- | --- | --- |
| [`index.html`](index.html) | Municipal operations | Outage dashboard — KPIs, live map, AI dispatch, crew tracking, workforce, performance, predictive risk, maintenance and analytics |
| [`citizen.html`](citizen.html) | Residents | Report an electricity or water fault, track its status, view outages in the area |
| [`technician.html`](technician.html) | Field crews | Assigned jobs, routing, and status updates from the field |

The sidebar on each page links to the other two.

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

There is nothing to install or compile. Either open `index.html` in a browser, or serve the folder
to avoid any file-protocol quirks:

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
index.html  style.css  app.js          operations dashboard
citizen.html  citizen.css  citizen.js  citizen portal
technician.html  technician.css  technician.js
favicon.svg
.nojekyll                              disables Jekyll processing on Pages
```

`style.css` holds the shared shell — layout, sidebar, cards, colour variables — and each portal's
own stylesheet layers on top of it.
