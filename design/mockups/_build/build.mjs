// D-04 mockup generator. Run from the repo root:  node design/mockups/_build/build.mjs
// Every content string is read from src/content/data/*.json and every UI string from
// src/i18n/he.ts, so nothing about a real person is retyped by hand (Conventions §1.1).
// Output: design/mockups/*.html (self-contained apart from ../tokens.css, ../brand/mark.svg
// and the bundled fonts in design/mockups/fonts/).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const out = join(here, '..');

// ---------- data ----------
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const tour = readJson('src/content/data/tour.json');
const stations = readJson('src/content/data/stations.json').sort((a, b) => a.order - b.order);
const people = readdirSync(join(root, 'src/content/data/people'))
  .map((f) => readJson(`src/content/data/people/${f}`))
  .sort((a, b) => a.order - b.order);
const station = (id) => stations.find((s) => s.id === id);
const person = (id) => people.find((p) => p.id === id);

const heSrc = readFileSync(join(root, 'src/i18n/he.ts'), 'utf8');
const heObj = heSrc.slice(
  heSrc.indexOf('export const he = ') + 'export const he = '.length,
  heSrc.indexOf('} as const;') + 1,
);
const he = new Function(`return (${heObj});`)();
const t = (key, params = {}) => {
  if (!(key in he)) throw new Error(`missing string ${key}`);
  return he[key].replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
};

const css = readFileSync(join(here, 'mockup.css'), 'utf8');

// ---------- icons (lucide-react icon nodes, inlined) ----------
const ICONS = {
  House: 'house',
  Route: 'route',
  LocateFixed: 'locate-fixed',
  Info: 'info',
  BookOpen: 'book-open',
  ChevronRight: 'chevron-right',
  ChevronLeft: 'chevron-left',
  Navigation: 'navigation',
  ExternalLink: 'external-link',
  Check: 'check',
  TriangleAlert: 'triangle-alert',
  VolumeX: 'volume-x',
  Volume2: 'volume-2',
  Share2: 'share-2',
  WifiOff: 'wifi-off',
  RefreshCw: 'refresh-cw',
  Clock: 'clock',
  Car: 'car',
};
const iconNodes = {};
for (const [name, file] of Object.entries(ICONS)) {
  const mod = await import(
    pathToFileURL(join(root, `node_modules/lucide-react/dist/esm/icons/${file}.mjs`)).href
  );
  iconNodes[name] = mod.__iconData.node;
}
const MIRROR = new Set(['ChevronRight', 'ChevronLeft', 'ExternalLink']);
function icon(name, size = 'md') {
  const node = iconNodes[name];
  const children = node
    .map(
      ([tag, attrs]) =>
        `<${tag} ${Object.entries(attrs)
          .filter(([k]) => k !== 'key')
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ')}/>`,
    )
    .join('');
  const cls = ['icon', size === 'sm' ? 'icon--sm' : '', MIRROR.has(name) ? 'icon--mirror' : '']
    .filter(Boolean)
    .join(' ');
  const sw = size === 'sm' ? '1.75' : '2';
  return `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${children}</svg>`;
}

