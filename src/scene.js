// Canvas drawing for the places on the journey, the boat and its captain, and the fishing line.
import { INK } from "./creatures.js";

const TAU = Math.PI * 2, PI = Math.PI;

export const LOOKS = {
  pond:  { sky: ["#8fd8ff", "#e0f7ff"], water: ["#53c5ac", "#1d7a78"], floor: "#b98e55", weed: "#3f9a4a" },
  sea:   { sky: ["#6cc4ff", "#d6f0ff"], water: ["#35a2ea", "#0b4596"], floor: "#f0d49a", weed: "#2e9a6a" },
  reef:  { sky: ["#7fe0ff", "#e8fcff"], water: ["#2fd0d4", "#0b77a3"], floor: "#ffe0a3", weed: "#29a37c" },
  ice:   { sky: ["#bfdcff", "#f3f8ff"], water: ["#4f9fc4", "#163f63"], floor: "#d8e6f2", weed: "#3c8a8a" },
  night: { sky: ["#141c45", "#3a3c8c"], water: ["#253b88", "#080f33"], floor: "#2a3163", weed: "#1f6b6b", dark: true },
  spooky: { sky: ["#2a1650", "#8c3f6e"], water: ["#4a2f7a", "#150b36"], floor: "#3d2f57", weed: "#3f7a4a", dark: true },
};

export const wave = (x, t) => Math.sin(x * .02 + t * 1.6) * 3 + Math.sin(x * .045 - t * 2.1) * 2;
const rnd = i => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); };
function paint(c, fill) { c.fillStyle = fill; c.fill(); c.stroke(); }
function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); }

// One whole place, shifted sideways by off (for sailing from one place to the next). At
// Halloween (spooky) bats fly over every place, the moon turns orange and a jack-o'-lantern floats by.
export function drawScene(c, S, id, t, off = 0, spooky = false) {
  const L = LOOKS[id], { W, H, top } = S, u = S.s / 50;
  c.save();
  c.translate(off, 0);
  c.beginPath(); c.rect(0, 0, W, H); c.clip();
  c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 3;

  let g = c.createLinearGradient(0, 0, 0, top);
  g.addColorStop(0, L.sky[0]); g.addColorStop(1, L.sky[1]);
  c.fillStyle = g; c.fillRect(0, 0, W, top + 20);
  if (L.dark) stars(c, S, t);
  skyFace(c, S, t, L.dark, spooky);
  clouds(c, S, t, L.dark);
  if (spooky) bats(c, S, t);
  DECOR[id]?.above?.(c, S, t, u);

  g = c.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, L.water[0]); g.addColorStop(1, L.water[1]);
  c.beginPath(); c.moveTo(0, H); c.lineTo(0, top);
  for (let x = 0; x <= W + 12; x += 12) c.lineTo(x, top + wave(x, t));
  c.lineTo(W, H); c.closePath();
  c.fillStyle = g; c.fill();
  c.beginPath();
  for (let x = 0; x <= W + 12; x += 12) c.lineTo(x, top + wave(x, t));
  c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 4; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 3;

  if (!L.dark) {
    c.fillStyle = "rgba(255,255,255,.07)";
    for (let i = 0; i < 4; i++) {
      const x = W * (.1 + i * .27) + Math.sin(t * .3 + i) * 20;
      c.beginPath(); c.moveTo(x, top); c.lineTo(x + 60 * u, top); c.lineTo(x + 160 * u, H); c.lineTo(x + 40 * u, H); c.closePath(); c.fill();
    }
  }
  DECOR[id]?.surface?.(c, S, t, u);
  if (spooky && id !== "spooky") {
    const x = S.W * .16 + Math.sin(t * .4) * 10 * u;
    jack(c, x, S.top + wave(x, t) - 6 * u, 14 * u, Math.sin(t * 1.2) * .1, L.dark);
  }

  const base = H - S.s * .45;
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W + 16; x += 16) c.lineTo(x, base - Math.sin(x * .012 + id.length) * S.s * .22);
  c.lineTo(W, H); c.closePath();
  c.fillStyle = L.floor; c.fill();
  for (let i = 0; i < 7; i++) weed(c, W * (.04 + i * .155 + rnd(i + id.length) * .05), base + 4, S.s * (1.4 + rnd(i * 3) * 1.2), t + i, L.weed, u);
  DECOR[id]?.below?.(c, S, t, u, base);
  c.restore();
}

