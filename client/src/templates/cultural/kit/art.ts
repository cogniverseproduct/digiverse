/**
 * Original, procedurally generated artwork for the Cultural template library. Everything is drawn here as SVG
 * (no photography, no stock images, no third-party assets, no hotlinking) and returned as a data URI. It is used for
 * template demos and as the graceful fallback while a client has not supplied a photograph yet.
 */

export type CulturalArtKind =
  | 'alpona' | 'mandala' | 'pandal' | 'diya' | 'dhak' | 'stage' | 'ink' | 'lotus' | 'lattice' | 'skyline' | 'textile' | 'portrait' | 'mesh';

export const CU_PALETTES = {
  vermilion: ['#2B0A0A', '#7A1414', '#C8281E', '#F1A23A', '#FFF3DC'],
  ivory: ['#F7F0E1', '#E9DBBE', '#C9A96E', '#8B5A2B', '#2E1A0E'],
  indigo: ['#0D1030', '#1C2260', '#3B4BBE', '#E9B949', '#F3F1FF'],
  emerald: ['#04231C', '#0B5A47', '#1B9C7C', '#E4C26B', '#F2FFF9'],
  marigold: ['#3A1C00', '#9A4A00', '#F08A00', '#FFD166', '#FFF8E6'],
  plum: ['#1F0A24', '#52164F', '#A02F8E', '#F2A6D0', '#FFF0F8'],
  slate: ['#0F1419', '#1E2A36', '#43596E', '#A7BDD1', '#F2F7FB'],
  saffron: ['#331500', '#B8480A', '#F28C28', '#FFD27F', '#FFF4DF'],
  teal: ['#031F24', '#0A5963', '#1795A3', '#8FE0E8', '#EAFEFF'],
  rose: ['#2D0B14', '#7C1D3A', '#D1456B', '#FFB3C6', '#FFF1F5'],
  sand: ['#EFE6D2', '#DCCBA3', '#B59A5F', '#6B5326', '#2A210F'],
  night: ['#06070F', '#121635', '#2B3A8F', '#F5C45B', '#F4F3EC']
} as const;
export type CulturalPaletteName = keyof typeof CU_PALETTES;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const uri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const W = 1200;
const H = 800;
const wrap = (inner: string, w = W, h = H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
const bg = (a: string, b: string, id = 'bg') => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;

/** Concentric rangoli / alpona rosette centred at (cx, cy). */
function rosette(cx: number, cy: number, R: number, p: readonly string[], petals = 12, op = 1): string {
  let s = '';
  for (let ring = 0; ring < 4; ring++) {
    const r = R * (1 - ring * 0.22);
    const n = petals + ring * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.2;
      const x = cx + Math.cos(a) * r * 0.62;
      const y = cy + Math.sin(a) * r * 0.62;
      s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 0.2).toFixed(1)}" ry="${(r * 0.09).toFixed(1)}" transform="rotate(${((a * 180) / Math.PI).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${p[(ring % 3) + 2]}" opacity="${(op * (0.9 - ring * 0.12)).toFixed(2)}"/>`;
    }
  }
  return `${s}<circle cx="${cx}" cy="${cy}" r="${R * 0.1}" fill="${p[4]}" opacity="${op}"/>`;
}

function alpona(r: () => number, p: readonly string[]): string {
  let dots = '';
  for (let i = 0; i < 90; i++) dots += `<circle cx="${r() * W}" cy="${r() * H}" r="${1 + r() * 2.4}" fill="${p[4]}" opacity="${0.12 + r() * 0.2}"/>`;
  return wrap(`${bg(p[0], p[1])}${dots}${rosette(600, 400, 360, p, 12, 0.95)}${rosette(150, 120, 120, p, 8, 0.5)}${rosette(1060, 690, 150, p, 8, 0.5)}<circle cx="600" cy="400" r="380" fill="none" stroke="${p[3]}" stroke-width="3" stroke-dasharray="3 12" opacity=".7"/>`);
}