// ---------- helpers ----------
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const paras = (text) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p>${inline(p.replace(/\n/g, ' '))}</p>`)
    .join('');
const md = (text) => `<div class="md" data-inline-text>${paras(text)}</div>`;
const mdRead = (text) => `<div class="md md--read" data-inline-text>${paras(text)}</div>`;
const list = (items) =>
  `<ul class="list">${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
const bdi = (s) => `<bdi>${esc(s)}</bdi>`;

function formatMinutes(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return m === 1 ? 'דקה' : `${m} דקות`;
  const hours = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`;
  if (m === 0) return hours;
  if (m === 30) return `${hours} וחצי`;
  if (m === 1) return `${hours} ודקה`;
  return `${hours} ו-${m} דקות`;
}
function formatDistance(meters) {
  if (meters < 995) return `${Math.max(10, Math.round(meters / 10) * 10)} מטר`;
  return `${Math.round(meters / 100) / 10} ק״מ`;
}
const fullName = (p) => (p.honorific ? `${p.name} ${p.honorific}` : p.name);
const total = tour.stationIds.length;

// Where links go inside the mockup set (other routes keep the app's hash path).
const MOCK_LINKS = {
  '/': 'home.html',
  '/tour': 'tour.html',
  '/tour?locate=1': 'tour.html#where-am-i',
  '/about': 'about.html',
  '/sources': 'sources.html',
  '/station/reim-shelter': 'station-stop.html',
  '/station/route-232': 'station-drive.html',
  '/person/aner-shapira': 'person-m2.html',
  '/person/roni-eshel': 'person-m5.html',
};
const href = (path) => MOCK_LINKS[path] ?? `#${path}`;

const btn = ({
  variant = 'secondary',
  label,
  iconName,
  iconEnd = false,
  hrefPath,
  testid,
  full = false,
  extra = '',
  pressed,
  cls = '',
}) => {
  const classes = `btn btn--${variant}${full ? ' btn--full' : ''}${cls ? ` ${cls}` : ''}`;
  const ic = iconName ? icon(iconName) : '';
  const body = iconEnd
    ? `<span class="btn__label">${label}</span>${ic}`
    : `${ic}<span class="btn__label">${label}</span>`;
  const tid = testid ? ` data-testid="${testid}"` : '';
  const pr = pressed === undefined ? '' : ` aria-pressed="${pressed}"`;
  return hrefPath !== undefined
    ? `<a class="${classes}" href="${href(hrefPath)}"${tid}${extra}>${body}</a>`
    : `<button type="button" class="${classes}"${tid}${pr}${extra}>${body}</button>`;
};

// ---------- shared components ----------
const NAV = [
  { key: 'home', to: '/', label: 'nav.home', icon: 'House' },
  { key: 'tour', to: '/tour', label: 'nav.tour', icon: 'Route' },
  { key: 'whereAmI', to: '/tour?locate=1', label: 'nav.whereAmI', icon: 'LocateFixed' },
  { key: 'about', to: '/about', label: 'nav.about', icon: 'Info' },
];

function header(currentNav) {
  return `<header class="hdr">
  <a class="hdr__home" href="${href('/')}"${currentNav === 'home' ? ' aria-current="page"' : ''}><img class="hdr__mark" src="../brand/mark.svg" alt="" width="24" height="24">${esc(t('app.name'))}</a>
  <div class="hdr__actions" data-slot="header-actions">
    <button type="button" class="btn btn--secondary toggle" data-testid="read-aloud-toggle" aria-pressed="false" data-js="read-aloud">${icon('Volume2')}<span class="btn__label">${esc(t('readAloud.label'))}</span></button>
    <p class="sr-only" role="status" data-js="read-aloud-status"></p>
  </div>
</header>`;
}

function sideNav(currentNav, ctx) {
  const links = NAV.map(
    (n) =>
      `<li><a class="sn-link" href="${href(n.to)}"${currentNav === n.key ? ' aria-current="page"' : ''}>${icon(n.icon)}<span class="sn-label">${esc(t(n.label))}</span></a></li>`,
  ).join('');
  const steps = stations
    .map((s) => {
      const cur = ctx.currentStation === s.id;
      const vis = ctx.visited.includes(s.id);
      return `<li><a class="sn-link sn-step" href="${href(`/station/${s.slug}`)}"${cur ? ' aria-current="page"' : ''}><span class="sn-dot" aria-hidden="true"><bdi>${s.order}</bdi></span><span class="sr-only">${esc(t('tour.stationOf', { n: s.order, total }))}</span><span class="sn-label">${esc(s.title)}</span>${vis ? `<span class="sn-check">${icon('Check', 'sm')}</span><span class="sr-only">${esc(t('tour.visited'))}</span>` : ''}</a></li>`;
    })
    .join('');
  return `<nav class="sidenav" aria-label="${esc(t('nav.label'))}" data-testid="side-nav">
  <ul>${links}</ul>
  <hr class="sn-rule" aria-hidden="true">
  <h2 class="sn-heading">${icon('Route', 'sm')}${esc(t('tour.title'))}</h2>
  <ol>${steps}</ol>
</nav>`;
}

function bottomNav(currentNav) {
  return `<nav class="bottomnav" aria-label="${esc(t('nav.label'))}" data-testid="bottom-nav">
  <ul>${NAV.map((n) => `<li><a class="bn-link" href="${href(n.to)}"${currentNav === n.key ? ' aria-current="page"' : ''}>${icon(n.icon)}<span>${esc(t(n.label))}</span></a></li>`).join('')}</ul>
</nav>`;
}

function footer() {
  const [before, after] = t('about.lastReview', { date: '\u0000' }).split('\u0000');
  return `<footer class="ftr"><div class="ftr__in">
  <ul>
    <li>${btn({ variant: 'quiet', label: esc(t('nav.sources')), iconName: 'BookOpen', hrefPath: '/sources' }).replace(icon('BookOpen'), icon('BookOpen', 'sm'))}</li>
    <li>${btn({ variant: 'quiet', label: esc(t('nav.about')), hrefPath: '/about' })}</li>
  </ul>
  <p class="ftr__caption">${esc(before)}${bdi(tour.lastContentReview)}${esc(after)}</p>
</div></footer>`;
}

function prevNext(s, placement) {
  const prev = stations.find((x) => x.order === s.order - 1);
  const next = stations.find((x) => x.order === s.order + 1);
  const prevHtml = prev
    ? `<a class="btn btn--secondary pn__prev" href="${href(`/station/${prev.slug}`)}" data-testid="prev-station">${icon('ChevronLeft')}<span class="pn__text"><span class="pn__label btn__label">${esc(t('station.prev'))}</span><span class="pn__title">${esc(prev.title)}</span></span></a>`
    : '<span></span>';
  const nextHtml = next
    ? `<a class="btn btn--secondary pn__next" href="${href(`/station/${next.slug}`)}" data-testid="next-station"><span class="pn__text"><span class="pn__label btn__label">${esc(t('station.next'))}</span><span class="pn__title">${esc(next.title)}</span></span>${icon('ChevronRight')}</a>`
    : `<p class="pn__end">${esc(t('station.end'))}</p>`;
  const cls = placement === 'inline' ? 'pn pn--inline' : 'pn';
  return `<div class="${cls}">${prevHtml}${nextHtml}</div>`;
}

const sectionHeading = (id, text, iconName) =>
  `<header><h2 class="h2" id="${id}">${iconName ? icon(iconName) : ''}${esc(text)}</h2></header>`;
const section = (id, title, body, iconName) =>
  `<section class="sec" aria-labelledby="${id}">${sectionHeading(id, title, iconName)}${body}</section>`;

function sourceList(sources) {
  return `<ul class="src">${sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span class="src__title"><span>${esc(s.title)}</span>${icon('ExternalLink', 'sm')}<span class="sr-only">${esc(t('common.externalLink'))}</span></span><span class="src__host"><bdi dir="ltr">${esc(new URL(s.url).hostname)}</bdi></span></a></li>`).join('')}</ul>`;
}

function shareButton(status = '') {
  return `<div class="share">${btn({ label: esc(t('share.button')), iconName: 'Share2', testid: 'share-button' })}<p class="share__status" role="status" aria-live="polite">${status}</p></div>`;
}

function durationBadge(min) {
  return `<span class="meta__item">${icon('Clock', 'sm')}${bdi(formatMinutes(min))}</span>`;
}

function personCard(p, variant) {
  const id = `pc-${p.id}`;
  const label =
    variant === 'companion' ? `<p class="pcard__label">${esc(t('person.companion'))}</p>` : '';
  return `<article class="pcard${variant === 'companion' ? ' pcard--companion' : ''}" aria-labelledby="${id}" data-testid="person-card-${p.id}">
  ${label}<h3 class="pcard__name" id="${id}">${esc(fullName(p))}</h3>
  <p class="pcard__sub">${esc(p.subtitle)}</p>
  ${md(p.opening)}
  ${btn({ label: esc(t('person.toStory', { name: p.name })), hrefPath: `/person/${p.id}` })}
</article>`;
}

function silence(s, state = 'idle') {
  const sm = s.silenceMoment;
  const [b, a] = t('silence.start', { seconds: '\u0000' }).split('\u0000');
  const startLabel = `${esc(b)}${bdi(sm.seconds)}${esc(a)}`;
  const idle = state === 'idle';
  const running = state === 'running';
  const ended = state === 'ended';
  return `<section class="silence" aria-labelledby="silence-title-${state}" data-js="silence" data-seconds="${sm.seconds}"${running ? ' data-testid="silence-timer" tabindex="-1"' : ''}>
  <h2 class="silence__title" id="silence-title-${state}">${esc(t('silence.title'))}</h2>
  <p class="silence__text" data-js="silence-prompt"${ended ? ' hidden' : ''}>${esc(sm.prompt)}</p>
  <p class="silence__text" data-js="silence-ended" tabindex="-1"${ended ? '' : ' hidden'}>${esc(t('silence.ended'))}</p>
  <button type="button" class="btn btn--primary" data-testid="silence-start" data-js="silence-start"${idle ? '' : ' hidden'}>${icon('VolumeX')}<span class="btn__label">${startLabel}</span></button>
  <button type="button" class="btn btn--secondary" data-js="silence-stop"${running ? '' : ' hidden'}>${icon('VolumeX')}<span class="btn__label">${esc(t('silence.stop'))}</span></button>
  <p class="sr-only" role="status" aria-live="polite" data-js="silence-status"></p>
</section>`;
}

function navLinks(location) {
  if (location && location.verified === true) {
    // Not reached by any mocked station (no location is verified yet); kept for completeness.
    return `<div role="group" aria-labelledby="nav-label"><p class="navlinks__label" id="nav-label">${esc(t('station.navigate'))}</p><div class="navlinks__row">${btn({ label: esc(t('station.navigateGoogle')), iconName: 'Navigation', testid: 'nav-google' })}${btn({ label: esc(t('station.navigateWaze')), iconName: 'Navigation', testid: 'nav-waze' })}</div></div>`;
  }
  return `<p class="unverified" data-testid="location-unverified">${esc(t('station.locationUnverified'))}</p>`;
}

function markVisited(pressed) {
  return `<div class="visit"><button type="button" class="btn btn--secondary" data-testid="mark-visited" aria-pressed="${pressed}" data-js="visit" data-on="${esc(t('station.unmarkVisited'))}" data-off="${esc(t('station.markVisited'))}">${icon('Check')}<span class="btn__label">${esc(pressed ? t('station.unmarkVisited') : t('station.markVisited'))}</span></button></div>`;
}

function driveBanner() {
  return `<div class="drive" role="note" data-testid="driver-warning">${icon('Car')}<p>${esc(t('drive.warning'))}</p></div>`;
}

function gate(personId, contentHtml, state = 'closed', key = 'g') {
  const titleId = `gate-title-${key}`;
  const closed = state === 'closed';
  return `<div data-js="gate" data-person="${personId}">
  <section class="gate${closed ? '' : ' gate--skipped'}" aria-labelledby="${titleId}" data-testid="warning-gate" data-js="gate-panel">
    <p class="gate__title" id="${titleId}"${closed ? '' : ' hidden'} data-js="gate-closed-only">${icon('TriangleAlert')}<span>${esc(t('warning.title'))}</span></p>
    <p class="gate__body" data-js="gate-body"${closed ? '' : ' hidden'}>${esc(t('warning.body'))}</p>
    <p class="gate__body" data-js="gate-skipped"${closed ? ' hidden' : ''}>${esc(t('warning.skipped'))}</p>
    <div class="gate__actions">
      ${btn({ label: esc(t('warning.show')), testid: 'warning-show', extra: ' data-js="gate-show"' })}
      ${closed ? btn({ label: esc(t('warning.skip')), testid: 'warning-skip', extra: ' data-js="gate-skip"' }) : ''}
    </div>
  </section>
  <span tabindex="-1" data-js="gate-after"></span>
  <template data-js="gate-content">${contentHtml}</template>
</div>`;
}

function nearby(state, opts = {}) {
  const busy = state === 'locating';
  let status = '';
  let link = '';
  if (state === 'locating') status = esc(t('nearby.locating'));
  if (state === 'denied') status = esc(t('nearby.denied'));
  if (state === 'unavailable') status = esc(t('nearby.unavailable'));
  if (state === 'none') status = esc(t('nearby.none'));
  if (state === 'at' || state === 'near') {
    const s = station(opts.stationId);
    const ph = t(state === 'at' ? 'nearby.at' : 'nearby.near', {
      title: '\u0000',
      distance: '\u0001',
    });
    status = esc(ph)
      .replace('\u0000', `<bdi><strong>${esc(s.title)}</strong></bdi>`)
      .replace('\u0001', bdi(formatDistance(opts.distanceM ?? 0)));
    link = `<div class="nearby__link">${btn({ variant: state === 'at' ? 'primary' : 'secondary', label: esc(t('nearby.open')), hrefPath: `/station/${s.slug}` })}</div>`;
  }
  return `<div class="nearby">
  <button type="button" class="btn btn--secondary btn--where" data-testid="where-am-i"${opts.id ? ` id="${opts.id}"` : ''}${busy ? ' aria-busy="true"' : ''}>${icon('LocateFixed')}<span class="btn__label">${esc(t('nearby.button'))}</span></button>
  <p class="nearby__privacy">${esc(t('nearby.privacy'))}</p>
  <div class="nearby__status" role="status" aria-live="polite" data-testid="nearby-banner">${status}</div>
  ${link}
</div>`;
}

function photoFrame() {
  return `<div class="photo"><div class="photo__box" data-testid="photo-placeholder">${esc(t('photo.pending'))}</div></div>`;
}

function quote(q) {
  return `<figure class="quote"><p class="quote__label">${esc(t('person.quote'))}</p><blockquote>${esc(`„${q.text}”`)}</blockquote><figcaption>${esc(`— ${q.by}`)}</figcaption></figure>`;
}

// Route map: design/route-map.svg inlined, raw hex replaced by token variables (geometry untouched).
const HEX_TO_TOKEN = {
  '#FAF8F4': '--color-bg',
  '#FFFFFF': '--color-surface',
  '#1F3864': '--color-primary',
  '#1B1B1F': '--color-ink',
  '#595959': '--color-ink-muted',
};
function routeMap(ctx) {
  let svg = readFileSync(join(root, 'design/route-map.svg'), 'utf8').trim();
  svg = svg.replace(/<(\w+)([^<>]*?)(\/?)>/g, (m, tag, attrs, selfClose) => {
    const styles = [];
    attrs = attrs.replace(/\s(fill|stroke)="(#[0-9A-Fa-f]{6})"/g, (mm, prop, hex) => {
      const tok = HEX_TO_TOKEN[hex.toUpperCase()];
      if (!tok) throw new Error(`unmapped map colour ${hex}`);
      styles.push(`${prop}:var(${tok})`);
      return '';
    });
    return `<${tag}${attrs}${styles.length ? ` style="${styles.join(';')}"` : ''}${selfClose}>`;
  });
  // Marker states per design/route-map.md (stroke / fill only on the circle and the number).
  for (const s of stations) {
    const re = new RegExp(
      `(<g id="marker-${s.id}">)<circle([^>]*?) style="[^"]*"/><text([^>]*?) style="[^"]*">`,
    );
    if (ctx.currentStation === s.id) {
      svg = svg.replace(
        re,
        (m, g, c, tx) =>
          `${g}<circle${c.replace('stroke-width="3"', 'stroke-width="5"')} style="fill:var(--color-primary);stroke:var(--color-primary)"/><text${tx} style="fill:var(--color-primary-ink)">`,
      );
    } else if (ctx.visited.includes(s.id)) {
      svg = svg.replace(
        re,
        `$1<circle$2 style="fill:var(--color-gold-soft);stroke:var(--color-gold)"/><text$3 style="fill:var(--color-gold)">`,
      );
    }
  }
  svg = svg
    .replace(
      / width="360" height="640"/,
      ' width="360" height="640" data-testid="route-map" style="direction:ltr"',
    )
    .replace(
      /role="img" aria-labelledby="rm-t rm-d"/,
      `role="img" aria-label="${esc(t('tour.mapAlt'))}"`,
    )
    .replace(/<title id="rm-t">[^<]*<\/title>\s*<desc id="rm-d">[^<]*<\/desc>\s*/, '');
  return `<figure class="map" aria-labelledby="map-title">${svg}<figcaption aria-hidden="true">${esc(t('tour.mapAlt'))}</figcaption></figure>`;
}

function stationCard(s, ctx) {
  const vis = ctx.visited.includes(s.id);
  const cur = ctx.currentStation === s.id;
  return `<li><a class="card${cur ? ' card--current' : ''}" href="${href(`/station/${s.slug}`)}" data-testid="station-card-${s.id}"${cur ? ' aria-current="step"' : ''}>
  <span class="card__marker" aria-hidden="true"><bdi>${s.order}</bdi></span>
  <span>
    <span class="sr-only">${esc(t('tour.stationOf', { n: s.order, total }))}</span>
    <span class="card__title">${esc(s.title)}</span>
    <span class="card__sub">${esc(s.subtitle)}</span>
    <span class="card__meta">${durationBadge(s.durationMin)}<span aria-hidden="true">·</span><span>${esc(t(s.kind === 'drive' ? 'tour.kind.drive' : 'tour.kind.stop'))}</span></span>
    ${vis ? `<span class="card__visited">${icon('Check', 'sm')}<span>${esc(t('tour.visited'))}</span></span>` : ''}
  </span>
</a></li>`;
}

// ---------- tiny inline script (toggles only; nothing runs by itself) ----------
const SCRIPT = `<script>
(function () {
  var root = document.documentElement;
  function measure() {
    var bn = document.querySelector('.bottomnav');
    var sb = document.querySelector('.stickybar');
    if (bn) root.style.setProperty('--bottomnav-size', bn.offsetHeight + 'px');
    if (sb) root.style.setProperty('--stickybar-size', sb.offsetHeight + 'px');
  }
  measure();
  window.addEventListener('resize', measure);
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-js]');
    if (!el) return;
    var js = el.getAttribute('data-js');
    if (js === 'read-aloud') {
      var on = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', String(on));
      if (on) root.setAttribute('data-read-aloud', 'true'); else root.removeAttribute('data-read-aloud');
      var st = el.parentNode.querySelector('[data-js="read-aloud-status"]');
      if (st) st.textContent = on ? ${JSON.stringify(t('readAloud.on'))} : ${JSON.stringify(t('readAloud.off'))};
      measure();
    }
    if (js === 'visit') {
      var p = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', String(p));
      el.querySelector('.btn__label').textContent = el.getAttribute(p ? 'data-on' : 'data-off');
    }
    if (js === 'gate-show') {
      document.querySelectorAll('[data-js="gate"]').forEach(function (g) {
        var tpl = g.querySelector('[data-js="gate-content"]');
        var wrap = document.createElement('div');
        wrap.setAttribute('tabindex', '-1');
        wrap.className = 'fade-in';
        wrap.appendChild(tpl.content.cloneNode(true));
        g.replaceWith(wrap);
        if (g.contains(el)) wrap.focus();
      });
    }
    if (js === 'gate-skip') {
      var g = el.closest('[data-js="gate"]');
      var panel = g.querySelector('[data-js="gate-panel"]');
      panel.classList.add('gate--skipped');
      g.querySelector('[data-js="gate-closed-only"]').hidden = true;
      g.querySelector('[data-js="gate-body"]').hidden = true;
      g.querySelector('[data-js="gate-skipped"]').hidden = false;
      el.remove();
      g.querySelector('[data-js="gate-after"]').focus();
    }
    if (js === 'silence-start' || js === 'silence-stop') {
      var s = el.closest('[data-js="silence"]');
      var status = s.querySelector('[data-js="silence-status"]');
      function end() {
        clearTimeout(s._timer);
        s.querySelector('[data-js="silence-prompt"]').hidden = true;
        s.querySelector('[data-js="silence-stop"]').hidden = true;
        s.querySelector('[data-js="silence-start"]').hidden = true;
        var ended = s.querySelector('[data-js="silence-ended"]');
        ended.hidden = false;
        s.removeAttribute('data-testid');
        status.textContent = ${JSON.stringify(t('silence.ended'))};
        ended.focus();
      }
      if (js === 'silence-start') {
        s.style.minBlockSize = s.offsetHeight + 'px';
        el.hidden = true;
        s.querySelector('[data-js="silence-stop"]').hidden = false;
        s.setAttribute('data-testid', 'silence-timer');
        s.setAttribute('tabindex', '-1');
        s.focus();
        status.textContent = ${JSON.stringify(t('silence.title'))};
        s._timer = setTimeout(end, Number(s.getAttribute('data-seconds')) * 1000);
      } else { end(); }
    }
    if (el.getAttribute('role') === 'tab') {
      var list = el.closest('[role="tablist"]');
      list.querySelectorAll('[role="tab"]').forEach(function (tab) {
        var sel = tab === el;
        tab.setAttribute('aria-selected', String(sel));
        tab.setAttribute('tabindex', sel ? '0' : '-1');
      });
      document.querySelectorAll('[data-depth-panel]').forEach(function (p) {
        p.hidden = p.getAttribute('data-depth-panel') !== el.getAttribute('data-depth');
      });
      var panel = document.getElementById('depth-panel');
      if (panel) panel.setAttribute('aria-labelledby', el.id);
    }
  });
  document.addEventListener('keydown', function (e) {
    var el = e.target;
    if (!el || el.getAttribute('role') !== 'tab') return;
    var tabs = Array.prototype.slice.call(el.closest('[role="tablist"]').querySelectorAll('[role="tab"]'));
    var i = tabs.indexOf(el), j = i;
    if (e.key === 'ArrowLeft') j = Math.min(i + 1, tabs.length - 1);
    if (e.key === 'ArrowRight') j = Math.max(i - 1, 0);
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = tabs.length - 1;
    if (j !== i) { e.preventDefault(); tabs[j].focus(); tabs[j].click(); }
  });
})();
</script>`;

// ---------- page shell ----------
function page({ file, title, nav = null, ctx, main, stickyStation = null, banners = '' }) {
  const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title + t('app.titleSuffix'))}</title>
<!-- D-04 mockup, generated by design/mockups/_build/build.mjs from src/content/data and src/i18n/he.ts. Do not edit by hand. -->
<link rel="stylesheet" href="../tokens.css">
<style>
${css}
</style>
</head>
<body${stickyStation ? ' class="has-stickybar"' : ''}>
<a class="skip" href="#main" data-testid="skip-link">${esc(t('app.skipToContent'))}</a>
${header(nav)}
<div class="frame">
${sideNav(nav, ctx)}
<div class="col">
<div class="banners">${banners}</div>
<main id="main" tabindex="-1"><div class="reading">
${main}
</div></main>
</div>
</div>
${footer()}
${stickyStation ? `<div class="stickybar">${prevNext(stickyStation, 'sticky')}</div>` : ''}
${bottomNav(nav)}
${SCRIPT}
</body>
</html>
`;
  writeFileSync(join(out, file), html);
  return file;
}

