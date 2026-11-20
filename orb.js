// Маскот-шар KamaHealth: мягкий светящийся шар с минимальным лицом. Цвет и лицо перетекают по настроению.
(function (root) {
'use strict';
// ─── настроения: цвет и лицо (все числа в единицах радиуса глаза и рта) ───
const MOODS = {
  joy:      { name: 'Радость',   c: '#F6C443', eyeR: 17, topCut: 0,    tilt: 0,    botCut: .36, botCurve: 0,   mW: 26, mCurve: 1,    mT: 5.2, wave: 0, spark: 0 },
  calm:     { name: 'Спокоен',   c: '#5BB4F4', eyeR: 16, topCut: 0,  tilt: 0,    botCut: .32,  botCurve: 0,   mW: 17, mCurve: .45,  mT: 4.2, wave: 0, spark: 0 },
  sad:      { name: 'Грусть',    c: '#6CB9F7', eyeR: 17, topCut: .2,   tilt: -.75, botCut: .34, botCurve: 0,   mW: 19, mCurve: -.75, mT: 4.6, wave: 0, spark: 0 },
  worry:    { name: 'Тревога',   c: '#EF8A4A', eyeR: 17, topCut: 0,    tilt: 0,    botCut: .36, botCurve: 0,   mW: 34, mCurve: -.08, mT: 4.4, wave: 0, spark: 0 },
  tired:    { name: 'Устал',     c: '#7C84D6', eyeR: 17, topCut: .56,  tilt: 0,    botCut: .36, botCurve: 0,   mW: 19, mCurve: -.3,  mT: 4.2, wave: 0, spark: 0 },
  angry:    { name: 'Сердит',    c: '#D25450', eyeR: 17, topCut: .3,   tilt: .85,  botCut: .34, botCurve: 0,   mW: 19, mCurve: -.65, mT: 5,   wave: 0, spark: 0 },
  fear:     { name: 'Страх',     c: '#C9AAE8', eyeR: 15, topCut: .38,  tilt: -.3,  botCut: .44, botCurve: 0,   mW: 17, mCurve: 0,    mT: 3.8, wave: 1, spark: 0 },
  proud:    { name: 'Гордится',  c: '#3DA6D4', eyeR: 19, topCut: 0,    tilt: 0,    botCut: .12, botCurve: 0,   mW: 10, mCurve: 1,    mT: 4.4, wave: 0, spark: 1 },
  shy:      { name: 'Смущён',    c: '#E2609C', eyeR: 18, topCut: 0,    tilt: 0,    botCut: .38,  botCurve: 0,   mW: 0,  mCurve: 0,    mT: 0,   wave: 0, spark: 0, look: [0.15, -0.9] },
  happy:    { name: 'Доволен',   c: '#4CC27C', eyeR: 17, topCut: 0,    tilt: 0,    botCut: .2,  botCurve: .9,  mW: 22, mCurve: .9,   mT: 5,   wave: 0, spark: 0 },
};
const KEYS = ['eyeR', 'topCut', 'tilt', 'botCut', 'botCurve', 'mW', 'mCurve', 'mT', 'wave', 'spark'];
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const f = (n) => Math.round(n * 100) / 100;

// пружина
const sp = (x, k, c) => ({ x, v: 0, t: x, k: k || 170, c: c || 18 });
const stepS = (s, dt) => { s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt; s.x += s.v * dt; };

function makeOrb(svg, mood, opts) {
  const o = Object.assign({ uid: Math.random().toString(36).slice(2, 7), label: true }, opts || {});
  const m0 = MOODS[mood];
  const S = {}; for (const k of KEYS) S[k] = sp(m0[k], 150, 17);
  const col = hex2rgb(m0.c).map((v) => sp(v, 60, 15));
  const glow = sp(o.light || 0, 60, 15), lookX = sp(0, 120, 16), lookY = sp(0, 120, 16), sqx = sp(1, 260, 13), sqy = sp(1, 260, 13), lift = sp(0, 140, 14);
  const st = { mood, t: Math.random() * 10, blinkAt: 1 + Math.random() * 3, blink0: -1, pointer: null, pointerAt: -9 };
  const set = (name) => { const m = MOODS[name]; if (!m) return; st.mood = name; for (const k of KEYS) S[k].t = m[k]; hex2rgb(m.c).forEach((v, i) => (col[i].t = v)); if (!m.look) { lookX.t = 0; lookY.t = 0; } sqx.v += 1.4; sqy.v -= 1.4; };
  const poke = () => { sqx.v += 3.2; sqy.v -= 3.6; lift.v -= 120; st.blink0 = st.t; };

  function eyePath(cx, cy, r, side, blink) {
    const top0 = -r + (S.topCut.x + blink * (1 - S.topCut.x)) * 2 * r, bot0 = r - S.botCut.x * 2 * r, N = 44, P = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, x = Math.cos(a) * r; let y = Math.sin(a) * r;
      const u = x * -side; // к центру лица
      const yT = top0 + S.tilt.x * u * 0.75, yB = bot0 - S.botCurve.x * r * 0.9 * (1 - (x / r) ** 2);
      const K = r * 0.32, smax = (p, q) => (p + q + Math.sqrt((p - q) ** 2 + K * K)) / 2, smin = (p, q) => (p + q - Math.sqrt((p - q) ** 2 + K * K)) / 2; // мягкий срез: скруглённые углы
      y = smax(y, yT); y = smin(y, yB);
      if (yB - yT < 2.6) y = (yT + yB) / 2 + (Math.sin(a) > 0 ? 1.3 : -1.3);
      P.push([cx + x, cy + y]);
    }
    let d = `M${f(P[0][0])} ${f(P[0][1])}`;
    for (let i = 0; i < N; i++) { const a = P[(i - 1 + N) % N], b = P[i], c = P[(i + 1) % N], e = P[(i + 2) % N]; d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`; }
    return d + 'Z';
  }
  function mouthPath(cx, cy) {
    const w = S.mW.x * 1.15; if (w < 1.5 || S.mT.x < 0.4) return '';
    const N = 24, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, x = -w + 2 * w * u, y = S.mCurve.x * (1 - (x / w) ** 2) * w * 0.34 + S.wave.x * Math.sin(u * Math.PI * 4) * 2.6;
      const t = S.mT.x * 1.75 * (0.32 + 0.68 * Math.sin(Math.PI * u) ** 0.7) / 2;
      const dy = -S.mCurve.x * 2 * x / (w * w) * w * 0.34, len = Math.hypot(1, dy), nx = -dy / len, ny = 1 / len;
      top.push([cx + x - nx * t, cy + y - ny * t]); bot.push([cx + x + nx * t, cy + y + ny * t]);
    }
    const cap = S.mT.x * 1.75 * 0.32 / 2;
    let d = `M${f(top[0][0])} ${f(top[0][1])}`; for (let i = 1; i <= N; i++) d += `L${f(top[i][0])} ${f(top[i][1])}`;
    d += `A${f(cap)} ${f(cap)} 0 0 1 ${f(bot[N][0])} ${f(bot[N][1])}`; for (let i = N - 1; i >= 0; i--) d += `L${f(bot[i][0])} ${f(bot[i][1])}`;
    return d + `A${f(cap)} ${f(cap)} 0 0 1 ${f(top[0][0])} ${f(top[0][1])}Z`;
  }
  function spark(x, y, s) { if (s < 0.05) return ''; const r = 5.5 * s, q = 1.2 * s; return `<path d="M${f(x)} ${f(y - r)}Q${f(x + q)} ${f(y - q)} ${f(x + r)} ${f(y)}Q${f(x + q)} ${f(y + q)} ${f(x)} ${f(y + r)}Q${f(x - q)} ${f(y + q)} ${f(x - r)} ${f(y)}Q${f(x - q)} ${f(y - q)} ${f(x)} ${f(y - r)}Z" fill="#fff"/>`; }

  function step(dt) {
    st.t += dt;
    const m = MOODS[st.mood];
    if (st.pointer && st.t - st.pointerAt < 1.2) { lookX.t = Math.max(-1, Math.min(1, st.pointer[0])); lookY.t = Math.max(-1, Math.min(1, st.pointer[1])); }
    else if (m.look) { lookX.t = m.look[0]; lookY.t = m.look[1]; }
    else { lookX.t = 0.12 * Math.sin(st.t * 0.37); lookY.t = 0.08 * Math.sin(st.t * 0.29 + 1); }
    if (st.blink0 < 0 && st.t > st.blinkAt) st.blink0 = st.t;
    for (const k of KEYS) stepS(S[k], dt); col.forEach((c) => stepS(c, dt)); [lookX, lookY, sqx, sqy, lift, glow].forEach((s) => stepS(s, dt));
    sqx.t = 1; sqy.t = 1; lift.t = 0;
  }
  function render() {
    let blink = 0; if (st.blink0 >= 0) { const e = st.t - st.blink0; if (e < 0.07) blink = e / 0.07; else if (e < 0.11) blink = 1; else if (e < 0.22) blink = 1 - (e - 0.11) / 0.11; else { st.blink0 = -1; st.blinkAt = st.t + 2.2 + Math.random() * 3.5; } }
    const c = mix(col.map((s) => Math.max(0, Math.min(255, s.x))), [255, 255, 255], Math.max(0, Math.min(0.9, glow.x))), light = mix(c, [255, 255, 255], 0.5), deep = mix(c, [20, 20, 40], 0.16);
    const breathe = 1 + 0.012 * Math.sin(st.t * 1.6), R = 104 * breathe, cx = 150, cy = 148 + lift.x * 0.12, U = o.uid;
    const sx = sqx.x, sy = sqy.x, gx = lookX.x, gy = lookY.x;
    // лицо скользит по поверхности шара: при взгляде вбок сжимается по ширине, как на сфере
    const fx = cx + gx * R * 0.3, fy = cy - R * 0.6 + gy * R * 0.2, fs = 1 - Math.abs(gx) * 0.16, er = S.eyeR.x * 1.4, gap = er + 11;
    const face = `<g transform="translate(${f(fx)} ${f(fy)}) scale(${f(fs)} ${f(1 - Math.abs(gy) * 0.1)})" fill="#121212">
<path d="${eyePath(-gap, 0, er, -1, blink)}"/><path d="${eyePath(gap, 0, er, 1, blink)}"/>
${spark(-gap + er * 0.35, -er * 0.35, S.spark.x)}${spark(gap + er * 0.35, -er * 0.35, S.spark.x)}
<path d="${mouthPath(0, er + 11)}"/></g>`;
    const label = o.label ? `<text x="${cx}" y="${f(cy + R * 0.2)}" text-anchor="middle" font-size="15" font-weight="500" fill="${rgb(mix(c, [30, 30, 50], 0.25))}" opacity=".85">${MOODS[st.mood].name}</text>` : '';
    svg.innerHTML = `<defs>
<radialGradient id="g${U}" cx="40%" cy="30%" r="78%"><stop offset="0" stop-color="${rgb(light)}"/><stop offset=".5" stop-color="${rgb(c)}"/><stop offset="1" stop-color="${rgb(deep)}"/></radialGradient>
<radialGradient id="m${U}"><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<mask id="k${U}"><circle cx="${cx}" cy="${f(cy)}" r="${f(R * 1.12)}" fill="url(#m${U})"/></mask>
<filter id="b${U}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="s${U}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
</defs>
<g transform="translate(${cx} ${f(cy + R)}) scale(${f(sx)} ${f(sy)}) translate(${-cx} ${f(-cy - R)})">
<circle cx="${cx}" cy="${f(cy + 6)}" r="${f(R * 1.1)}" fill="${rgb(c)}" opacity=".42" filter="url(#b${U})"/>
<g mask="url(#k${U})" filter="url(#s${U})"><circle cx="${cx}" cy="${f(cy)}" r="${f(R * 1.06)}" fill="url(#g${U})"/></g>
${label}${face}</g>`;
  }
  return { set, poke, step, render, st, setLight: (v) => { glow.t = v; }, pointer: (p) => { st.pointer = p; st.pointerAt = st.t; } };
}
root.KamaOrb = { MOODS, makeOrb, hex2rgb, mix, rgb };
})(typeof globalThis !== 'undefined' ? globalThis : this);
