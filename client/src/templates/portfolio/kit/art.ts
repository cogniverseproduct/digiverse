/**
 * Original, procedurally generated artwork used for template demos and as a graceful fallback when a
 * client has not supplied an image yet. Everything is drawn here as SVG (no external assets, no
 * hotlinking, no third-party licences) and returned as a data URI.
 */

export type ArtKind =
  | 'landscape'
  | 'skyline'
  | 'elevation'
  | 'interior'
  | 'mesh'
  | 'ui'
  | 'blueprint'
  | 'poster'
  | 'orb'
  | 'chart'
  | 'portrait'
  | 'stripes';

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

export const PALETTES = {
  dusk: ['#1B1B3A', '#693668', '#A74482', '#F84AA7', '#FF3562'],
  ocean: ['#03045E', '#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8'],
  ember: ['#2B0F0F', '#7A1F1F', '#D9480F', '#FF922B', '#FFE8CC'],
  forest: ['#0B2A1F', '#14532D', '#2F9E6A', '#8CE0A8', '#E6FCEB'],
  paper: ['#F4EFE6', '#D9CDB8', '#B7A584', '#6E5B3D', '#2B2418'],
  candy: ['#FFD400', '#FF3D81', '#2F6BFF', '#00C2A8', '#111111'],
  neon: ['#0A0A1F', '#3A0CA3', '#7209B7', '#F72585', '#4CC9F0'],
  mono: ['#0C0C0C', '#2A2A2A', '#6B6B6B', '#BDBDBD', '#F2F2F2'],
  sand: ['#F1E9DA', '#E3D3B8', '#C9B08A', '#A68A64', '#5B4A32'],
  slate: ['#0B1020', '#16203A', '#24365E', '#3B82F6', '#93C5FD']
} as const;
export type PaletteName = keyof typeof PALETTES;

function pal(name: PaletteName) {
  return PALETTES[name] as readonly string[];
}

function landscape(seed: number, p: readonly string[]) {
  const r = rng(seed);
  let layers = '';
  const sunX = 200 + r() * 800;
  for (let i = 0; i < 4; i++) {
    const base = 360 + i * 95;
    let d = `M0 ${H} L0 ${base}`;
    for (let x = 0; x <= W; x += 60) d += ` L${x} ${base - r() * (150 - i * 22) - 20}`;
    d += ` L${W} ${H} Z`;
    layers += `<path d="${d}" fill="${p[Math.min(i + 1, 4)]}" opacity="${0.35 + i * 0.2}"/>`;
  }
  return wrap(`<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="0.7" stop-color="${p[2]}"/><stop offset="1" stop-color="${p[3]}"/></linearGradient><radialGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#s)"/><circle cx="${sunX}" cy="300" r="260" fill="url(#g)" opacity=".55"/><circle cx="${sunX}" cy="300" r="64" fill="#fff" opacity=".92"/>${layers}`);
}

function skyline(seed: number, p: readonly string[]) {
  const r = rng(seed);
  let b = '';
  let x = -20;
  while (x < W) {
    const w = 50 + r() * 90;
    const h = 150 + r() * 380;
    const y = H - h;
    b += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p[1]}" opacity=".92"/>`;
    for (let wy = y + 14; wy < H - 14; wy += 22) {
      for (let wx = x + 10; wx < x + w - 10; wx += 16) {
        if (r() > 0.62) b += `<rect x="${wx}" y="${wy}" width="7" height="10" fill="${p[4]}" opacity="${0.5 + r() * 0.5}"/>`;
      }
    }
    x += w + 4;
  }
  return wrap(`<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#s)"/><circle cx="${900 - r() * 300}" cy="170" r="70" fill="${p[4]}" opacity=".9"/>${b}`);
}

function elevation(seed: number, p: readonly string[]) {
  const r = rng(seed);
  let planes = '';
  const cols = 3 + Math.floor(r() * 2);
  for (let i = 0; i < cols; i++) {
    const w = 180 + r() * 220;
    const h = 260 + r() * 260;
    const x = 80 + i * (W - 160) / cols + r() * 30;
    const y = 640 - h;
    planes += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p[i % 3 === 0 ? 0 : 1]}"/>`;
    planes += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sh)" opacity=".5"/>`;
    const rows = 2 + Math.floor(r() * 3);
    for (let k = 0; k < rows; k++) planes += `<rect x="${x + 22}" y="${y + 30 + k * ((h - 60) / rows)}" width="${w - 44}" height="${(h - 90) / rows}" fill="${p[4]}" opacity="${0.15 + r() * 0.35}"/>`;
  }
  return wrap(`<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[3]}"/><stop offset="1" stop-color="${p[4]}"/></linearGradient><linearGradient id="sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/><rect y="640" width="${W}" height="160" fill="${p[2]}"/>${planes}<rect y="636" width="${W}" height="6" fill="${p[0]}" opacity=".7"/>`);
}