// Sample progress used on the tour and station mockups (same example as F-13's test).
const SAMPLE_VISITED = ['sderot', 'route-232', 'observers-hill'];
const note = (text) => `<p class="mock-note" aria-hidden="true">${text}</p>`;

// ---------- pages ----------
const written = [];

// Home (first visit: no progress)
{
  const [cb, ca] = t('home.stationsCount', { n: '\u0000' }).split('\u0000');
  const main = `
<h1 class="h1">${esc(tour.title)}</h1>
<p class="lead">${esc(tour.subtitle)}</p>
<p class="meta"><span class="meta__item">${icon('Route', 'sm')}${esc(cb)}${bdi(total)}${esc(ca)}</span><span aria-hidden="true">·</span>${'<span class="meta__item">' + icon('Clock', 'sm') + bdi(t('home.totalDuration', { duration: formatMinutes(tour.totalDurationMin) })) + '</span>'}</p>
<div class="intro">${md(tour.intro)}</div>
<div class="head-actions">${btn({ variant: 'primary', label: esc(t('home.start')), hrefPath: `/station/${stations[0].slug}`, testid: 'start-tour', full: true, cls: 'start' })}</div>
${section('h-message', t('home.messageTitle'), md(tour.message))}
${section('h-safety', t('home.safetyTitle'), list(tour.safety))}
${section('h-howto', t('home.howToTitle'), list(tour.howTo))}`;
  written.push(
    page({
      file: 'home.html',
      title: tour.title,
      nav: 'home',
      ctx: { visited: [], currentStation: null },
      main,
    }),
  );
}

