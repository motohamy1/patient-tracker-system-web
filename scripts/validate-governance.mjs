#!/usr/bin/env node
/**
 * validate-governance.mjs — zero-dependency Nyquist validation suite for Phase 01.
 *
 * Validates the frozen governance corpus under docs/governance/ against the
 * acceptance criteria of .planning/phases/01-project-constitution-reference-ui-specification/01-0{1..6}-PLAN.md
 * and the evidence recorded in 01-VERIFICATION.md. It does NOT implement the Phase-002
 * machine checks (no-raw-hex / no-generic-healthcare-blue / token-reference-required);
 * it validates the governance corpus itself.
 *
 * Usage:
 *   node scripts/validate-governance.mjs                 # human table
 *   node scripts/validate-governance.mjs --json          # machine-readable array
 *   node scripts/validate-governance.mjs --check <id>    # run one check
 *   node scripts/validate-governance.mjs --list          # list check ids
 *
 * Exit code: 0 iff every selected check passes, non-zero otherwise.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.join(ROOT, p);
const readText = (p) => readFileSync(rel(p), 'utf8');
const readJson = (p) => JSON.parse(readText(p));

// ---------------------------------------------------------------------------
// constants derived from the PLAN files / governance artifacts
// ---------------------------------------------------------------------------
const COLOR_ORDER = [
  'frame', 'frameForeground', 'canvas', 'surface', 'surfaceMuted', 'surfaceRaised',
  'textPrimary', 'textSecondary', 'borderSubtle', 'accent', 'accentSoft',
  'success', 'warning', 'critical', 'info',
];
const BASE_COLOR = COLOR_ORDER.filter((k) => k !== 'accentSoft');
const RADIUS = { sm: '8px', md: '12px', lg: '16px', xl: '24px', pill: '999px' };
const SPACE = { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '32px' };
const FONT = {
  size: { label: '12px', body: '14px', heading: '16px', display: '28px' },
  weight: { regular: '400', semibold: '600' },
  lineHeight: { tight: '1.1', heading: '1.25', body: '1.5', label: '1.4' },
};
const MOTION = {
  duration: { fast: '120ms', slow: '240ms' },
  easing: { standard: 'cubic-bezier(0.2, 0, 0, 1)', exit: 'cubic-bezier(0.4, 0, 1, 1)' },
};
const GOVERNANCE_FILES = [
  'project-constitution.md', 'reference-ui-specification.md', 'ui-invariants.md',
  'visual-qa-rules.md', 'responsive-rules.md', 'motion-rules.md',
  'tokens.json', 'reference-manifest.json',
];
const QA_NAMES = [
  'Outer structure', 'Color relationships', 'Spacing rhythm', 'Compactness',
  'Card proportions', 'Pill controls', 'Typography hierarchy', 'Timeline proportions',
  'Node/branch behavior', 'Bottom scrubber', 'Visual density', 'Accent restraint',
];
const CONSTITUTION_KEYWORDS = [
  'blue/indigo/purple', 'saturated multi-color', 'points', 'streaks', 'fireworks',
  'Cardiology', 'static chart', 'D3', 'glassmorphism', 'neumorphism', 'outlined-card',
  'dark frame', '3D', 'gradients', 'build passes',
];
const HIERARCHY_MARKERS = [
  'project-constitution.md', 'docs/reference/', 'reference-ui-specification.md',
  'ui-invariants.md', 'feature specification', 'technical plan', 'tasks/checklist',
  'existing repository', 'Agent preference',
];
// Built from fragments so this validator's own source does not contain the literal
// token it scans for (otherwise the repository-wide scan would flag itself).
const STALE = ['diagnostic-current-implementation', '.png'].join('');
const STALE_LABEL = ['diagnostic-current-implementation', '.png'].join('');
const DASHBOARD = 'patient-tracking-dashboard.jpg';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function deepEqualKeys(obj, expected) {
  return obj && typeof obj === 'object' && JSON.stringify(Object.keys(obj)) === JSON.stringify(expected);
}
function sameMap(obj, expected) {
  if (!deepEqualKeys(obj, Object.keys(expected))) return false;
  return Object.keys(expected).every((k) => obj[k] === expected[k]);
}
function walk(dir, acc = []) {
  const abs = rel(dir);
  if (!existsSync(abs)) return acc;
  for (const name of readdirSync(abs)) {
    const childAbs = path.join(abs, name);
    const relChild = path.join(dir, name).replace(/\\/g, '/');
    if (statSync(childAbs).isDirectory()) walk(relChild, acc);
    else acc.push(relChild);
  }
  return acc;
}
function hexMatches(text) {
  return text.match(/#[0-9A-Fa-f]{6}/g) || [];
}
function slugify(heading) {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s/g, '-');
}
function headingSlugs(mdText) {
  const set = new Set();
  for (const line of mdText.split(/\r?\n/)) {
    const m = /^#{1,6}\s+(.*?)\s*$/.exec(line);
    if (m) set.add(slugify(m[1]));
  }
  return set;
}
function certutilSha256(relPath) {
  const out = execFileSync('certutil', ['-hashfile', rel(relPath), 'SHA256'], { encoding: 'utf8' });
  const digest = out.split(/\r?\n/).map((l) => l.trim()).find((l) => /^[0-9a-fA-F]{64}$/.test(l));
  return digest ? digest.toLowerCase() : null;
}
function section(mdText, startHeading, endHeading) {
  const start = mdText.indexOf(startHeading);
  if (start < 0) return '';
  const end = endHeading ? mdText.indexOf(endHeading, start + startHeading.length) : -1;
  return end < 0 ? mdText.slice(start) : mdText.slice(start, end);
}

// ---------------------------------------------------------------------------
// checks
// ---------------------------------------------------------------------------
const checks = [
  {
    id: 'GOV-04a',
    requirement: 'GOV-04',
    description: 'tokens.json parses; color has the 15 documented keys in order (accentSoft after accent); hex regex; name/version/mode and all scale key-sets/values exact',
    run() {
      const t = readJson('docs/governance/tokens.json');
      const errs = [];
      if (JSON.stringify(Object.keys(t.color)) !== JSON.stringify(COLOR_ORDER)) {
        errs.push(`color order ${JSON.stringify(Object.keys(t.color))}`);
      }
      const bad = Object.entries(t.color).filter(([, v]) => !/^#[0-9A-Fa-f]{6}$/.test(v)).map(([k]) => k);
      if (bad.length) errs.push(`bad hex: ${bad.join(',')}`);
      if (t.name !== 'patient-clinical-workspace-tokens') errs.push(`name=${t.name}`);
      if (t.version !== 1) errs.push(`version=${t.version}`);
      if (t.mode !== 'light') errs.push(`mode=${t.mode}`);
      if (!sameMap(t.radius, RADIUS)) errs.push('radius mismatch');
      if (!sameMap(t.space, SPACE)) errs.push('space mismatch');
      if (!sameMap(t.font.size, FONT.size)) errs.push('font.size mismatch');
      if (!sameMap(t.font.weight, FONT.weight)) errs.push('font.weight mismatch');
      if (!sameMap(t.font.lineHeight, FONT.lineHeight)) errs.push('font.lineHeight mismatch');
      if (!sameMap(t.motion.duration, MOTION.duration)) errs.push('motion.duration mismatch');
      if (!sameMap(t.motion.easing, MOTION.easing)) errs.push('motion.easing mismatch');
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : '15 color keys in order, hex valid, all scales exact' };
    },
  },
  {
    id: 'GOV-04b',
    requirement: 'GOV-04',
    description: 'exactly two shadows (raised, overlay) and both rgba inks derive from the decimal channels of textPrimary',
    run() {
      const t = readJson('docs/governance/tokens.json');
      const errs = [];
      if (!deepEqualKeys(t.shadow, ['raised', 'overlay'])) errs.push(`shadow keys ${JSON.stringify(Object.keys(t.shadow))}`);
      const h = t.color.textPrimary;
      const want = `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},`;
      for (const k of ['raised', 'overlay']) {
        if (typeof t.shadow[k] !== 'string' || !t.shadow[k].includes(want)) errs.push(`${k} missing ${want}`);
      }
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : `both shadows derive ink ${want}…) from textPrimary ${h}` };
    },
  },
  {
    id: 'GOV-04c',
    requirement: 'GOV-04',
    description: 'raw-hex confinement: #[0-9A-Fa-f]{6} matches only in tokens.json (>=14 there, 0 elsewhere in docs/governance)',
    run() {
      const files = walk('docs/governance');
      const offenders = [];
      let tokenHits = 0;
      for (const f of files) {
        const n = hexMatches(readText(f)).length;
        if (f === 'docs/governance/tokens.json') tokenHits = n;
        else if (n > 0) offenders.push(`${f}:${n}`);
      }
      const ok = offenders.length === 0 && tokenHits >= 14;
      return { ok, detail: ok ? `${tokenHits} hits in tokens.json, 0 in the other ${files.length - 1} files` : `tokens.json=${tokenHits}; offenders=[${offenders.join(', ')}]` };
    },
  },
  {
    id: 'GOV-04d',
    requirement: 'GOV-04',
    description: 'provenance/review normative:false; one provenance entry per sampled token with windowCount>=5 and every maxDelta<=2; weak tokens; gateStatus; accentSoft iff ownerConfirmed && hue>=8',
    run() {
      const t = readJson('docs/governance/tokens.json');
      const errs = [];
      if (t.provenance?.normative !== false) errs.push('provenance.normative!==false');
      if (t.review?.normative !== false) errs.push('review.normative!==false');
      const prov = t.provenance?.tokens;
      if (!Array.isArray(prov)) errs.push('provenance.tokens missing');
      else {
        const names = prov.map((e) => e.token);
        if (new Set(names).size !== BASE_COLOR.length) errs.push(`provenance token count ${new Set(names).size}`);
        for (const k of BASE_COLOR) if (!names.includes(k)) errs.push(`no provenance for ${k}`);
        prov.forEach((e, i) => {
          if (!(e.windowCount >= 5)) errs.push(`[${i}] windowCount=${e.windowCount}`);
          if (!Array.isArray(e.windows) || e.windows.length < 5) errs.push(`[${i}] windows=${e.windows?.length}`);
          else e.windows.forEach((w, j) => { if (!(w.maxDelta <= 2)) errs.push(`[${i}.${j}] maxDelta=${w.maxDelta}`); });
        });
      }
      const weak = t.review?.weakEvidenceTokens || [];
      for (const k of ['frameForeground', 'textSecondary', 'warning', 'critical']) {
        if (!weak.includes(k)) errs.push(`weakEvidenceTokens missing ${k}`);
      }
      if (!['approved', 'approved-with-changes'].includes(t.review?.gateStatus)) errs.push(`gateStatus=${t.review?.gateStatus}`);
      const hasSoft = Object.keys(t.color).includes('accentSoft');
      const confirmed = t.review?.accentSplit?.ownerConfirmed === true;
      const hue = t.review?.accentSplit?.measuredHueSeparationDeg;
      const wantSoft = confirmed && typeof hue === 'number' && hue >= 8;
      if (hasSoft !== wantSoft) errs.push(`accentSoft present=${hasSoft} but ownerConfirmed=${confirmed}, hue=${hue}`);
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : `14 provenance entries, gateStatus=${t.review.gateStatus}, hue=${hue}, 4 weak tokens` };
    },
  },
  {
    id: 'GOV-02a',
    requirement: 'GOV-02',
    description: 'manifest has 4 assets (3 binding, 1 diagnostic); diagnostic path is patient-tracking-dashboard.jpg; lowercase 64-hex sha256; certutil recompute agrees',
    run() {
      const m = readJson('docs/governance/reference-manifest.json');
      const a = m.assets || [];
      const errs = [];
      if (a.length !== 4) errs.push(`assets=${a.length}`);
      const roles = a.map((x) => x.role);
      if (roles.filter((r) => r === 'binding').length !== 3) errs.push(`binding=${roles.filter((r) => r === 'binding').length}`);
      if (roles.filter((r) => r === 'diagnostic').length !== 1) errs.push(`diagnostic=${roles.filter((r) => r === 'diagnostic').length}`);
      const diag = a.find((x) => x.role === 'diagnostic');
      if (!diag || diag.path !== 'docs/reference/patient-tracking-dashboard.jpg') errs.push(`diagnostic path=${diag?.path}`);
      for (const x of a) {
        if (!/^[0-9a-f]{64}$/.test(x.sha256 || '')) errs.push(`sha256 format ${x.path}`);
        let got = null;
        try { got = certutilSha256(x.path); } catch (e) { errs.push(`certutil ${x.path}: ${e.message}`); }
        if (got && got !== x.sha256) errs.push(`sha mismatch ${x.path}`);
      }
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : '3 binding + 1 diagnostic; all 4 certutil digests agree' };
    },
  },
  {
    id: 'GOV-02b',
    requirement: 'GOV-02',
    description: 'doNotReuse carries names/labels/medications/vitalsValues/labNames/ids/appointmentRows/dailyStatsNumbers/rule; every governs fragment anchor resolves to a real spec heading slug',
    run() {
      const m = readJson('docs/governance/reference-manifest.json');
      const spec = readText('docs/governance/reference-ui-specification.md');
      const slugs = headingSlugs(spec);
      const errs = [];
      const need = ['names', 'labels', 'medications', 'vitalsValues', 'labNames', 'ids', 'appointmentRows', 'dailyStatsNumbers', 'rule'];
      for (const k of need) if (!(k in (m.doNotReuse || {}))) errs.push(`doNotReuse.${k} missing`);
      const frags = [];
      for (const a of m.assets || []) for (const g of a.governs || []) {
        const i = g.indexOf('#');
        if (i >= 0) frags.push({ src: a.path, frag: g.slice(i + 1) });
      }
      const rule = m.doNotReuse?.rule || '';
      const ri = rule.indexOf('#');
      if (ri >= 0) frags.push({ src: 'doNotReuse.rule', frag: rule.slice(ri + 1) });
      if (!frags.length) errs.push('no fragment anchors found');
      for (const { src, frag } of frags) if (!slugs.has(frag)) errs.push(`${src} -> #${frag} unresolved`);
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : `9 doNotReuse keys; ${frags.length} fragment anchors all resolve` };
    },
  },
  {
    id: 'GOV-02c',
    requirement: 'GOV-02',
    description: `D-12 residual: stale ${STALE_LABEL} absent from authoritative docs (PROJECT/ROADMAP/STATE/PITFALLS/REQUIREMENTS/AGENTS/governance), which cite patient-tracking-dashboard.jpg; confined to the phase-01 records + non-authoritative worktrees`,
    run() {
      const errs = [];
      const authoritative = [
        '.planning/PROJECT.md', '.planning/ROADMAP.md', '.planning/STATE.md',
        '.planning/research/PITFALLS.md', '.planning/REQUIREMENTS.md', 'AGENTS.md',
      ];
      for (const f of authoritative) {
        const txt = readText(f);
        if (txt.includes(STALE)) errs.push(`${f} contains stale string`);
      }
      for (const f of ['.planning/PROJECT.md', '.planning/ROADMAP.md', '.planning/STATE.md', '.planning/research/PITFALLS.md']) {
        if (!readText(f).includes(DASHBOARD)) errs.push(`${f} does not cite ${DASHBOARD}`);
      }
      for (const f of walk('docs/governance')) {
        if (readText(f).includes(STALE)) errs.push(`${f} contains stale string`);
      }
      // outside the phase-01 record directory and non-authoritative .kilo worktrees:
      const allowedPrefixes = [
        '.planning/phases/01-project-constitution-reference-ui-specification/',
        '.kilo/', '.git/',
      ];
      const scan = (dir, acc) => {
        for (const name of readdirSync(rel(dir))) {
          const relP = (dir === '.' ? name : `${dir}/${name}`).replace(/\\/g, '/');
          if (relP === '.git' || relP === '.kilo') continue;
          const abs = rel(relP);
          if (statSync(abs).isDirectory()) scan(relP, acc);
          else acc.push(relP);
        }
        return acc;
      };
      for (const f of scan('.', [])) {
        if (allowedPrefixes.some((p) => f.startsWith(p))) continue;
        let txt;
        try { txt = readText(f); } catch { continue; }
        if (txt.includes(STALE)) errs.push(`${f} contains stale string outside phase records`);
      }
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : 'stale string confined to phase-01 records/worktrees; authoritative docs cite the dashboard asset' };
    },
  },
  {
    id: 'GOV-01',
    requirement: 'GOV-01',
    description: 'constitution contains the 9 hierarchy artifacts in order and the NEVER-higher-authority sentence',
    run() {
      const s = readText('docs/governance/project-constitution.md');
      const errs = [];
      let pos = -1;
      for (const marker of HIERARCHY_MARKERS) {
        const i = s.indexOf(marker, pos + 1);
        if (i < 0) errs.push(`missing/out-of-order: ${marker}`);
        else pos = i;
      }
      if (!s.includes('The existing repository is NEVER a higher authority than the approved design/specification')) {
        errs.push('NEVER clause missing');
      }
      if (!s.includes('### 2.1 The 9-level hierarchy (8 numbered levels, 9 named artifacts)')) errs.push('2.1 heading missing');
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : '9 artifacts in order + NEVER clause' };
    },
  },
  {
    id: 'GOV-06',
    requirement: 'GOV-06',
    description: "constitution's §7 rejection section lists each §27 prohibition keyword",
    run() {
      const s = readText('docs/governance/project-constitution.md');
      const sec = section(s, '## 7.', '## 8.');
      const errs = [];
      if (!sec) errs.push('§7 section not found');
      for (const k of CONSTITUTION_KEYWORDS) if (!sec.includes(k)) errs.push(`missing keyword: ${k}`);
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : `${CONSTITUTION_KEYWORDS.length} §27 keywords present in §7` };
    },
  },
  {
    id: 'GOV-03',
    requirement: 'GOV-03',
    description: 'ui-invariants.md has exactly 17 unique INV-01..INV-17 rows across the three groupings, none skipped or reused',
    run() {
      const s = readText('docs/governance/ui-invariants.md');
      const rows = [...s.matchAll(/^\|\s*(INV-\d{2})\s*\|/gm)].map((m) => m[1]);
      const errs = [];
      if (rows.length !== 17) errs.push(`row count=${rows.length}`);
      const uniq = [...new Set(rows)].sort();
      const expect = Array.from({ length: 17 }, (_, i) => `INV-${String(i + 1).padStart(2, '0')}`);
      if (JSON.stringify(uniq) !== JSON.stringify(expect)) errs.push(`ids=${uniq.join(',')}`);
      const sec2 = section(s, '## 2.', '## 3.');
      const sec3 = section(s, '## 3.', '## 4.');
      const sec4 = section(s, '## 4.', '## 5.');
      const has = (t, id) => new RegExp(`\\|\\s*${id}\\s*\\|`).test(t);
      for (const id of expect.slice(0, 6)) if (!has(sec2, id)) errs.push(`${id} not in visual-character grouping`);
      for (const id of expect.slice(6, 12)) if (!has(sec3, id)) errs.push(`${id} not in geometry grouping`);
      for (const id of expect.slice(12)) if (!has(sec4, id)) errs.push(`${id} not in depth grouping`);
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : '17 unique INV rows: 06/06/05 across the three groupings' };
    },
  },
  {
    id: 'GOV-05a',
    requirement: 'GOV-05',
    description: 'visual-qa-rules.md has exactly 12 QA rows agreeing row-for-row with reference-ui-specification.md §8.1; accentSoft-carries-provider-home-CTA wording consistent across all three files',
    run() {
      const qa = readText('docs/governance/visual-qa-rules.md');
      const spec = readText('docs/governance/reference-ui-specification.md');
      const errs = [];
      const qaRows = [...qa.matchAll(/^\|\s*(\d{1,2})\s*\|\s*([^|]+?)\s*\|/gm)]
        .map((m) => ({ n: Number(m[1]), name: m[2].trim() }));
      const spec81 = section(spec, '### 8.1', '### 8.2');
      const specRows = [...spec81.matchAll(/^\|\s*(\d{1,2})\s*\|\s*([^|]+?)\s*\|/gm)]
        .map((m) => ({ n: Number(m[1]), name: m[2].trim() }));
      if (qaRows.length !== 12) errs.push(`visual-qa rows=${qaRows.length}`);
      if (specRows.length !== 12) errs.push(`spec §8.1 rows=${specRows.length}`);
      for (let i = 0; i < Math.min(12, qaRows.length, specRows.length); i++) {
        if (qaRows[i].n !== i + 1 || specRows[i].n !== i + 1) errs.push(`row ${i + 1} numbering`);
        if (qaRows[i].name !== QA_NAMES[i]) errs.push(`visual-qa row ${i + 1} name="${qaRows[i].name}"`);
        if (specRows[i].name !== QA_NAMES[i]) errs.push(`spec row ${i + 1} name="${specRows[i].name}"`);
      }
      const inv = readText('docs/governance/ui-invariants.md');
      for (const [name, txt] of [['reference-ui-specification.md', spec], ['ui-invariants.md', inv], ['visual-qa-rules.md', qa]]) {
        if (!txt.includes('accentSoft')) errs.push(`${name} missing accentSoft`);
        if (!txt.includes('provider-home primary CTA')) errs.push(`${name} missing "provider-home primary CTA"`);
      }
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : '12 rows agree row-for-row; accentSoft/CTA wording present in all three files' };
    },
  },
  {
    id: 'GOV-05b',
    requirement: 'GOV-05',
    description: 'responsive-rules.md contains the three band edges (1024px/768px/1023px), the 44px touch minimum, and the no-fourth-band / no-shrink prohibition',
    run() {
      const s = readText('docs/governance/responsive-rules.md');
      const errs = [];
      for (const k of ['1024px', '768px', '1023px', '44px']) if (!s.includes(k)) errs.push(`missing ${k}`);
      if (!/fourth band/i.test(s)) errs.push('missing no-fourth-band prohibition');
      if (!/Do not simply shrink the desktop/i.test(s)) errs.push('missing no-shrink prohibition');
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : '3 band edges + 44px + both prohibitions present' };
    },
  },
  {
    id: 'GOV-05c',
    requirement: 'GOV-05',
    description: 'motion-rules.md contains the four exact tokens.json motion values, useReducedMotion, gsap.matchMedia(\'(prefers-reduced-motion: reduce)\'), gsap.context(), useGSAP(), and the "never both" rule',
    run() {
      const s = readText('docs/governance/motion-rules.md');
      const t = readJson('docs/governance/tokens.json');
      const errs = [];
      const vals = [...Object.values(t.motion.duration), ...Object.values(t.motion.easing)];
      for (const v of vals) if (!s.includes(v)) errs.push(`missing token value ${v}`);
      for (const k of ['useReducedMotion', "gsap.matchMedia('(prefers-reduced-motion: reduce)')", 'gsap.context()', 'useGSAP()', 'never both']) {
        if (!s.includes(k)) errs.push(`missing ${k}`);
      }
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : '4 token values + reduced-motion + GSAP/Framer hooks + never-both rule present' };
    },
  },
  {
    id: 'GOV-02d',
    requirement: 'GOV-02',
    description: 'the governance package is exactly the 8 named artifacts',
    run() {
      const files = readdirSync(rel('docs/governance')).sort();
      const ok = JSON.stringify(files) === JSON.stringify([...GOVERNANCE_FILES].sort());
      return { ok, detail: ok ? '8 artifacts, exact set' : `found ${JSON.stringify(files)}` };
    },
  },
  {
    id: 'GOV-04e',
    requirement: 'GOV-04',
    description: 'no product code exists (no package.json, src/, tokens.css, tailwind.config.*, postcss.config.*, components.json, tests/)',
    run() {
      const errs = [];
      for (const p of ['package.json', 'src', 'tokens.css', 'components.json', 'tests', 'node_modules']) {
        if (existsSync(rel(p))) errs.push(`exists: ${p}`);
      }
      for (const f of walk('.')) {
        const base = path.basename(f);
        if (/^tailwind\.config\./.test(base)) errs.push(`exists: ${f}`);
        if (/^postcss\.config\./.test(base)) errs.push(`exists: ${f}`);
        if (base === 'tokens.css') errs.push(`exists: ${f}`);
      }
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : 'no product code in the tree' };
    },
  },
  {
    id: 'GOV-TRACE',
    requirement: 'GOV-01..GOV-06',
    description: '.planning/REQUIREMENTS.md marks GOV-01..GOV-06 Complete for phase 1 and .planning/ROADMAP.md Phase 1 shows 6/6 complete',
    run() {
      const req = readText('.planning/REQUIREMENTS.md');
      const rm = readText('.planning/ROADMAP.md');
      const errs = [];
      for (let i = 1; i <= 6; i++) {
        const id = `GOV-0${i}`;
        if (!req.includes(`- [x] **${id}**`)) errs.push(`REQUIREMENTS unchecked ${id}`);
        if (!new RegExp(`\\|\\s*${id}\\s*\\|\\s*1\\s*\\|\\s*Complete\\s*\\|`).test(req)) errs.push(`REQUIREMENTS trace not Complete ${id}`);
        if (!rm.includes(`- [x] 01-0${i}-PLAN.md`)) errs.push(`ROADMAP plan unchecked 01-0${i}`);
      }
      if (!rm.includes('**Plans**: 6/6 plans complete')) errs.push('ROADMAP not 6/6');
      if (!rm.includes('**Requirements**: GOV-01, GOV-02, GOV-03, GOV-04, GOV-05, GOV-06')) errs.push('ROADMAP phase-1 requirements line missing');
      return { ok: errs.length === 0, detail: errs.length ? errs.join('; ') : 'GOV-01..06 Complete in REQUIREMENTS; Phase 1 6/6 in ROADMAP' };
    },
  },
];

// ---------------------------------------------------------------------------
// runner
// ---------------------------------------------------------------------------
function runChecks(list) {
  return list.map((c) => {
    let ok = false;
    let detail;
    try {
      const r = c.run();
      ok = r.ok;
      detail = r.detail;
    } catch (e) {
      ok = false;
      detail = `ERROR: ${e.message}`;
    }
    return { id: c.id, requirement: c.requirement, description: c.description, ok, detail };
  });
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const listOnly = args.includes('--list');
  const ci = args.indexOf('--check');
  const onlyId = ci >= 0 ? args[ci + 1] : null;

  if (listOnly) {
    for (const c of checks) console.log(`${c.id}\t${c.requirement}\t${c.description}`);
    process.exit(0);
  }

  let selected = checks;
  if (onlyId) {
    selected = checks.filter((c) => c.id === onlyId);
    if (selected.length === 0) {
      console.error(`unknown check id: ${onlyId}`);
      process.exit(2);
    }
  }

  const results = runChecks(selected);
  const failed = results.filter((r) => !r.ok);

  if (json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const w = Math.max(...results.map((r) => r.id.length), 6);
    console.log(['ID'.padEnd(w), 'REQ'.padEnd(12), 'OK', 'DETAIL'].join('  '));
    console.log('-'.repeat(w + 2 + 12 + 2 + 4 + 2 + 40));
    for (const r of results) {
      console.log([r.id.padEnd(w), r.requirement.padEnd(12), r.ok ? ' ✓' : ' ✗', r.detail].join('  '));
    }
    console.log('');
    if (failed.length === 0) {
      console.log('VALIDATION-OK');
    } else {
      console.log(`VALIDATION-FAILED: ${failed.map((r) => r.id).join(', ')}`);
    }
  }

  process.exit(failed.length === 0 ? 0 : 1);
}

main();