function interior(seed: number, p: readonly string[]) {
  const r = rng(seed);
  const wx = 150 + r() * 80;
  return wrap(`<defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[3]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient><linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#w)"/><polygon points="0,560 ${W},560 ${W},${H} 0,${H}" fill="${p[1]}"/><polygon points="${wx},120 ${wx + 330},120 ${wx + 330},520 ${wx},520" fill="${p[4]}" opacity=".95"/><polygon points="${wx},120 ${wx + 330},120 ${wx + 700},560 ${wx + 380},560" fill="url(#l)" opacity=".45"/><rect x="560" y="420" width="420" height="150" rx="26" fill="${p[0]}"/><rect x="540" y="470" width="60" height="100" rx="14" fill="${p[0]}"/><rect x="940" y="470" width="60" height="100" rx="14" fill="${p[0]}"/><rect x="1020" y="300" width="14" height="270" fill="${p[0]}"/><ellipse cx="1027" cy="296" rx="70" ry="40" fill="${p[4]}"/>`);
}

function mesh(seed: number, p: readonly string[]) {
  const r = rng(seed);
  let c = '';
  for (let i = 0; i < 6; i++) c += `<circle cx="${r() * W}" cy="${r() * H}" r="${160 + r() * 260}" fill="${p[i % p.length]}" opacity="${0.55 + r() * 0.35}"/>`;
  return wrap(`<defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="90"/></filter></defs><rect width="${W}" height="${H}" fill="${p[0]}"/><g filter="url(#b)">${c}</g>`);
}

function ui(seed: number, p: readonly string[]) {
  const r = rng(seed);
  let cards = '';
  for (let i = 0; i < 6; i++) {
    const x = 330 + (i % 3) * 270;
    const y = 250 + Math.floor(i / 3) * 190;
    cards += `<rect x="${x}" y="${y}" width="244" height="164" rx="18" fill="#fff" opacity=".96"/><rect x="${x + 18}" y="${y + 18}" width="${70 + r() * 90}" height="12" rx="6" fill="${p[1]}"/><rect x="${x + 18}" y="${y + 44}" width="${120 + r() * 90}" height="8" rx="4" fill="${p[3]}" opacity=".5"/><polyline fill="none" stroke="${p[2]}" stroke-width="5" stroke-linecap="round" points="${[0, 1, 2, 3, 4, 5].map((k) => `${x + 22 + k * 38},${y + 130 - r() * 54}`).join(' ')}"/>`;
  }
  return wrap(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[2]}"/><stop offset="1" stop-color="${p[3]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/><rect x="90" y="90" width="1020" height="620" rx="30" fill="#F7F8FC"/><rect x="90" y="90" width="1020" height="54" rx="30" fill="#fff"/><circle cx="130" cy="117" r="7" fill="#FF6B6B"/><circle cx="154" cy="117" r="7" fill="#FFD43B"/><circle cx="178" cy="117" r="7" fill="#51CF66"/><rect x="120" y="170" width="170" height="510" rx="18" fill="${p[0]}" opacity=".92"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="140" y="${200 + i * 52}" width="${90 + (i % 3) * 20}" height="14" rx="7" fill="#fff" opacity="${i === 1 ? 0.95 : 0.4}"/>`).join('')}${cards}`);
}

function blueprint(seed: number, p: readonly string[]) {
  const r = rng(seed);
  let g = '';
  for (let x = 0; x <= W; x += 40) g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${p[3]}" stroke-opacity="${x % 200 === 0 ? 0.28 : 0.12}"/>`;
  for (let y = 0; y <= H; y += 40) g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${p[3]}" stroke-opacity="${y % 200 === 0 ? 0.28 : 0.12}"/>`;
  let n = '';
  const pts: [number, number][] = [];
  for (let i = 0; i < 9; i++) pts.push([120 + r() * 960, 100 + r() * 600]);
  pts.forEach((a, i) => {
    const b = pts[(i + 1 + Math.floor(r() * 3)) % pts.length];
    n += `<path d="M${a[0]} ${a[1]} H${(a[0] + b[0]) / 2} V${b[1]} H${b[0]}" fill="none" stroke="${p[4]}" stroke-width="2" opacity=".8"/>`;
  });
  pts.forEach((a, i) => (n += `<rect x="${a[0] - 34}" y="${a[1] - 18}" width="68" height="36" rx="6" fill="${p[1]}" stroke="${p[3]}" stroke-width="2"/><rect x="${a[0] - 22}" y="${a[1] - 4}" width="${20 + (i % 3) * 8}" height="6" rx="3" fill="${p[4]}"/>`));
  return wrap(`<rect width="${W}" height="${H}" fill="${p[0]}"/>${g}${n}`);
}