// Tour overview (sample progress: 3 visited, next = reim-shelter)
{
  const ctx = { visited: SAMPLE_VISITED, currentStation: 'reim-shelter' };
  const [cb, ca] = t('home.stationsCount', { n: '\u0000' }).split('\u0000');
  const main = `
<h1 class="h1">${esc(t('tour.title'))}</h1>
<p class="meta"><span class="meta__item">${icon('Route', 'sm')}${esc(cb)}${bdi(total)}${esc(ca)}</span><span aria-hidden="true">·</span><span class="meta__item">${icon('Clock', 'sm')}${bdi(t('home.totalDuration', { duration: formatMinutes(tour.totalDurationMin) }))}</span></p>
<div class="sec">${nearby('idle', { id: 'where-am-i' })}</div>
<section class="sec" aria-labelledby="map-title">${sectionHeading('map-title', t('tour.mapTitle'), 'Route')}${routeMap(ctx)}</section>
<div class="sec"><ol class="cards">${stations.map((s) => stationCard(s, ctx)).join('')}</ol></div>`;
  written.push(page({ file: 'tour.html', title: t('tour.title'), nav: 'tour', ctx, main }));
}

// Station pages
function stationPage(file, id) {
  const s = station(id);
  const ctx = {
    visited: stations.filter((x) => x.order < s.order).map((x) => x.id),
    currentStation: s.id,
  };
  const primary = s.personIds.map(person);
  const companions = s.companionPersonIds.map(person);
  const main = `
<p class="eyebrow-muted">${esc(t('tour.stationOf', { n: '\u0000', total: '\u0001' }))
    .replace('\u0000', bdi(s.order))
    .replace('\u0001', bdi(total))}</p>
<h1 class="h1">${esc(s.title)}</h1>
<p class="subtitle">${esc(s.subtitle)}</p>
<p class="meta">${durationBadge(s.durationMin)}<span aria-hidden="true">·</span><span>${esc(t(s.kind === 'drive' ? 'tour.kind.drive' : 'tour.kind.stop'))}</span></p>
<div class="head-actions">${shareButton()}</div>
${s.driverWarning ? driveBanner() : ''}
${section('s-bg', t('station.background'), md(s.background))}
${section('s-tp', t('station.talkingPoints'), list(s.talkingPoints))}
${primary.length ? section('s-people', t('station.people'), `<div class="people">${primary.map((p) => personCard(p, 'primary')).join('')}</div>`) : ''}
${companions.length ? section('s-comp', t('station.companions'), `<div class="people">${companions.map((p) => personCard(p, 'companion')).join('')}</div>`) : ''}
${s.silenceMoment ? silence(s) : ''}
${section('s-access', t('station.access'), md(s.accessNotes) + (s.lastVerified ? `<p class="subtitle">${esc(t('station.lastVerified', { date: s.lastVerified }))}</p>` : '') + navLinks(s.location))}
${markVisited(false)}
${s.sources.length ? section('s-src', t('station.sources'), sourceList(s.sources), 'BookOpen') : ''}
${prevNext(s, 'inline')}`;
  written.push(page({ file, title: s.title, ctx, main, stickyStation: s }));
}
stationPage('station-stop.html', 'reim-shelter');
stationPage('station-drive.html', 'route-232');