function skyFace(c, S, t, moon, harvest) {
  // high enough to clear the waterline, low enough to clear the bucket
  const r = Math.min(S.top * .2, 44), x = S.W * .14 + r * .4, y = Math.min(Math.max(S.top * .45, 60 + r * 1.6), S.top - r * 1.6);
  c.save();
  if (!moon) {
    c.translate(x, y); c.rotate(t * .2);
    c.strokeStyle = "#ffc93a"; c.lineWidth = 5;
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10; c.beginPath(); c.moveTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25); c.lineTo(Math.cos(a) * r * 1.55, Math.sin(a) * r * 1.55); c.stroke(); }
    c.rotate(-t * .2); c.strokeStyle = INK; c.lineWidth = 3;
    circle(c, 0, 0, r); paint(c, "#ffd84a");
  } else {
    c.translate(x, y);
    c.shadowColor = harvest ? "#ffbf66" : "#fff7c8"; c.shadowBlur = 30;
    circle(c, 0, 0, r); c.fillStyle = harvest ? "#ffb85c" : "#fff4c2"; c.fill();
    c.shadowBlur = 0; c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = harvest ? "#f29a3a" : "#efe0a0";
    for (const [a, b, rr] of [[-.4, .35, .14], [.35, .4, .1], [.1, -.5, .08]]) { circle(c, a * r, b * r, rr * r); c.fill(); }
  }
  c.fillStyle = INK; c.lineWidth = 2.5;
  if (moon) {
    for (const s of [-1, 1]) { c.beginPath(); c.arc(s * r * .32, -r * .12, r * .14, .1 * PI, .9 * PI); c.stroke(); }
  } else {
    for (const s of [-1, 1]) { circle(c, s * r * .32, -r * .15, r * .1); c.fill(); }
  }
  c.beginPath(); c.arc(0, r * .1, r * .4, .2 * PI, .8 * PI); c.stroke();
  c.restore();
}

function stars(c, S, t) {
  for (let i = 0; i < 40; i++) {
    c.globalAlpha = .5 + .5 * Math.sin(t * 2 + i * 7);
    c.fillStyle = "#fff7c8";
    circle(c, rnd(i) * S.W, rnd(i + 100) * S.top * .9, 1 + rnd(i + 200) * 2); c.fill();
  }
  c.globalAlpha = 1;
}

function clouds(c, S, t, dark) {
  const u = Math.max(.6, S.s / 50);
  for (let i = 0; i < 3; i++) {
    const span = S.W + 260 * u, x = (rnd(i + 7) * span + t * (8 + i * 4)) % span - 130 * u, y = S.top * (.2 + i * .17);
    c.fillStyle = dark ? "rgba(160,170,230,.25)" : "rgba(255,255,255,.92)";
    c.beginPath();
    for (const [dx, dy, r] of [[0, 0, 22], [24, -10, 26], [50, 0, 20], [24, 6, 22]]) { c.moveTo(x + (dx + r) * u, y + dy * u); c.arc(x + dx * u, y + dy * u, r * u, 0, TAU); }
    c.fill();
  }
}