function mandala(r: () => number, p: readonly string[]): string {
  let s = '';
  for (let k = 0; k < 9; k++) {
    const rad = 60 + k * 38;
    const n = 8 + k * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + k * 0.17;
      const x = 600 + Math.cos(a) * rad;
      const y = 400 + Math.sin(a) * rad;
      s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} q${(Math.cos(a + 1) * 22).toFixed(1)} ${(Math.sin(a + 1) * 22).toFixed(1)} ${(Math.cos(a) * 26).toFixed(1)} ${(Math.sin(a) * 26).toFixed(1)}" stroke="${p[2 + (k % 3)]}" stroke-width="${2 + (k % 3)}" fill="none" opacity="${0.35 + r() * 0.5}" stroke-linecap="round"/>`;
    }
    s += `<circle cx="600" cy="400" r="${rad}" fill="none" stroke="${p[3]}" stroke-width="1" opacity=".25"/>`;
  }
  return wrap(`${bg(p[0], p[1])}${s}<circle cx="600" cy="400" r="26" fill="${p[3]}"/>`);
}

function pandal(r: () => number, p: readonly string[]): string {
  let arches = '';
  for (let i = 0; i < 7; i++) {
    const x = 90 + i * 170;
    arches += `<path d="M${x - 70} 800 V420 Q${x} 250 ${x + 70} 420 V800Z" fill="${p[1]}" opacity=".9" stroke="${p[3]}" stroke-width="3"/><path d="M${x - 40} 800 V450 Q${x} 340 ${x + 40} 450 V800Z" fill="${p[0]}" opacity=".85"/>`;
  }
  let lights = '';
  for (let i = 0; i < 70; i++) {
    const x = (i / 69) * W;
    const y = 90 + Math.sin(i / 3) * 40 + (i % 2) * 14;
    lights += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${5 + r() * 3}" fill="${p[3]}" opacity="${0.7 + r() * 0.3}"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="16" fill="${p[3]}" opacity=".12"/>`;
  }
  return wrap(`${bg(p[0], p[2])}<path d="M0 90 Q300 150 600 90 T1200 90" fill="none" stroke="${p[3]}" stroke-width="2" opacity=".6"/>${lights}<path d="M520 330 L600 170 L680 330Z" fill="${p[3]}" opacity=".9"/><rect x="560" y="330" width="80" height="470" fill="${p[1]}"/>${arches}<rect y="740" width="${W}" height="60" fill="${p[0]}"/>`);
}

function diya(r: () => number, p: readonly string[]): string {
  let lamps = '';
  for (let i = 0; i < 9; i++) {
    const x = 90 + i * 130;
    const y = 560 + Math.sin(i * 1.1) * 40;
    lamps += `<ellipse cx="${x}" cy="${y + 28}" rx="80" ry="60" fill="${p[3]}" opacity=".07"/><path d="M${x - 44} ${y} q44 64 88 0z" fill="${p[1]}" stroke="${p[3]}" stroke-width="3"/><path d="M${x} ${y - 6} q-22 -38 0 -78 q22 40 0 78z" fill="${p[3]}"/><path d="M${x} ${y - 14} q-9 -22 0 -46 q9 24 0 46z" fill="${p[4]}"/>`;
  }
  let sparks = '';
  for (let i = 0; i < 120; i++) sparks += `<circle cx="${r() * W}" cy="${r() * 480}" r="${0.8 + r() * 1.8}" fill="${p[3]}" opacity="${0.15 + r() * 0.5}"/>`;
  return wrap(`${bg(p[0], p[1])}${sparks}${lamps}`);
}

