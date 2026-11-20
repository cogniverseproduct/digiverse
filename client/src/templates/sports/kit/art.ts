/**
 * Original, procedurally generated artwork for the Sports template library. Everything is drawn here as SVG
 * (no photography, no third-party assets, no hotlinking) and returned as a data URI. It is used for template
 * demos and as the graceful fallback when a client has not supplied a photo yet.
 */

export type SportsArtKind =
  | 'pitch' | 'stadium' | 'court' | 'cricket' | 'track' | 'action' | 'trophy' | 'net' | 'portrait' | 'mesh' | 'stripes' | 'crowd';

export const SP_PALETTES = {
  turf: ['#0B3D23', '#14693A', '#1F9954', '#8DE0A6', '#F4FFF7'],
  night: ['#050A18', '#0B1630', '#16295A', '#3A6BFF', '#9CC0FF'],
  royal: ['#0A1A4A', '#14327E', '#2457D6', '#F5C542', '#FFFFFF'],
  crimson: ['#2A0709', '#6B0F1A', '#C21F3A', '#FF6B7D', '#FFE8EA'],
  sunrise: ['#2B1055', '#7A2E8E', '#F0457A', '#FF9A3C', '#FFE9B8'],
  ocean: ['#031B34', '#05507A', '#0A8FBF', '#58D0E8', '#E3F8FF'],
  mono: ['#0B0B0C', '#242426', '#5C5C60', '#B9B9BE', '#F4F4F5'],
  paper: ['#F5F1E8', '#E4DBC6', '#C2B48E', '#7B6A45', '#2A2418'],
  clay: ['#3A1B0D', '#8A3F1B', '#C9632B', '#F1A66B', '#FFF0DD'],
  mint: ['#062B2B', '#0B5A56', '#12A58F', '#7FE5CE', '#EAFFF9'],
  volt: ['#0C1200', '#27400A', '#8BC31F', '#D6FF3D', '#F6FFD0'],
  violet: ['#160A33', '#3A1B80', '#7A3FE0', '#C09BFF', '#F1E8FF']
} as const;
export type SportsPaletteName = keyof typeof SP_PALETTES;

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
const wrap = (inner: string, w = W, h = H) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
const grad = (id: string, a: string, b: string, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

function pitch(r: () => number, p: readonly string[]): string {
  let stripes = '';
  for (let i = 0; i < 12; i++) stripes += `<rect x="${i * 100}" y="0" width="100" height="${H}" fill="${i % 2 ? p[1] : p[2]}" opacity="0.9"/>`;
  const line = `fill="none" stroke="${p[4]}" stroke-width="5" opacity="0.85"`;
  return wrap(`${stripes}<rect x="60" y="50" width="1080" height="700" ${line}/><line x1="600" y1="50" x2="600" y2="750" ${line}/><circle cx="600" cy="400" r="110" ${line}/><circle cx="600" cy="400" r="8" fill="${p[4]}"/><rect x="60" y="230" width="190" height="340" ${line}/><rect x="950" y="230" width="190" height="340" ${line}/><rect x="60" y="320" width="70" height="160" ${line}/><rect x="1070" y="320" width="70" height="160" ${line}/><rect width="${W}" height="${H}" fill="url(#v)" opacity="${0.35 + r() * 0.1}"/><defs><radialGradient id="v" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000"/></radialGradient></defs>`);
}

function stadium(r: () => number, p: readonly string[]): string {
  let beams = '';
  for (let i = 0; i < 5; i++) {
    const x = 120 + i * 240 + r() * 40;
    beams += `<polygon points="${x},60 ${x - 150 - r() * 40},720 ${x + 150 + r() * 40},720" fill="${p[4]}" opacity="${0.06 + r() * 0.05}"/><circle cx="${x}" cy="60" r="14" fill="${p[4]}"/><circle cx="${x}" cy="60" r="34" fill="${p[4]}" opacity=".18"/>`;
  }
  let crowd = '';
  for (let i = 0; i < 260; i++) crowd += `<circle cx="${r() * W}" cy="${470 + r() * 120}" r="${1.6 + r() * 2.2}" fill="${p[r() > 0.5 ? 3 : 4]}" opacity="${0.25 + r() * 0.5}"/>`;
  return wrap(`<defs>${grad('s', p[0], p[2])}<radialGradient id="g" cx=".5" cy="1" r=".8"><stop offset="0" stop-color="${p[3]}" stop-opacity=".55"/><stop offset="1" stop-color="${p[3]}" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#s)"/>${beams}<path d="M0 520 Q600 380 1200 520 L1200 800 L0 800Z" fill="${p[1]}"/>${crowd}<path d="M0 640 Q600 540 1200 640 L1200 800 L0 800Z" fill="${p[1]}" opacity=".92"/><ellipse cx="600" cy="740" rx="560" ry="70" fill="url(#g)"/>`);
}

function court(r: () => number, p: readonly string[]): string {
  const line = `fill="none" stroke="${p[4]}" stroke-width="6" opacity=".9"`;
  let boards = '';
  for (let i = 0; i < 14; i++) boards += `<rect x="${i * 86}" y="0" width="86" height="${H}" fill="${i % 2 ? p[2] : p[3]}" opacity="${0.55 + r() * 0.08}"/>`;
  return wrap(`<rect width="${W}" height="${H}" fill="${p[1]}"/>${boards}<rect x="70" y="70" width="1060" height="660" ${line}/><line x1="600" y1="70" x2="600" y2="730" ${line}/><circle cx="600" cy="400" r="100" ${line}/><path d="M70 270h210v260H70" ${line}/><path d="M1130 270H920v260h210" ${line}/><path d="M280 270a130 130 0 0 1 0 260" ${line}/><path d="M920 270a130 130 0 0 0 0 260" ${line}/>`);
}

function cricket(r: () => number, p: readonly string[]): string {
  let mow = '';
  for (let i = 0; i < 9; i++) mow += `<circle cx="600" cy="400" r="${340 - i * 36}" fill="${i % 2 ? p[1] : p[2]}"/>`;
  return wrap(`<rect width="${W}" height="${H}" fill="${p[0]}"/><ellipse cx="600" cy="400" rx="520" ry="360" fill="${p[1]}"/>${mow}<rect x="560" y="250" width="80" height="300" rx="6" fill="${p[3]}" opacity=".85"/><line x1="560" y1="285" x2="640" y2="285" stroke="${p[4]}" stroke-width="4"/><line x1="560" y1="515" x2="640" y2="515" stroke="${p[4]}" stroke-width="4"/><ellipse cx="600" cy="400" rx="520" ry="360" fill="none" stroke="${p[4]}" stroke-width="5" stroke-dasharray="14 12" opacity=".7"/><circle cx="${300 + r() * 20}" cy="${300 + r() * 20}" r="7" fill="${p[4]}" opacity=".0"/>`);
}

function track(_r: () => number, p: readonly string[]): string {
  let lanes = '';
  for (let i = 0; i < 7; i++) lanes += `<rect x="${130 + i * 26}" y="${120 + i * 26}" width="${940 - i * 52}" height="${560 - i * 52}" rx="${280 - i * 26}" fill="none" stroke="${p[4]}" stroke-width="3" opacity=".75"/>`;
  return wrap(`<rect width="${W}" height="${H}" fill="${p[1]}"/><rect x="130" y="120" width="940" height="560" rx="280" fill="${p[3]}" opacity=".95"/><rect x="300" y="290" width="600" height="220" rx="110" fill="${p[2]}"/>${lanes}`);
}

function action(r: () => number, p: readonly string[]): string {
  let bands = '';
  for (let i = 0; i < 9; i++) bands += `<polygon points="${-100 + i * 170},${H} ${40 + i * 170},0 ${140 + i * 170},0 ${i * 170 - 0},${H}" fill="${p[(i % 3) + 1]}" opacity="${0.55 + r() * 0.3}"/>`;
  let lines = '';
  for (let i = 0; i < 18; i++) lines += `<line x1="${r() * W}" y1="${r() * H}" x2="${r() * W + 300}" y2="${r() * H - 160}" stroke="${p[4]}" stroke-width="${2 + r() * 4}" opacity="${0.15 + r() * 0.3}" stroke-linecap="round"/>`;
  return wrap(`<defs>${grad('a', p[0], p[1], 1, 1)}</defs><rect width="${W}" height="${H}" fill="url(#a)"/>${bands}${lines}<circle cx="${760 + r() * 120}" cy="${300 + r() * 120}" r="120" fill="${p[4]}" opacity=".92"/><circle cx="${760 + r() * 40}" cy="${300 + r() * 40}" r="120" fill="none" stroke="${p[0]}" stroke-width="10" opacity=".35"/>`);
}

function trophy(_r: () => number, p: readonly string[]): string {
  return wrap(`<defs>${grad('t', p[0], p[2])}<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[3]}"/><stop offset="1" stop-color="${p[4]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#t)"/><circle cx="600" cy="360" r="300" fill="${p[3]}" opacity=".10"/><path d="M470 170h260v150c0 90-58 150-130 150s-130-60-130-150Z" fill="url(#gold)"/><path d="M470 210c-70 0-100 30-100 80 0 60 60 90 110 90M730 210c70 0 100 30 100 80 0 60-60 90-110 90" fill="none" stroke="url(#gold)" stroke-width="22"/><rect x="570" y="470" width="60" height="110" fill="url(#gold)"/><rect x="480" y="580" width="240" height="46" rx="8" fill="url(#gold)"/><rect x="440" y="626" width="320" height="40" rx="8" fill="${p[3]}" opacity=".85"/>`);
}

function net(r: () => number, p: readonly string[]): string {
  let g = '';
  for (let i = 0; i <= 30; i++) g += `<line x1="${i * 40}" y1="0" x2="${i * 40 - 200 + r() * 10}" y2="${H}" stroke="${p[4]}" stroke-width="2" opacity=".35"/><line x1="0" y1="${i * 28}" x2="${W}" y2="${i * 28 + 30}" stroke="${p[4]}" stroke-width="2" opacity=".35"/>`;
  return wrap(`<defs>${grad('n', p[0], p[1])}</defs><rect width="${W}" height="${H}" fill="url(#n)"/>${g}`);
}

function portrait(r: () => number, p: readonly string[]): string {
  const sk = ['#F1C9A5', '#D9A47C', '#B87A52', '#8D5A3B', '#EBC1A0'][Math.floor(r() * 5)];
  return wrap(`<defs>${grad('p', p[1], p[2])}</defs><rect width="800" height="1000" fill="url(#p)"/><circle cx="400" cy="1010" r="410" fill="${p[0]}" opacity=".85"/><rect x="345" y="480" width="110" height="140" fill="${sk}"/><ellipse cx="400" cy="380" rx="150" ry="180" fill="${sk}"/><path d="M250 340c10-150 130-190 220-170 80 20 100 90 80 170-30-60-100-110-190-100-50 6-85 40-110 100Z" fill="${p[0]}"/>`, 800, 1000);
}

function mesh(r: () => number, p: readonly string[]): string {
  let blobs = '';
  for (let i = 0; i < 6; i++) blobs += `<circle cx="${r() * W}" cy="${r() * H}" r="${160 + r() * 260}" fill="${p[1 + (i % 4)]}" opacity="${0.35 + r() * 0.35}"/>`;
  return wrap(`<defs>${grad('m', p[0], p[1])}<filter id="b"><feGaussianBlur stdDeviation="70"/></filter></defs><rect width="${W}" height="${H}" fill="url(#m)"/><g filter="url(#b)">${blobs}</g>`);
}

function stripes(_r: () => number, p: readonly string[]): string {
  let s = '';
  for (let i = 0; i < 16; i++) s += `<polygon points="${i * 110 - 200},${H} ${i * 110},0 ${i * 110 + 55},0 ${i * 110 - 145},${H}" fill="${i % 2 ? p[1] : p[2]}"/>`;
  return wrap(`<rect width="${W}" height="${H}" fill="${p[0]}"/>${s}`);
}

function crowd(r: () => number, p: readonly string[]): string {
  let d = '';
  for (let row = 0; row < 14; row++) for (let i = 0; i < 40; i++) d += `<circle cx="${i * 30 + (row % 2) * 15 + r() * 6}" cy="${60 + row * 50}" r="${6 + r() * 5}" fill="${p[1 + Math.floor(r() * 4)]}" opacity="${0.35 + r() * 0.5}"/>`;
  return wrap(`<rect width="${W}" height="${H}" fill="${p[0]}"/>${d}`);
}

const KINDS: Record<SportsArtKind, (r: () => number, p: readonly string[]) => string> = {
  pitch, stadium, court, cricket, track, action, trophy, net, portrait, mesh, stripes, crowd
};

const cache = new Map<string, string>();

/** A deterministic generated image: the same (kind, seed, palette) always yields the same artwork. */
export function art(kind: SportsArtKind, seed: string, palette: SportsPaletteName = 'night'): string {
  const key = `${kind}|${seed}|${palette}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out = uri(KINDS[kind](rng(hashSeed(`${kind}:${seed}`)), SP_PALETTES[palette]));
  cache.set(key, out);
  return out;
}

export type CrestShape = 'shield' | 'round' | 'hex' | 'square';

/** A simple generated club crest from initials; used when the client has not uploaded a logo. */
export function crestSvg(initials: string, c1: string, c2: string, shape: CrestShape = 'shield', ink = '#FFFFFF'): string {
  const text = initials.slice(0, 3).toUpperCase();
  const size = text.length > 2 ? 54 : 70;
  const body =
    shape === 'round' ? `<circle cx="100" cy="100" r="88"/>`
    : shape === 'hex' ? `<polygon points="100,10 178,55 178,145 100,190 22,145 22,55"/>`
    : shape === 'square' ? `<rect x="18" y="18" width="164" height="164" rx="26"/>`
    : `<path d="M100 8 L178 34 V104 C178 148 144 176 100 194 C56 176 22 148 22 104 V34 Z"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>${grad('c', c1, c2, 1, 1)}</defs><g fill="url(#c)" stroke="${ink}" stroke-width="7" stroke-opacity=".9">${body}</g><text x="100" y="${shape === 'shield' ? 112 : 118}" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="${size}" fill="${ink}">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`;
}

export const crestUri = (initials: string, c1: string, c2: string, shape: CrestShape = 'shield', ink = '#FFFFFF') => uri(crestSvg(initials, c1, c2, shape, ink));