// Little bats flapping across the sky, left to right.
function bats(c, S, t) {
  const u = Math.max(.6, S.s / 50);
  for (let i = 0; i < 3; i++) {
    const span = S.W + 120 * u, x = (rnd(i + 20) * span + t * (26 + i * 9)) % span - 60 * u;
    const y = S.top * (.22 + i * .2) + Math.sin(t * 2 + i * 2) * 8 * u;
    bat(c, x, y, (11 + rnd(i + 30) * 4) * u, Math.sin(t * 11 + i * 2));
  }
}
function bat(c, x, y, r, flap) {
  c.save(); c.translate(x, y);
  c.strokeStyle = INK; c.lineWidth = 2.5; c.lineJoin = "round";
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(s * r * .6, -r * .2);
    c.lineTo(s * r * 1.4, -r * (.4 + flap * .9)); c.lineTo(s * r * 2.6, -r * (.1 + flap * 1.1));
    c.quadraticCurveTo(s * r * 2.1, r * .2, s * r * 1.9, r * .5); c.quadraticCurveTo(s * r * 1.5, r * .1, s * r * 1.15, r * .5);
    c.quadraticCurveTo(s * r * .9, r * .1, s * r * .5, r * .4); c.closePath(); paint(c, "#5b3a8c");
  }
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * r * .2, -r * .7); c.lineTo(s * r * .55, -r * 1.25); c.lineTo(s * r * .7, -r * .45); c.closePath(); paint(c, "#5b3a8c"); }
  circle(c, 0, 0, r * .8); paint(c, "#5b3a8c");
  c.fillStyle = "#fff6b0";
  for (const s of [-1, 1]) { circle(c, s * r * .3, -r * .15, r * .17); c.fill(); }
  c.restore();
}

// A smiley jack-o'-lantern, lit from inside when lit is true.
export function jack(c, x, y, r, tilt = 0, lit = true) {
  c.save(); c.translate(x, y); c.rotate(tilt);
  c.beginPath(); c.moveTo(-r * .1, -r * .8); c.lineTo(-r * .2, -r * 1.25); c.lineTo(r * .2, -r * 1.3); c.lineTo(r * .15, -r * .8); c.closePath(); paint(c, "#6d8f2e");
  for (const [dx, rx] of [[-.45, .7], [.45, .7], [0, .6]]) { c.beginPath(); c.ellipse(dx * r, 0, rx * r, r * .9, 0, 0, TAU); paint(c, "#ff8c1a"); }
  c.save();
  c.fillStyle = lit ? "#ffe066" : INK;
  if (lit) { c.shadowColor = "#ffcf3a"; c.shadowBlur = r * .8; }
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * r * .15, -r * .1); c.lineTo(s * r * .55, -r * .1); c.lineTo(s * r * .35, -r * .45); c.closePath(); c.fill(); }
  c.beginPath(); c.moveTo(-r * .55, r * .2); c.quadraticCurveTo(0, r * .75, r * .55, r * .2); c.quadraticCurveTo(0, r * .45, -r * .55, r * .2); c.fill();
  c.restore();
  c.restore();
}

function weed(c, x, y, h, t, colour, u) {
  c.beginPath(); c.moveTo(x, y);
  for (let i = 1; i <= 6; i++) c.lineTo(x + Math.sin(t * 1.4 + i * .8) * 8 * u * i / 3, y - h * i / 6);
  c.save();
  c.lineWidth = 10 * u + 4; c.strokeStyle = INK; c.stroke();
  c.lineWidth = 10 * u; c.strokeStyle = colour; c.stroke();
  c.restore();
}