// Person pages: all three depth panels are in the file; the file's depth is selected.
function personPage(file, id, depth) {
  const p = person(id);
  const firstStation = station(p.stationIds[0]);
  const ctx = { visited: SAMPLE_VISITED, currentStation: null };
  const graphic = p.oct7Sensitivity === 'graphic';
  const wrap = (html, key) => (graphic ? gate(p.id, html, 'closed', key) : html);
  const tabs = [
    ['s30', 'depth.s30'],
    ['m2', 'depth.m2'],
    ['m5', 'depth.m5'],
  ]
    .map(
      ([k, label]) =>
        `<button type="button" role="tab" class="tab" id="depth-tab-${k}" aria-selected="${k === depth}" aria-controls="depth-panel" tabindex="${k === depth ? 0 : -1}" data-depth="${k}">${esc(t(label))}</button>`,
    )
    .join('');
  const oct7Section = (key) => section(`p-oct7-${key}`, t('person.oct7'), wrap(md(p.oct7), key));
  const s30 = `<p class="read-hint">${icon('Volume2', 'sm')}${esc(t('depth.s30.hint'))}</p>${wrap(mdRead(p.guideLevels.s30), 's30')}`;
  const m2 = `${md(p.opening)}${oct7Section('m2')}${quote(p.quote)}`;
  const m5 = `${md(p.opening)}${oct7Section('m5')}
${section('p-pers', t(p.pronoun === 'she' ? 'person.personality.she' : 'person.personality.he'), md(p.personality))}
${section('p-past', t('person.past'), md(p.past))}
${p.after ? section('p-after', t('person.after'), md(p.after)) : ''}
${quote(p.quote)}${p.altQuote ? quote(p.altQuote) : ''}
${p.guideNote ? section('p-note', t('person.guideNote'), md(p.guideNote)) : ''}
<div class="story-end"><img src="../brand/mark.svg" alt="" width="24" height="24"></div>
${section('p-src', t('person.sources'), sourceList(p.sources), 'BookOpen')}`;
  const panels = { s30, m2, m5 };
  const main = `
${btn({ variant: 'quiet', label: esc(t('person.backToStation', { title: firstStation.title })), hrefPath: `/station/${firstStation.slug}`, cls: 'back' })}
<h1 class="h1 h1--person">${esc(fullName(p))}</h1>
<p class="subtitle">${esc(p.subtitle)}</p>
${photoFrame()}
${shareButton()}
<div class="depth">
  <p class="depth__label" id="depth-label">${esc(t('depth.label'))}</p>
  <div role="tablist" class="tabs" aria-label="${esc(t('depth.label'))}" data-testid="depth-tabs">${tabs}</div>
</div>
<div role="tabpanel" id="depth-panel" class="panel" aria-labelledby="depth-tab-${depth}" tabindex="0">
${Object.entries(panels)
  .map(([k, html]) => `<div data-depth-panel="${k}"${k === depth ? '' : ' hidden'}>${html}</div>`)
  .join('\n')}
</div>`;
  written.push(page({ file, title: p.name, ctx, main }));
}
personPage('person-s30.html', 'roni-eshel', 's30');
personPage('person-m2.html', 'aner-shapira', 'm2');
personPage('person-m5.html', 'roni-eshel', 'm5');

