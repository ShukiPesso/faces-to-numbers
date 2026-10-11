# 08 — Risk Register

| ID | Risk | Likelihood | Impact | Mitigation | Owner / task |
|---|---|---|---|---|---|
| R-01 | Base44 `deploy-dist` is **beta**; contract, limits or behaviour may change | Medium | High | Build is a plain static folder; O-01 documents a tested fallback (Cloudflare Pages or Netlify) in `docs/DEPLOY_BASE44.md`; switching host = one CI job change | O-01, O-03 |
| R-02 | Unknown deploy details (API host, auth header, upload encoding) | High (until O-01) | Medium | O-01 spike discovers and documents them before any deploy work; no guessing | O-01 |
| R-03 | Agents invent or alter facts about real people | Medium | **Severe** | Conventions §1; content-source as single truth; integrity tests CI-03/04/05 compare every field to source; human sign-off H-06 | C-*, T-03, H-06 |
| R-04 | Publishing names/stories/photos without family consent | Medium | **Severe** | No press photos ever; photo `pending` by default; family outreach H-03 before public launch; corrections contact on About page | H-03, H-04 |
| R-05 | Wrong coordinates send people to the wrong (or a closed/dangerous) place | Medium | High | `location: null` until verified by Shuki; bounding-box test catches swapped lat/lng; nav links hidden for unverified points | C-05, H-02, CI-08 |
| R-06 | Access to sites changes (Tkuma lot moved/closed, Nova site works with KKL's ₪4M upgrade, security closures) | High | Medium | `accessNotes` + `lastVerified` per station; safety banner to check current status; review content every 3 months | C-03, H-02 |
| R-07 | Service worker serves stale content after updates | Medium | Medium | `registerType: 'prompt'` + update banner; content version in footer; E2E-OFF tests | F-18, T-07 |
| R-08 | Offline fails on iOS Safari (storage eviction, SW quirks) | Medium | High | Keep precache small (≤ 2 MB); field test on a real iPhone (H-05); graceful degradation if SW unavailable | F-18, H-05 |
| R-09 | GPS inaccuracy near stations / in a moving car | Medium | Low | Suggestion only ("נראה שאתם ב…"), never auto-navigation; radius ≥ 300 m; "near" shows distance | F-15 |
| R-10 | Driver distraction | Low | **Severe** | Driver warning on drive segments and in safety notes; read-aloud mode for passengers; no interaction required while driving | F-17, C-04 |
| R-11 | Tone misjudged (gamified, sensational, political) | Low | High | Design brief + Conventions §1.4/§1.8 + banned-words tests + design QA + human sign-off | D-01, T-08, H-06 |
| R-12 | Parallel agents overwrite each other's work | Medium | Medium | File ownership per task; generator rejects same-wave conflicts; branch per task; orchestrator-only merges | generator, orchestrator |
| R-13 | Weaker agents drift from contracts | Medium | Medium | Frozen contracts copied in P0-02; exact signatures in Architecture §6; unit tests written by a different agent than the implementer | P0-02, T-* |
| R-14 | Content becomes outdated (new findings, corrections from families) | Medium | Medium | `lastContentReview` date shown on About page; corrections log in `content-source/CORRECTIONS.md`; contact for corrections | C-04 |