function dhak(r: () => number, p: readonly string[]): string {
  let smoke = '';
  for (let i = 0; i < 14; i++) smoke += `<circle cx="${380 + r() * 440}" cy="${60 + i * 36}" r="${40 + r() * 70}" fill="${p[4]}" opacity="${0.035 + r() * 0.05}"/>`;
  const drum = (x: number, y: number, s: number) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="-90" rx="46" ry="14" fill="${p[4]}" opacity=".9"/><path d="M-46 -90 Q-82 0 -46 90 L46 90 Q82 0 46 -90Z" fill="${p[2]}" stroke="${p[3]}" stroke-width="4"/><ellipse cx="0" cy="90" rx="46" ry="14" fill="${p[1]}"/>${[-60, -30, 0, 30, 60].map((t) => `<path d="M-60 ${t} Q0 ${t + 16} 60 ${t}" stroke="${p[3]}" stroke-width="3" fill="none" opacity=".8"/>`).join('')}</g>`;
  return wrap(`${bg(p[0], p[1])}${smoke}${drum(330, 470, 1.7)}${drum(620, 520, 2)}${drum(900, 470, 1.6)}<rect y="700" width="${W}" height="100" fill="${p[0]}" opacity=".9"/>`);
}

function stage(r: () => number, p: readonly string[]): string {
  let folds = '';
  for (let i = 0; i < 12; i++) {
    folds += `<path d="M${i * 50} 0 Q${i * 50 + 25} 400 ${i * 50} 800" stroke="${p[0]}" stroke-width="22" opacity=".28" fill="none"/><path d="M${W - i * 50} 0 Q${W - i * 50 - 25} 400 ${W - i * 50} 800" stroke="${p[0]}" stroke-width="22" opacity=".28" fill="none"/>`;
  }
  return wrap(`${bg(p[1], p[0])}<defs><radialGradient id="sp" cx=".5" cy=".12" r=".8"><stop offset="0" stop-color="${p[4]}" stop-opacity=".5"/><stop offset="1" stop-color="${p[4]}" stop-opacity="0"/></radialGradient></defs><polygon points="520,0 680,0 980,800 220,800" fill="url(#sp)"/><path d="M0 0 H600 Q420 300 0 800Z" fill="${p[2]}"/><path d="M1200 0 H600 Q780 300 1200 800Z" fill="${p[2]}"/>${folds}<ellipse cx="600" cy="740" rx="420" ry="46" fill="${p[3]}" opacity=".5"/><circle cx="${560 + r() * 80}" cy="540" r="0" fill="none"/>`);
}

function ink(r: () => number, p: readonly string[]): string {
  let strokes = '';
  for (let i = 0; i < 9; i++) strokes += `<path d="M${r() * W} ${r() * H} C${r() * W} ${r() * H} ${r() * W} ${r() * H} ${r() * W} ${r() * H}" stroke="${p[1 + (i % 3)]}" stroke-width="${6 + r() * 30}" stroke-linecap="round" fill="none" opacity="${0.1 + r() * 0.25}"/>`;
  let lines = '';
  for (let i = 0; i < 18; i++) lines += `<line x1="140" x2="${700 + r() * 360}" y1="${150 + i * 28}" y2="${150 + i * 28}" stroke="${p[4]}" stroke-width="2" opacity=".18"/>`;
  return wrap(`<rect width="${W}" height="${H}" fill="${p[0]}"/>${strokes}${lines}<circle cx="930" cy="250" r="110" fill="${p[3]}" opacity=".8"/>`);
}

function lotus(r: () => number, p: readonly string[]): string {
  let petals = '';
  for (let layer = 0; layer < 3; layer++) {
    const n = 9 + layer * 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI - Math.PI;
      petals += `<path d="M600 560 Q${600 + Math.cos(a) * (170 + layer * 40)} ${560 + Math.sin(a) * (380 - layer * 40)} ${600 + Math.cos(a) * (240 + layer * 60)} ${560 + Math.sin(a) * (80 + layer * 70)} Q${600 + Math.cos(a) * 110} ${560 + Math.sin(a) * 160} 600 560Z" fill="${p[2 + layer]}" opacity="${0.78 - layer * 0.1}" stroke="${p[4]}" stroke-width="1.5"/>`;
    }
  }
  let ripples = '';
  for (let i = 0; i < 6; i++) ripples += `<ellipse cx="600" cy="${590 + i * 22}" rx="${220 + i * 80}" ry="${20 + i * 8}" fill="none" stroke="${p[4]}" stroke-width="1.5" opacity="${0.35 - i * 0.05}"/>`;
  return wrap(`${bg(p[0], p[1])}${ripples}${petals}<circle cx="600" cy="540" r="${22 + r() * 4}" fill="${p[3]}"/>`);
}

function lattice(r: () => number, p: readonly string[]): string {
  let s = '';
  for (let y = 0; y < 9; y++) for (let x = 0; x < 13; x++) {
    const cx = x * 100 + (y % 2 ? 50 : 0);
    const cy = y * 100;
    s += `<path d="M${cx} ${cy - 40} L${cx + 40} ${cy} L${cx} ${cy + 40} L${cx - 40} ${cy}Z" fill="none" stroke="${p[3]}" stroke-width="2" opacity="${0.25 + r() * 0.3}"/><circle cx="${cx}" cy="${cy}" r="4" fill="${p[(x + y) % 2 ? 3 : 2]}" opacity=".7"/>`;
  }
  return wrap(`<rect width="${W}" height="${H}" fill="${p[1]}"/>${s}`);
}

function skyline(r: () => number, p: readonly string[]): string {
  let towers = '';
  for (let i = 0; i < 16; i++) {
    const w = 50 + r() * 60;
    const h = 120 + r() * 220;
    const x = i * 78 - 10;
    towers += `<rect x="${x}" y="${H - h}" width="${w}" height="${h}" fill="${p[1]}"/>`;
    for (let k = 0; k < 6; k++) towers += `<rect x="${x + 8 + (k % 2) * 22}" y="${H - h + 16 + Math.floor(k / 2) * 30}" width="10" height="14" fill="${p[3]}" opacity="${0.3 + r() * 0.6}"/>`;
  }
  let fire = '';
  for (let i = 0; i < 8; i++) {
    const cx = 110 + r() * 980;
    const cy = 90 + r() * 260;
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      fire += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * (36 + r() * 24)).toFixed(0)}" y2="${(cy + Math.sin(a) * (36 + r() * 24)).toFixed(0)}" stroke="${p[3 - (k % 2)]}" stroke-width="2.2" opacity=".8" stroke-linecap="round"/>`;
    }
  }
  return wrap(`${bg(p[0], p[2])}${fire}${towers}`);
}