// ---------- what makes each place itself ----------
const DECOR = {
  pond: {
    above(c, S, t, u) {
      for (const [x0, dir] of [[S.W * .03, 1], [S.W * .97, -1]]) {
        for (let i = 0; i < 4; i++) {
          const x = x0 + dir * i * 14 * u, h = (70 + rnd(i + x0) * 40) * u, sway = Math.sin(t + i) * 4 * u;
          c.beginPath(); c.moveTo(x, S.top + 6); c.quadraticCurveTo(x, S.top - h / 2, x + sway, S.top - h);
          c.lineWidth = 5 * u + 3; c.strokeStyle = INK; c.stroke(); c.lineWidth = 5 * u; c.strokeStyle = "#5aa83c"; c.stroke();
          c.lineWidth = 3; c.strokeStyle = INK;
          c.beginPath(); c.ellipse(x + sway, S.top - h - 10 * u, 6 * u, 13 * u, 0, 0, TAU); paint(c, "#8a5232");
        }
      }
    },
    surface(c, S, t, u) {
      for (const [f, flower] of [[.24, true], [.7, false], [.86, true]]) {
        const x = S.W * f + Math.sin(t * .5 + f * 9) * 6, y = S.top + wave(x, t) + 2;
        c.beginPath(); c.ellipse(x, y, 30 * u, 9 * u, 0, .15, TAU - .15); c.lineTo(x, y); c.closePath(); paint(c, "#5cbf4a");
        if (flower) {
          c.fillStyle = "#ff9ccf";
          for (let i = 0; i < 5; i++) { const a = PI + i * PI / 4; c.beginPath(); c.ellipse(x + 8 * u + Math.cos(a) * 7 * u, y - 4 * u + Math.sin(a) * 6 * u, 6 * u, 3.5 * u, a, 0, TAU); c.fill(); c.stroke(); }
          circle(c, x + 8 * u, y - 5 * u, 3.5 * u); paint(c, "#ffd84a");
        }
      }
    },
  },
  sea: {
    above(c, S, t, u) {
      const x = S.W * .86, y = S.top;
      c.beginPath(); c.ellipse(x, y + 6, 70 * u, 22 * u, 0, PI, TAU); paint(c, "#9aa3ad");
      c.beginPath(); c.moveTo(x - 16 * u, y - 10 * u); c.lineTo(x - 11 * u, y - 100 * u); c.lineTo(x + 11 * u, y - 100 * u); c.lineTo(x + 16 * u, y - 10 * u); c.closePath(); paint(c, "#fff");
      c.save(); c.clip(); c.fillStyle = "#e8473f";
      for (let i = 0; i < 3; i++) c.fillRect(x - 20 * u, y - (30 + i * 28) * u, 40 * u, 13 * u);
      c.restore(); c.stroke();
      c.save(); c.shadowColor = "#fff27a"; c.shadowBlur = 16 + Math.sin(t * 3) * 8;
      c.fillStyle = "#fff27a"; c.fillRect(x - 10 * u, y - 116 * u, 20 * u, 16 * u); c.restore();
      c.strokeRect(x - 10 * u, y - 116 * u, 20 * u, 16 * u);
      c.beginPath(); c.moveTo(x - 14 * u, y - 116 * u); c.lineTo(x, y - 130 * u); c.lineTo(x + 14 * u, y - 116 * u); c.closePath(); paint(c, "#e8473f");
    },
    below(c, S, t, u, base) {
      for (const [f, col] of [[.2, "#f7a9b8"], [.62, "#ffd0a0"], [.84, "#c9b8ff"]]) {
        const x = S.W * f;
        c.beginPath(); c.moveTo(x - 12 * u, base + 2); c.quadraticCurveTo(x, base - 22 * u, x + 12 * u, base + 2); c.closePath(); paint(c, col);
      }
    },
  },
  reef: {
    above(c, S, t, u) {
      const x = S.W * .85, y = S.top;
      c.beginPath(); c.ellipse(x, y + 6, 66 * u, 20 * u, 0, PI, TAU); paint(c, "#ffe0a3");
      c.beginPath(); c.moveTo(x - 6 * u, y - 10 * u); c.quadraticCurveTo(x + 8 * u, y - 60 * u, x + 26 * u, y - 96 * u);
      c.lineWidth = 12 * u + 4; c.stroke(); c.lineWidth = 12 * u; c.strokeStyle = "#a8743c"; c.stroke(); c.strokeStyle = INK; c.lineWidth = 3;
      const tx = x + 26 * u, ty = y - 96 * u;
      for (let i = 0; i < 5; i++) {
        const a = -PI + i * PI / 4 + Math.sin(t + i) * .05;
        c.beginPath(); c.moveTo(tx, ty);
        c.quadraticCurveTo(tx + Math.cos(a) * 30 * u, ty + Math.sin(a) * 30 * u - 14 * u, tx + Math.cos(a) * 52 * u, ty + Math.sin(a) * 40 * u + 18 * u);
        c.quadraticCurveTo(tx + Math.cos(a) * 26 * u, ty + Math.sin(a) * 20 * u, tx, ty);
        paint(c, "#43a046");
      }
      for (const [dx, dy] of [[-5, 6], [6, 8]]) { circle(c, tx + dx * u, ty + dy * u, 6 * u); paint(c, "#7a4a22"); }
    },
    below(c, S, t, u, base) {
      const cols = ["#ff7aa2", "#ffa24a", "#b77cff", "#ff6b5a"];
      for (let i = 0; i < 6; i++) {
        const x = S.W * (.08 + i * .17), h = (40 + rnd(i + 9) * 40) * u, col = cols[i % 4];
        if (i % 3 === 2) { c.beginPath(); c.ellipse(x, base, 24 * u, 16 * u, 0, PI, TAU); paint(c, col); continue; }
        for (const [a, l] of [[-.5, .8], [0, 1], [.5, .7]]) {
          c.beginPath(); c.moveTo(x, base + 4); c.lineTo(x + Math.sin(a) * h * l, base - Math.cos(a) * h * l);
          c.lineWidth = 10 * u + 4; c.strokeStyle = INK; c.stroke(); c.lineWidth = 10 * u; c.strokeStyle = col; c.stroke();
        }
        c.lineWidth = 3; c.strokeStyle = INK;
      }
    },
  },
  ice: {
    above(c, S, t, u) {
      for (const [f, w, h] of [[.9, 80, 90], [.06, 50, 50]]) {
        const x = S.W * f, y = S.top + 4;
        c.beginPath(); c.moveTo(x - w * u, y); c.lineTo(x - w * .5 * u, y - h * .7 * u); c.lineTo(x - w * .1 * u, y - h * u); c.lineTo(x + w * .3 * u, y - h * .6 * u); c.lineTo(x + w * u, y); c.closePath();
        paint(c, "#f4fbff");
        c.beginPath(); c.moveTo(x - w * .1 * u, y - h * u); c.lineTo(x + w * .3 * u, y - h * .6 * u); c.lineTo(x + w * u, y); c.lineTo(x + w * .1 * u, y); c.closePath();
        c.fillStyle = "#cfe6f5"; c.fill();
      }
    },
    surface(c, S, t, u) {
      for (const f of [.3, .66]) {
        const x = S.W * f + Math.sin(t * .4 + f * 7) * 10, y = S.top + wave(x, t);
        c.beginPath(); c.moveTo(x - 18 * u, y + 2); c.lineTo(x - 12 * u, y - 7 * u); c.lineTo(x + 14 * u, y - 6 * u); c.lineTo(x + 20 * u, y + 2); c.closePath(); paint(c, "#f4fbff");
      }
    },
    below(c, S, t) {
      c.fillStyle = "rgba(255,255,255,.85)";
      for (let i = 0; i < 40; i++) {
        const x = (rnd(i) * S.W + Math.sin(t + i) * 12 + S.W) % S.W, y = (rnd(i + 50) * S.H + t * (20 + rnd(i + 3) * 25)) % S.H;
        circle(c, x, y, 1.5 + rnd(i + 9) * 2.5); c.fill();
      }
    },
  },
  night: {
    below(c, S, t) {
      for (let i = 0; i < 30; i++) {
        c.globalAlpha = .3 + .3 * Math.sin(t * 1.5 + i * 3);
        c.fillStyle = i % 2 ? "#7ff5ff" : "#c9a6ff";
        circle(c, rnd(i + 300) * S.W, S.top + 20 + rnd(i + 400) * (S.H - S.top - 40), 1.5 + rnd(i) * 2); c.fill();
      }
      c.globalAlpha = 1;
    },
  },
  spooky: {
    above(c, S, t, u) {
      const x = S.W * .86, y = S.top;
      c.beginPath(); c.ellipse(x, y + 6, 66 * u, 20 * u, 0, PI, TAU); paint(c, "#4a3a5e");
      // a bare, wiggly little tree
      const trunk = (x0, y0, x1, y1, w) => { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 8 * u, (y0 + y1) / 2, x1, y1); c.lineWidth = w + 4; c.strokeStyle = INK; c.stroke(); c.lineWidth = w; c.strokeStyle = "#6b4f7a"; c.stroke(); };
      const tx = x + 18 * u, top = y - 92 * u;
      trunk(tx, y - 8 * u, tx - 6 * u, top, 10 * u);
      trunk(tx - 4 * u, y - 52 * u, tx + 30 * u, y - 78 * u, 5 * u);
      trunk(tx - 6 * u, y - 70 * u, tx - 32 * u, y - 96 * u, 5 * u);
      trunk(tx - 6 * u, top + 4 * u, tx + 8 * u, top - 18 * u, 4 * u);
      c.strokeStyle = INK; c.lineWidth = 3;
      jack(c, x - 30 * u, y - 14 * u, 18 * u, Math.sin(t) * .04, true);
    },
    surface(c, S, t, u) {
      for (const f of [.24, .68]) {
        const x = S.W * f + Math.sin(t * .5 + f * 9) * 8 * u;
        jack(c, x, S.top + wave(x, t) - 6 * u, 13 * u, Math.sin(t * 1.3 + f * 5) * .12, true);
      }
    },
    below(c, S, t, u, base) {
      for (let i = 0; i < 5; i++) {
        const x = S.W * (.12 + i * .19 + rnd(i + 60) * .05), y = base + 4 * u, h = 22 * u, w = 16 * u;
        c.save(); c.translate(x, y); c.rotate((rnd(i + 70) - .5) * .8);
        c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(0, -h); c.lineTo(w / 2, 0); c.closePath();
        c.save(); c.clip();
        c.fillStyle = "#ffd23f"; c.fillRect(-w, -h * .4, w * 2, h * .4);
        c.fillStyle = "#ff8c1a"; c.fillRect(-w, -h * .75, w * 2, h * .35);
        c.fillStyle = "#fff"; c.fillRect(-w, -h, w * 2, h * .25);
        c.restore(); c.stroke();
        c.restore();
      }
      for (let i = 0; i < 24; i++) {
        c.globalAlpha = .3 + .3 * Math.sin(t * 1.5 + i * 3);
        c.fillStyle = i % 2 ? "#9dff7a" : "#ffb85c";
        circle(c, rnd(i + 500) * S.W, S.top + 20 + rnd(i + 600) * (S.H - S.top - 40), 1.5 + rnd(i) * 2); c.fill();
      }
      c.globalAlpha = 1;
    },
  },
};

