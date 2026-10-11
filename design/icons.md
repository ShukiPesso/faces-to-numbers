# Icons — Lucide and RTL rules

Status: v1 (D-06). Developers use this table and do not choose icons themselves. Icons come only from
`lucide-react` (installed version 1.55.0, MIT). Import by name: `import { House } from 'lucide-react'`.

## Rules

1. **Every action icon has a visible text label.** An icon alone never carries an action (P7, §5). Labels
   come from `t('key')`; the icon is decorative and gets `aria-hidden="true"`.
2. **Direction is mirrored, not redrawn.** Each directional glyph is authored in its LTR form and gets the
   class `rtl:scale-x-[-1]` on the `<svg>` itself (not on the button). Only arrows and chevrons mirror.
3. **Geographic and circular glyphs never mirror.** A north-pointing navigation arrow or a refresh cycle
   keeps its orientation; mirroring would change its meaning.
4. **Stroke:** 2 px at size md (24 px), 1.75 px at size sm (20 px). Never below 1.75 px.
5. **Sizes use tokens:** `--icon-sm` = 20 px, `--icon-md` = 24 px. Inside a 44 × 44 tap target the icon is
   centred; the target stays 44 × 44 even when the icon is 20 px. (Token names are proposed here; D-02 owns
   the final values in `design/tokens.css`.)
6. **No brand logos** (Waze, Google, Apple). Navigation uses the neutral `Navigation` glyph plus text.
7. **No glyphs depicting weapons, fire, smoke, blood, violence or captivity** (Conventions §1.6).

## Icon table

| # | Need | Lucide component | Used for | Size token | Stroke | Mirror in RTL |
|---|---|---|---|---|---|---|
| 1 | Home | `House` | Bottom nav "בית" (and SideNav home link) | `--icon-md` | 2 | no |
| 2 | Route / map | `Route` | Bottom nav "המסלול"; ProgressStepper and RouteMap headings | `--icon-md` | 2 | no |
| 3 | Where am I (location) | `LocateFixed` | Bottom nav "איפה אני" (links to `/tour?locate=1`) | `--icon-md` | 2 | no |
| 4 | About / info | `Info` | Bottom nav "אודות" | `--icon-md` | 2 | no |
| 5 | Sources | `BookOpen` | Footer link to sources; SourceList heading | `--icon-sm` | 1.75 | no |
| 6 | Next | `ChevronRight` | Sticky next button on station pages; "הבא" | `--icon-md` | 2 | **yes** (points left in RTL) |
| 7 | Previous | `ChevronLeft` | Sticky previous button on station pages; "הקודם" | `--icon-md` | 2 | **yes** (points right in RTL) |
| 8 | External navigation | `Navigation` | NavLinks (verified stations only): opens a navigation app, label is plain text, no brand name | `--icon-md` | 2 | no (a heading arrow, not a reading direction) |
| 9 | External link | `ExternalLink` | Any link that leaves the app (e.g. a source URL in SourceList) | `--icon-sm` | 1.75 | **yes** (arrow leaves in reading direction) |
| 10 | Visited / check | `Check` | Tour overview and StationCard, next to text "ביקרתם" | `--icon-sm` | 1.75 | no |
| 11 | Warning | `TriangleAlert` | DriveBanner and ContentWarningGate label (text in memorial red) | `--icon-md` | 2 | no |
| 12 | Silence | `VolumeX` | SilenceMoment start/end controls; sound-off state | `--icon-md` | 2 | no |
| 13 | Read-aloud | `Volume2` | ReadAloudToggle in the header slot | `--icon-md` | 2 | no |
| 14 | Share | `Share2` | Share action (secondary; placed by D-03/D-04) | `--icon-md` | 2 | no |
| 15 | Offline | `WifiOff` | OfflineIndicator status line | `--icon-sm` | 1.75 | no |
| 16 | Update / refresh | `RefreshCw` | UpdatePrompt button "לרענון" (reserved slot, never a pop-up) | `--icon-md` | 2 | no (circular) |
| 17 | Duration / clock | `Clock` | DurationBadge (30 שניות / 2 דקות / 5 דקות) | `--icon-sm` | 1.75 | no |
| 18 | Drive / car | `Car` | DriveBanner, next to the driver warning (F-10) | `--icon-md` | 2 | no |

## Verify

Every name above is checked against the installed package:

```
node -e "const l=require('lucide-react');const names=['House','Route','LocateFixed','Info','BookOpen','ChevronRight','ChevronLeft','Navigation','ExternalLink','Check','TriangleAlert','VolumeX','Volume2','Share2','WifiOff','RefreshCw','Clock','Car'];for(const n of names){if(!l[n])throw new Error(n)}console.log('ok')"
```

Mirror summary: `ChevronRight`, `ChevronLeft`, `ExternalLink` mirror. The other 15 rows do not.
