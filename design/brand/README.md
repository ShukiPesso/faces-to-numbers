# Brand mark — כלנית (anemone)

One abstract six-petal anemone, single color memorial red `#9E1B1B`, centre left open (paper shows through).
Paper background `#FAF8F4`, navy `#1F3864` and muted `#595959` for text in the social image. Nothing else.

## Files

| File | Size | Use |
|---|---|---|
| `mark.svg` | viewBox 100×100, transparent | Header logo, end-of-story divider |
| `favicon.svg` | viewBox 100×100, paper rounded square | `<link rel="icon" type="image/svg+xml">` |
| `icon-192.png` | 192×192 | PWA manifest icon |
| `icon-512.png` | 512×512 | PWA manifest icon |
| `icon-maskable-512.png` | 512×512 | PWA manifest, `purpose: maskable`; mark inside the central 80% (it spans about 47%) |
| `apple-touch-icon-180.png` | 180×180 | `apple-touch-icon` |
| `og-image-1200x630.png` | 1200×630 | `og:image` / `twitter:image`; mark + "פנים למספרים" + `app.tagline` |

## Usage rules

- Per `design/01-principles.md`: only in the logo/header, the app icon, and at most as a small divider at the end of a person's story.
- Never as a pattern or background, never next to numbers, never animated, never scaled up as a large fill.
- Do not recolor, outline, add text inside, or combine with flags or other symbols. Keep clear space of at least half the mark's width.
- Minimum size 16 px (favicon). Provide an accessible name where it is not decorative (`<title>כלנית</title>`).
- The text in `og-image-1200x630.png` is "פנים למספרים" (Frank Ruhl Libre 700) and `app.tagline` exactly as in `contracts/strings.he.ts` (Assistant 400). If either string changes, regenerate the image.

## Marks added for "מאפר לכלנית" (2026-10-16)

| File | Use |
|---|---|
| `mark-night.svg` | The same anemone in #F0545B, the only mark on night bands (`public/icons/mark-night.svg`). |
| `mark-ash.svg` | The anemone in grey #6E6E6E: empty photo frame, start of the route. |
| `mark-awakening.svg` | Three red petals, three grey: the turn from ash to bloom. |
| `mark-rising.svg` | The rising anemone — petals spread as wings out of grey ash; a phoenix without flames. Closing station only; light grounds only. |