function poster(seed: number, p: readonly string[]) {
  const r = rng(seed);
  let s = '';
  const shapes = 7 + Math.floor(r() * 4);
  for (let i = 0; i < shapes; i++) {
    const c = p[Math.floor(r() * p.length)];
    const x = r() * W;
    const y = r() * H;
    const k = r();
    if (k < 0.34) s += `<circle cx="${x}" cy="${y}" r="${60 + r() * 190}" fill="${c}"/>`;
    else if (k < 0.67) s += `<rect x="${x - 120}" y="${y - 120}" width="${100 + r() * 280}" height="${100 + r() * 280}" fill="${c}" transform="rotate(${Math.floor(r() * 90)} ${x} ${y})"/>`;
    else s += `<polygon points="${x},${y - 150} ${x + 150},${y + 110} ${x - 150},${y + 110}" fill="${c}"/>`;
  }
  s += `<circle cx="${W * 0.7}" cy="${H * 0.35}" r="46" fill="none" stroke="${p[4]}" stroke-width="10"/>`;
  return wrap(`<rect width="${W}" height="${H}" fill="${p[0]}"/>${s}`);
}

function orb(seed: number, p: readonly string[]) {
  const r = rng(seed);
  let o = '';
  for (let i = 0; i < 5; i++) {
    const cx = 160 + r() * 880;
    const cy = 120 + r() * 560;
    const rr = 50 + r() * 150;
    o += `<ellipse cx="${cx}" cy="${cy + rr * 0.9}" rx="${rr}" ry="${rr * 0.22}" fill="#000" opacity=".28"/><circle cx="${cx}" cy="${cy}" r="${rr}" fill="url(#o${i})"/>`;
  }
  const defs = [0, 1, 2, 3, 4].map((i) => `<radialGradient id="o${i}" cx=".32" cy=".28" r=".85"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="${p[(i + 2) % 5]}"/><stop offset="1" stop-color="${p[(i + 1) % 5]}"/></radialGradient>`).join('');
  return wrap(`<defs>${defs}<radialGradient id="bg" cx=".5" cy=".4" r=".9"><stop offset="0" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[0]}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/><ellipse cx="600" cy="420" rx="520" ry="120" fill="none" stroke="${p[4]}" stroke-opacity=".35" stroke-width="2" transform="rotate(-14 600 420)"/>${o}`);
}

function chart(seed: number, p: readonly string[]) {
  const r = rng(seed);
  let dots = '';
  for (let i = 0; i < 90; i++) {
    const x = 120 + r() * 960;
    const y = 640 - (x - 120) * 0.45 + (r() - 0.5) * 320;
    dots += `<circle cx="${x}" cy="${Math.max(90, Math.min(700, y))}" r="${3 + r() * 6}" fill="${p[3 + (i % 2)]}" opacity="${0.45 + r() * 0.5}"/>`;
  }
  let bars = '';
  for (let i = 0; i < 14; i++) bars += `<rect x="${120 + i * 70}" y="${760 - (30 + r() * 120)}" width="40" height="${30 + r() * 120}" rx="6" fill="${p[2]}" opacity=".55"/>`;
  return wrap(`<rect width="${W}" height="${H}" fill="${p[0]}"/><path d="M110 700 H1100 M110 100 V700" stroke="${p[3]}" stroke-opacity=".5" stroke-width="2"/>${bars}${dots}<path d="M120 620 C 400 560 640 360 1080 160" fill="none" stroke="${p[4]}" stroke-width="5" stroke-linecap="round"/>`);
}

function portrait(seed: number, p: readonly string[]) {
  const r = rng(seed);
  return wrap(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[2]}"/><stop offset="1" stop-color="${p[3]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/><circle cx="${300 + r() * 120}" cy="200" r="300" fill="${p[4]}" opacity=".25"/><ellipse cx="600" cy="880" rx="360" ry="330" fill="${p[0]}" opacity=".92"/><circle cx="600" cy="360" r="150" fill="${p[1]}" opacity=".96"/><path d="M450 330 C 470 190 730 190 750 330 C 700 270 520 270 450 330Z" fill="${p[0]}" opacity=".9"/>`, 1200, 800);
}

function stripes(seed: number, p: readonly string[]) {
  const r = rng(seed);
  let s = '';
  for (let i = -10; i < 30; i++) s += `<rect x="${i * 60}" y="-100" width="${20 + r() * 34}" height="1100" fill="${p[1 + (i & 3)]}" opacity=".7" transform="rotate(24 600 400)"/>`;
  return wrap(`<rect width="${W}" height="${H}" fill="${p[0]}"/>${s}`);
}

const GENERATORS: Record<ArtKind, (seed: number, p: readonly string[]) => string> = {
  landscape, skyline, elevation, interior, mesh, ui, blueprint, poster, orb, chart, portrait, stripes
};

/** Deterministic artwork for a seed string. */
export function art(kind: ArtKind, seed: string, palette: PaletteName = 'dusk'): string {
  return uri(GENERATORS[kind](hashSeed(`${kind}:${seed}`), pal(palette)));
}