function textile(r: () => number, p: readonly string[]): string {
  let s = '';
  for (let i = 0; i < 14; i++) s += `<rect x="0" y="${i * 58}" width="${W}" height="${14 + (i % 3) * 7}" fill="${p[2 + (i % 3)]}" opacity="${0.5 + r() * 0.3}"/>`;
  for (let i = 0; i < 40; i++) s += `<path d="M${i * 32} 0 L${i * 32 + 16} 800" stroke="${p[4]}" stroke-width="1" opacity=".1"/>`;
  return wrap(`<rect width="${W}" height="${H}" fill="${p[1]}"/>${s}`);
}

function portrait(r: () => number, p: readonly string[]): string {
  return wrap(`${bg(p[1], p[0])}<circle cx="600" cy="300" r="${130 + r() * 10}" fill="${p[3]}" opacity=".9"/><path d="M200 800 Q220 480 600 470 Q980 480 1000 800Z" fill="${p[2]}"/>`);
}

function mesh(r: () => number, p: readonly string[]): string {
  let blobs = '';
  for (let i = 0; i < 6; i++) blobs += `<circle cx="${r() * W}" cy="${r() * H}" r="${160 + r() * 260}" fill="${p[1 + (i % 4)]}" opacity="${0.28 + r() * 0.3}"/>`;
  return wrap(`<defs><filter id="b"><feGaussianBlur stdDeviation="60"/></filter></defs><rect width="${W}" height="${H}" fill="${p[0]}"/><g filter="url(#b)">${blobs}</g>`);
}

const DRAW: Record<CulturalArtKind, (r: () => number, p: readonly string[]) => string> = { alpona, mandala, pandal, diya, dhak, stage, ink, lotus, lattice, skyline, textile, portrait, mesh };

/** Deterministic artwork for a kind, seed and palette. The same inputs always give the same image. */
export function art(kind: CulturalArtKind, seed: string, palette: CulturalPaletteName = 'vermilion'): string {
  return uri(DRAW[kind](rng(hashSeed(`${kind}:${seed}`)), CU_PALETTES[palette]));
}

/** A round monogram badge used as a logo placeholder until the client uploads one. */
export function monogramUri(initials: string, bgColor: string, fgColor: string): string {
  const safe = initials.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 3) || '·';
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="${bgColor}"/><circle cx="100" cy="100" r="84" fill="none" stroke="${fgColor}" stroke-width="3"/><circle cx="100" cy="100" r="76" fill="none" stroke="${fgColor}" stroke-width="1" stroke-dasharray="2 5"/><text x="100" y="124" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="${safe.length > 2 ? 58 : 72}" fill="${fgColor}">${safe}</text></svg>`);
}