// About
{
  const [lb, la] = t('about.lastReview', { date: '\u0000' }).split('\u0000');
  const main = `
<h1 class="h1">${esc(t('about.title'))}</h1>
<div class="sec">${md(tour.about)}</div>
${section('a-rights', t('about.rights'), md(tour.rights))}
<p class="sec subtitle">${esc(lb)}${bdi(tour.lastContentReview)}${esc(la)}</p>
${tour.contactEmail ? `<p>${esc(t('about.contact', { email: tour.contactEmail }))}</p>` : ''}`;
  written.push(
    page({
      file: 'about.html',
      title: t('about.title'),
      nav: 'about',
      ctx: { visited: [], currentStation: null },
      main,
    }),
  );
}

// Sources
{
  const byPerson = people
    .map((p) => `<h3 class="h3">${esc(fullName(p))}</h3>${sourceList(p.sources)}`)
    .join('');
  const byStation = stations
    .filter((s) => s.sources.length)
    .map((s) => `<h3 class="h3">${esc(s.title)}</h3>${sourceList(s.sources)}`)
    .join('');
  const main = `
<h1 class="h1">${esc(t('sources.title'))}</h1>
<p class="lead">${esc(t('sources.intro'))}</p>
${section('src-person', t('sources.byPerson'), byPerson)}
${section('src-station', t('sources.byStation'), byStation)}`;
  written.push(
    page({
      file: 'sources.html',
      title: t('sources.title'),
      ctx: { visited: [], currentStation: null },
      main,
    }),
  );
}