// ---------- the boat ----------
// Draws the boat bobbing on the waterline, with the captain (a bear in a rain hat) holding the
// rod. Returns where the rod tip is this frame, for the fishing line.
export function drawBoat(c, B, t, honk = 0, spooky = false) {
  const { x, y, k } = B, bob = Math.sin(t * 2) * 3 * k, tilt = Math.sin(t * 1.6) * .03;
  c.save();
  c.translate(x, y + bob); c.rotate(tilt); c.scale(k, k);
  c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4;

  c.beginPath(); c.moveTo(-66, -18); c.lineTo(-66, -74); c.stroke();
  c.beginPath(); c.moveTo(-66, -74); c.lineTo(-38, -66 + Math.sin(t * 5) * 3); c.lineTo(-66, -56); c.closePath(); paint(c, "#ffd23f");

  // captain
  c.beginPath(); c.ellipse(-8, -30, 24, 22, 0, 0, TAU); paint(c, "#ffd23f");
  const hy = -62 - honk * 6;
  for (const s of [-1, 1]) { circle(c, -8 + s * 17, hy - 17, 8); paint(c, "#b07a4a"); }
  circle(c, -8, hy, 22); paint(c, "#b07a4a");
  c.beginPath(); c.ellipse(-1, hy + 7, 11, 8, 0, 0, TAU); paint(c, "#e6c49a");
  circle(c, 0, hy + 3, 4); c.fillStyle = INK; c.fill();
  for (const ex of [-15, 3]) { circle(c, ex, hy - 6, 3.2); c.fill(); }
  if (honk > 0) { circle(c, 0, hy + 12, 4 + honk * 3); paint(c, "#7a2a2a"); }
  else { c.beginPath(); c.arc(0, hy + 9, 5, .15 * PI, .85 * PI); c.stroke(); }
  c.fillStyle = "rgba(255,105,135,.45)";
  for (const ex of [-20, 10]) { c.beginPath(); c.ellipse(ex, hy + 4, 4, 2.5, 0, 0, TAU); c.fill(); }
  if (spooky) {
    // a witch's hat, with a floppy tip
    const flop = Math.sin(t * 2.2) * 3;
    c.beginPath(); c.ellipse(-8, hy - 17, 33, 7, 0, 0, TAU); paint(c, "#6a3fb5");
    const cone = () => {
      c.beginPath(); c.moveTo(-26, hy - 18); c.quadraticCurveTo(-16, hy - 40, -12, hy - 58);
      c.quadraticCurveTo(-2, hy - 66, 10 + flop, hy - 58); c.quadraticCurveTo(-2, hy - 52, 10, hy - 18); c.closePath();
    };
    cone(); paint(c, "#6a3fb5");
    c.save(); cone(); c.clip(); c.fillStyle = "#ff8c1a"; c.fillRect(-30, hy - 29, 44, 8); c.restore();
    cone(); c.stroke();
    c.fillStyle = "#ffd23f"; c.fillRect(-12, hy - 29, 8, 8); c.strokeRect(-12, hy - 29, 8, 8);
  } else {
    c.beginPath(); c.ellipse(-8, hy - 16, 20, 15, 0, PI, TAU); c.closePath(); paint(c, "#ffd23f");
    c.beginPath(); c.ellipse(-8, hy - 16, 31, 7, 0, 0, TAU); paint(c, "#ffd23f");
  }
  if (spooky) { c.lineWidth = 3; jack(c, 56, -32, 13, 0, true); c.lineWidth = 4; }

  // hull
  c.beginPath(); c.moveTo(-80, -14); c.lineTo(80, -14); c.lineTo(62, 18); c.quadraticCurveTo(0, 26, -62, 18); c.closePath(); paint(c, "#e8473f");
  c.save(); c.clip(); c.strokeStyle = "#fff"; c.lineWidth = 6; c.beginPath(); c.moveTo(-80, -2); c.lineTo(80, -2); c.stroke(); c.restore();
  c.beginPath(); c.moveTo(-84, -20); c.lineTo(84, -20); c.lineTo(84, -13); c.lineTo(-84, -13); c.closePath(); paint(c, "#fff");

  // rod and paw
  c.beginPath(); c.moveTo(4, -30); c.lineTo(100, -125);
  c.lineWidth = 9; c.stroke(); c.lineWidth = 5; c.strokeStyle = "#c98a4a"; c.stroke();
  c.lineWidth = 4; c.strokeStyle = INK;
  circle(c, 92, -117, 5); paint(c, "#ccd3df");
  circle(c, 12, -36, 8); paint(c, "#b07a4a");
  c.restore();

  const cs = Math.cos(tilt), sn = Math.sin(tilt);
  return { x: x + (100 * cs + 125 * sn) * k, y: y + bob + (100 * sn - 125 * cs) * k };
}

