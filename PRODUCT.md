# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three roles, each with their own portal:

- **Residents (Citizen Portal)** — report an electricity or water fault, track its status, and see outages in their area.
- **Field electricians (Electrician Portal)** — view assigned jobs, log repair notes, and track their route/status from the field.
- **Municipal operations staff (Dashboard)** — monitor every outage on a live map, run AI-assisted dispatch, track crews, and review workforce, performance, predictive-risk, maintenance and analytics data.

No role is more "primary" than another — the product's premise is that all three sides of one incident (report → dispatch → repair) share a single connected system, rather than each working from disconnected tools.

## Product Purpose

gridsh0ck is a working front-end prototype for municipal electricity/water outage management in Soshanguve, City of Tshwane. It takes an outage from initial report through verification, prioritisation, dispatch, repair, resident notification, and closure — and turns closed jobs into historical data used to flag recurring problem areas (90-day outage rate above 50%) before they become repeat failures.

Success is defined by the prototype scoring well against the brief of the **City of Tshwane Smart Outage Management challenge** it was built for. It is explicitly not an official City of Tshwane platform.

## Positioning

Where a municipality's status quo is disconnected spreadsheets, call centres, and no shared source of truth between residents, dispatch and field crews, gridsh0ck is the single system that carries one incident across all three sides in real time — same incident, one continuous record, from report to resolution to historical risk analysis.

## Operating Context

The seven-step outage lifecycle the product is built around: report outage → verify & deduplicate → prioritise → dispatch & assign → track & repair → notify customer → close & analyse.

- Municipal staff work from a dashboard with a live map, AI dispatch suggestions, GPS crew tracking, and analytics.
- Electricians work from a mobile-oriented field view: assigned jobs, routing, status updates.
- Residents self-serve: report a fault, track it, see nearby outages.
- Sign in / sign up are UI-only — role selection routes to the matching portal; no real auth exists.

## Capabilities and Constraints

- Plain HTML, CSS and JavaScript — no framework, no build step, no bundler. Deployed as static files via GitHub Pages from `main` (root folder, `.nojekyll` present).
- Runtime dependencies loaded from CDN: Leaflet 1.9.4 (+ `leaflet.heat`) for maps/heatmaps, Chart.js for dashboard charts, Font Awesome 6.5.0 for icons, OpenStreetMap tiles. An internet connection is required for maps and charts to render.
- **All data is simulated.** Every outage, electrician, KPI and map marker is generated in the browser (see `historical-data.js` for the 90-day simulated dataset and priority-flagging logic). Nothing connects to real City of Tshwane systems, and no real account, password, or message is ever created, verified, or delivered.
- **Durable constraint, confirmed:** the no-backend, simulated-data, static-frontend nature of the prototype is intentional and should be preserved going forward — design and build decisions should not assume a real backend, live data feed, or auth system will arrive later.
- No accessibility standard has been mandated; follow general good practice (contrast, keyboard navigation, semantic HTML) without treating a formal standard (e.g. WCAG AA) as a binding requirement.

## Brand Commitments

- Name: **gridsh0ck**. Existing logo: `favicon.svg`.
- Established tagline/positioning language: "See every outage. Dispatch the right crew. Keep residents informed — in real time."
- Every public-facing surface carries a visible prototype disclosure (e.g. the hero badge and footer line: "Prototype for a City of Tshwane Smart Outage Management challenge. Not an official City of Tshwane service.") — this disclosure is a binding commitment, not incidental copy, and must be preserved on any surface that could otherwise read as an official or live system.

## Evidence on Hand

- No real customer testimonials, case studies, press, partner logos, or live usage data exist or should be fabricated.
- No real City of Tshwane branding, data feeds, or approvals exist — the product is explicitly disclosed as unaffiliated and unofficial.
- `historical-data.js` contains the one dataset that functions as the product's "evidence" internally (simulated 90-day outage history) — it is synthetic and should continue to be presented as such.

## Product Principles

1. One incident, one system — every surface (citizen, electrician, dispatcher) should reinforce that they're looking at the same record from a different angle, not a siloed tool.
2. Never blur simulated for real — prototype/disclosure language stays visible; nothing should read as connected to a live municipal system or real user data.
3. Static-first by design — features and interactions should work believably without a real backend; don't design flows that silently assume server state that doesn't exist.
4. Built to the brief — this is a challenge submission; craft and polish should target what makes the entry compelling and evaluable, not speculative production features outside the brief's scope.

## Accessibility & Inclusion

No formal accessibility standard has been mandated for this project. Follow general good practice as a baseline (adequate contrast, keyboard operability, semantic HTML) rather than treating any specific standard (e.g. WCAG 2.1 AA) as a binding requirement.