// Not found
{
  const main = `
<h1 class="h1">${esc(t('notFound.title'))}</h1>
<p class="lead">${esc(t('notFound.body'))}</p>
<div class="head-actions">${btn({ variant: 'primary', label: esc(t('notFound.home')), hrefPath: '/' })}</div>`;
  written.push(
    page({
      file: 'not-found.html',
      title: t('notFound.title'),
      ctx: { visited: [], currentStation: null },
      main,
    }),
  );
}

// States gallery
{
  const reim = station('reim-shelter');
  const r232 = station('route-232');
  const last = stations[stations.length - 1];
  const aner = person('aner-shapira');
  const group = (id, title, body) =>
    `<section class="mock-group" aria-labelledby="${id}"><h2 class="h2" id="${id}">${esc(title)}</h2>${body}</section>`;
  const offlineBanner = `<div class="banner" role="status" data-testid="offline-indicator"><span class="banner__msg">${icon('WifiOff', 'sm')}<span>${esc(t('offline.now'))}</span></span></div>`;
  const readyBanner = `<div class="banner" role="status"><span class="banner__msg"><span>${esc(t('offline.ready'))}</span></span>${btn({ variant: 'quiet', label: esc(t('common.close')) })}</div>`;
  const updateBanner = `<div class="banner banner--update" data-testid="update-prompt"><p role="status">${esc(t('update.available'))}</p><div class="banner__actions">${btn({ label: esc(t('update.reload')), iconName: 'RefreshCw' })}${btn({ variant: 'quiet', label: esc(t('common.close')) })}</div></div>`;
  const nearbyStates = [
    ['idle', {}],
    ['locating', {}],
    ['denied', {}],
    ['unavailable', {}],
    ['at', { stationId: 'sderot', distanceM: 120 }],
    ['near', { stationId: 'observers-hill', distanceM: 1234 }],
    ['none', {}],
  ]
    .map(
      ([st, o]) =>
        `${note(`NearbyBanner · <bdi>${st}</bdi>${st === 'at' || st === 'near' ? ' · דוגמה בלבד: אף מיקום עדיין לא אומת, ולכן מצב זה לא יופיע לפני האימות; המרחק הוא ערך לדוגמה' : ''}`)}${nearby(st, o)}`,
    )
    .join('');
  const [rb, ra] = t('home.resume', { n: '\u0000' }).split('\u0000');
  const resume = `<div class="head-actions">${btn({ variant: 'primary', label: `${esc(rb)}${bdi(4)}${esc(ra)}`, hrefPath: '/station/reim-shelter', testid: 'resume-tour', full: true })}${btn({ variant: 'quiet', label: esc(t('home.resetProgress')), testid: 'reset-progress' })}</div>`;
  const main = `
<h1 class="h1">מצבים</h1>
${note('דף מוקאפ בלבד, לא דף באתר. כל מסגרת מקווקוות היא הערה למעצב ולא חלק מהממשק.')}
${group('st-banners', 'OfflineIndicator · UpdatePrompt', `${note('אין חיבור (<bdi>offline</bdi>) · נשאר כל עוד אין חיבור, בלי כפתור סגירה')}${offlineBanner}${note('הסיור נשמר (<bdi>ready</bdi>) · פעם אחת בכל ביקור')}${readyBanner}${note('גרסה חדשה (<bdi>UpdatePrompt</bdi>) · אף פעם לא נטען מחדש לבד')}${updateBanner}`)}
${group('st-nearby', 'NearbyBanner · 7 מצבים', nearbyStates)}
${group('st-silence', 'SilenceMoment', `${note('<bdi>running</bdi> · אין ספירה לאחור ואין שום שינוי על המסך עד הסוף (החלטת שוקי)')}${silence(reim, 'running')}${note('<bdi>ended</bdi>')}${silence(reim, 'ended')}`)}
${group('st-gate', 'ContentWarningGate', `${note('<bdi>skipped</bdi> · מצב סגור מוצג ב-<bdi>person-m2.html</bdi>')}${gate(aner.id, md(aner.oct7), 'skipped', 'st')}`)}
${group('st-read', 'מצב הקראה', `${note('מצב הקראה פעיל (<bdi>data-read-aloud</bdi>) · אותו טקסט בדיוק, גדול יותר ועם רווח שורות גדול יותר; כאן מוצג על קטע נסיעה. בכל דף אפשר להפעיל אותו בכפתור שבכותרת.')}<div class="ra-demo">${btn({ label: esc(t('readAloud.label')), iconName: 'Volume2', pressed: true, cls: 'toggle' })}${driveBanner()}${section('st-ra-bg', t('station.background'), md(r232.background))}<div class="pn pn--demo">${prevNext(r232, 'sticky').replace(/^<div class="pn">|<\/div>$/g, '')}</div></div>`)}
${group('st-more', 'מצבים נוספים', `${note('דף הבית עם התקדמות (<bdi>resume-tour</bdi>, <bdi>reset-progress</bdi>) · לפי הדוגמה של <bdi>F-13</bdi>: ביקרתם בתחנות 1–3')}${resume}${note('סימון ביקור לחוץ (<bdi>mark-visited</bdi>, <bdi>aria-pressed=true</bdi>)')}${markVisited(true)}${note('שיתוף אחרי העתקת הקישור')}${shareButton(esc(t('share.copied')))}${note('התחנה האחרונה: במקום "לתחנה הבאה" מופיע "סוף המסלול", ובדף מוצג טקסט הסיום של הסיור')}${md(tour.closing)}<div class="pn pn--demo">${prevNext(last, 'sticky').replace(/^<div class="pn">|<\/div>$/g, '')}</div>`)}`;
  written.push(
    page({
      file: 'states.html',
      title: 'מצבים',
      ctx: { visited: SAMPLE_VISITED, currentStation: null },
      main,
      banners: offlineBanner,
    }),
  );
}

process.stdout.write(`${written.join('\n')}\n`);