// The fishing line from the rod tip to the hook, with a bobber at the waterline and a worm.
export function drawLine(c, S, tip, hook, t, worm = true) {
  const k = S.s / 50, mx = (tip.x + hook.x) / 2, my = (tip.y + hook.y) / 2 + 20 * k;
  c.save();
  c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(tip.x, tip.y); c.quadraticCurveTo(mx, my, hook.x, hook.y);
  c.strokeStyle = "rgba(29,43,79,.8)"; c.lineWidth = 2; c.stroke();
  if (hook.y > S.top + 8 && tip.y < S.top) {
    const p = (S.top - tip.y) / (hook.y - tip.y);
    const bx = (1 - p) ** 2 * tip.x + 2 * (1 - p) * p * mx + p * p * hook.x, by = S.top + wave(bx, t);
    c.strokeStyle = INK; c.lineWidth = 2.5;
    circle(c, bx, by, 7 * k); paint(c, "#fff");
    c.beginPath(); c.arc(bx, by, 7 * k, PI, TAU); paint(c, "#e8473f");
  }
  c.strokeStyle = "#8a93a6"; c.lineWidth = 3.5 * Math.max(.7, k);
  c.beginPath(); c.moveTo(hook.x, hook.y); c.lineTo(hook.x, hook.y + 12 * k); c.arc(hook.x - 5 * k, hook.y + 12 * k, 5 * k, 0, PI); c.stroke();
  if (worm) {
    c.beginPath();
    for (let i = 0; i <= 8; i++) c.lineTo(hook.x - 5 * k + Math.sin(t * 8 + i) * 3 * k, hook.y + 12 * k + i * 2 * k);
    c.strokeStyle = "#ff8fab"; c.lineWidth = 4 * k; c.stroke();
  }
  c.restore();
}
