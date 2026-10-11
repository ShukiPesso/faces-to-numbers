# 01 — Project Brief

## 1. One-line description
A Hebrew, offline-capable, mobile-first web app that lets anyone take the Gaza-envelope October 7 memorial route on their own — one real person's story at every stop.

## 2. Origin
Shuki (the product owner) designed and personally guided this ~3-hour route for a small group. All the content in `content-source/` was researched for that tour: a route of 7 segments and 9 documented people (fallen, murdered, kidnapped), each with sources. The web app turns that guided tour into a self-guided one.

Over 250,000 people visited the Nova memorial site in the first third of 2026 alone (KKL figure). Today visitors either book a paid human guide or arrive with no context. Kan's "7.10.360" project is an excellent *remote* digital museum, but nothing accompanies a visitor **on site, in the car, offline, for free**. That is the gap.

## 3. The core message (every design and content decision serves this)
> Facing a cruel enemy that planned an even worse attack, the system failed to be ready — but individuals did not wait. Police officers, readiness-squad members, soldiers and ordinary civilians ran toward the fire on their own initiative and stopped an attack that could have been far more terrible. Deep pain, side by side with heroism and revival.

The tone is **quiet, factual and respectful**. Not a thriller, not a game, not propaganda.

## 4. Users and contexts of use

| # | Who | Where / when | What they need |
|---|---|---|---|
| U1 | A family or group in one private car | Driving route 232; a **passenger** holds the phone | Big readable text to read aloud; next-stop navigation; no need to touch much |
| U2 | Visitors standing at a stop (Nova site, Tkuma lot, observers' hill) | Outdoors, bright sun, weak signal, emotional | The story of the person connected to this exact place; how much to read in the time they have; a moment of silence |
| U3 | A solo visitor or older visitor | On site | Large text, simple navigation, no clutter |
| U4 | Someone planning a visit at home | Desktop / tablet, online | Overview, route, timing, practical access notes, sources |

Primary devices: phones (iOS Safari, Android Chrome). Must also work well on tablets and desktop browsers.

## 5. MVP scope (what "done" means for launch)

**In scope**
- Home: what this is, the message, safety notes, how to use, start / resume.
- Tour overview: ordered list of 7 segments, a schematic route map (offline), total time.
- Station page: background, what to notice, the people of this place, navigation links (only for verified coordinates), access notes, optional silence moment, previous/next.
- Person page: opening line, what they did on Oct 7, who they were, a story from their past, what happened after, quote, sources; **reading depth** selector (30 sec / 2 min / 5 min); content-warning gate for graphic passages; photo placeholder.
- "Where am I?" — on-device geolocation suggests the nearest station. Never automatic, never tracked, never sent anywhere.
- Read-aloud mode (large text for a passenger reading to the car).
- Visited-stations progress stored locally; resume.
- Full offline support after first load; installable PWA.
- About / sources / rights statement / corrections page.
- Hebrew only, RTL.

**Out of scope for MVP (backlog for later)**
- Audio narration (planned phase 2 — Shuki works in Hebrew speech technology).
- English and other languages.
- Interactive tile map.
- User accounts, comments, payments, analytics.
- Feedback form (could later use Base44 entities).
- Real photos (blocked on rights & family consent — see decisions doc).

## 6. Success criteria for launch
1. A first-time visitor can complete the whole route using only the app, on an iPhone and an Android phone, including with airplane mode on after the first load.
2. Every fact on the site matches `content-source/` exactly (automated integrity tests pass).
3. Zero serious/critical accessibility violations (axe) on every route, at mobile, tablet and desktop sizes.
4. Lighthouse (mobile): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95; installable PWA.
5. Shuki completes a field test on the real route and signs off (task H-05).
6. Nothing on the site shows a press photo, autoplays media, or uses celebratory/gamified language.

## 7. Non-functional requirements
- **Offline:** all pages and content precached; first load ≤ 2 MB total transfer (excluding future audio).
- **Performance:** LCP ≤ 2.5 s on a mid-range phone over 4G; JS ≤ 200 KB gzipped.
- **Accessibility:** WCAG 2.2 AA minimum; body text contrast ≥ 7:1 (outdoor sunlight).
- **Privacy:** no cookies, no trackers, no analytics in MVP; location never leaves the device.
- **Hosting:** static files only; published to Base44 via `deploy-dist` (≤ 50 MB, ≤ 1,000 files).
