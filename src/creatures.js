// Canvas drawings of everything that can end up on the hook. Each is drawn facing right in a box
// about 100 units across, centred on its body, then scaled and flipped into place.
import { CREATURES } from "./sea.js";

export const INK = "#1d2b4f";
const TAU = Math.PI * 2, PI = Math.PI;

// o: dir (1 faces right, -1 left), t (seconds, for wiggles), wig (how much it wiggles),
// tilt (radians), puff (pufferfish, 0..1), spin (starfish), glow (night sea), show (being shown off).
export function drawCreature(c, kind, x, y, size, o = {}) {
  const k = CREATURES[kind];
  c.save();
  c.translate(x, y);
  c.scale((o.dir || 1) * size / 50, size / 50);
  if (o.tilt) c.rotate(o.tilt);
  c.lineWidth = 4; c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = INK;
  SHAPES[k.shape](c, k, o.t || 0, o.wig ?? 1, o);
  if (k.junk && o.show) stink(c, o.t || 0);
  c.restore();
}

// ---------- bits ----------
function paint(c, fill) { c.fillStyle = fill; c.fill(); c.stroke(); }
function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); }
function oval(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); }
function box(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
// A googly eye: the pupil jiggles about.
function eye(c, x, y, r, t) {
  const lw = c.lineWidth;
  c.lineWidth = r < 9 ? 3 : 4;
  circle(c, x, y, r); paint(c, "#fff");
  const jx = Math.sin(t * 3.1 + x) * r * .15, jy = Math.cos(t * 2.3 + y) * r * .15;
  circle(c, x + r * .25 + jx, y + jy, r * .5); c.fillStyle = INK; c.fill();
  circle(c, x + r * .4 + jx, y - r * .18 + jy, r * .16); c.fillStyle = "#fff"; c.fill();
  c.lineWidth = lw;
}
function smile(c, x, y, r, a0 = .15, a1 = .85) { c.beginPath(); c.arc(x, y, r, a0 * PI, a1 * PI); c.stroke(); }
function cheek(c, x, y, r) { oval(c, x, y, r, r * .6); c.fillStyle = "rgba(255,105,135,.45)"; c.fill(); }
// Two-tone stroke for legs and tentacles: an ink outline with colour inside.
function limb(c, colour, w = 7) {
  c.lineWidth = w + 6; c.strokeStyle = INK; c.stroke();
  c.lineWidth = w; c.strokeStyle = colour; c.stroke();
  c.lineWidth = 4; c.strokeStyle = INK;
}
function stink(c, t) {
  c.save();
  c.strokeStyle = "#8fc93a"; c.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const x = -22 + i * 22, rise = (t * 30 + i * 12) % 36;
    c.globalAlpha = 1 - rise / 36;
    c.beginPath();
    for (let j = 0; j <= 6; j++) c.lineTo(x + Math.sin(j * 1.3 + t * 4) * 5, -50 - rise - j * 5);
    c.stroke();
  }
  c.restore();
}

// ---------- fish and their funny extras ----------
const fishBody = c => oval(c, 0, 0, 40, 28);

function fish(c, k, t, wig, o) {
  const wag = Math.sin(t * 9) * .3 * wig, ex = k.extras || [];
  c.save(); c.translate(-34, 0); c.rotate(wag);
  c.beginPath(); c.moveTo(6, 0); c.lineTo(-20, -22); c.quadraticCurveTo(-12, 0, -20, 22); c.closePath(); paint(c, k.fin);
  c.restore();
  if (ex.includes("wings")) for (const [x, s, l] of [[2, -1, .8], [-6, 1, 1]]) batWing(c, x, -20, s, l, t, wig, k.fin);
  c.beginPath(); c.moveTo(-18, -20); c.quadraticCurveTo(-8, -44, 14, -25); c.closePath(); paint(c, k.fin);
  fishBody(c); paint(c, k.body);
  if (k.stripes) {
    c.save(); fishBody(c); c.clip();
    for (const x of [-16, 8]) { oval(c, x, 0, 6, 32); paint(c, "#fff"); }
    c.restore(); fishBody(c); c.stroke();
  }
  if (k.ribs) {
    c.save(); fishBody(c); c.clip();
    c.strokeStyle = k.ribs; c.lineWidth = 3;
    for (const [x, rx] of [[-24, 10], [-6, 7], [12, 10]]) { c.beginPath(); c.ellipse(x, 0, rx, 30, 0, -PI / 2, PI / 2, x > 0); c.stroke(); }
    c.restore();
  }
  if (k.spots) {
    c.fillStyle = k.spots;
    for (const [x, y, r] of [[-22, -6, 4], [-10, -15, 3], [-14, 7, 3.5], [2, -19, 2.5]]) { circle(c, x, y, r); c.fill(); }
  }
  oval(c, -6, -13, 15, 5, -.15); c.fillStyle = "rgba(255,255,255,.35)"; c.fill();
  c.save(); c.translate(-2, 6); c.rotate(.5 - wag);
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-10, -7, -20, 2); c.quadraticCurveTo(-10, 9, 0, 0); paint(c, k.fin);
  c.restore();
  if (ex.includes("sleep")) {
    c.beginPath(); c.arc(20, -9, 7, .1 * PI, .9 * PI); c.stroke();
    circle(c, 33, 9, 3 + Math.sin(t * 2) * 1.2); paint(c, "#ff8fa3");
  } else eye(c, 20, -7, 10, t);
  if (ex.includes("lamp")) teeth(c);
  else if (!ex.includes("moustache") && !ex.includes("sleep")) smile(c, 28, 4, 8, .1, .7);
  cheek(c, 12, 10, 6);
  for (const e of ex) EXTRA[e](c, k, t, o);
}

// A bat's wing, hinged at (x, y) on the fish's back. s = 1 sweeps it back, -1 forward.
function batWing(c, x, y, s, l, t, wig, fill) {
  c.save(); c.translate(x, y); c.scale(s * l, l); c.rotate(Math.sin(t * 10) * .35 * wig - .1);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(-8, -30); c.lineTo(-38, -40);
  c.quadraticCurveTo(-30, -30, -28, -16); c.quadraticCurveTo(-22, -24, -15, -12); c.quadraticCurveTo(-9, -18, 2, -2); c.closePath();
  c.lineWidth = 4 / l; paint(c, fill);
  c.restore();
}

function teeth(c) {
  c.beginPath(); c.moveTo(20, 6); c.quadraticCurveTo(30, 22, 41, 3); c.closePath(); paint(c, "#4a1a3a");
  c.fillStyle = "#fff";
  for (let i = 0; i < 3; i++) {
    const x = 22 + i * 6, y = 6 - (x - 20) * 3 / 21;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2.5, y + 5); c.lineTo(x + 5, y - .7); c.fill();
  }
}

const EXTRA = {
  bow(c) {
    c.fillStyle = "#ff5fa2";
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(2, -27); c.lineTo(2 + s * 15, -38); c.lineTo(2 + s * 15, -17); c.closePath(); c.fill(); c.stroke(); }
    circle(c, 2, -27, 5); c.fill(); c.stroke();
  },
  cat(c, k) {
    for (const [a, b, d] of [[[-4, -24], [4, -44], [14, -26]], [[14, -25], [26, -42], [31, -18]]]) {
      c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...d); c.closePath(); paint(c, k.body);
      c.beginPath(); c.moveTo(a[0] + 4, a[1] - 2); c.lineTo(b[0], b[1] + 8); c.lineTo(d[0] - 4, d[1] - 2); c.closePath();
      c.fillStyle = "#ffb3c7"; c.fill();
    }
    c.lineWidth = 2.5;
    for (const [y0, x1, y1] of [[5, 55, -1], [8, 56, 9], [11, 54, 18]]) { c.beginPath(); c.moveTo(37, y0); c.lineTo(x1, y1); c.stroke(); }
    c.beginPath(); c.moveTo(36, 0); c.lineTo(43, 0); c.lineTo(39.5, 5); c.closePath(); paint(c, "#ff8fab");
    c.lineWidth = 4;
  },
  shades(c) {
    box(c, 7, -19, 30, 17, 7); c.fillStyle = INK; c.fill();
    c.beginPath(); c.moveTo(8, -13); c.lineTo(-6, -15); c.stroke();
    c.strokeStyle = "#7fe3ff"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(13, -14); c.lineTo(18, -8); c.moveTo(20, -15); c.lineTo(23, -11); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 4;
  },
  clown(c) {
    for (const [x, y, col] of [[-10, -28, "#4fc3ff"], [2, -33, "#7ddc5a"], [14, -28, "#c77dff"]]) { circle(c, x, y, 8); paint(c, col); }
    circle(c, 42, 2, 8); paint(c, "#ff3b3b");
    circle(c, 44, -1, 2.5); c.fillStyle = "#fff"; c.fill();
  },
  hat(c) {
    c.beginPath(); c.moveTo(-16, -24); c.quadraticCurveTo(5, -78, 26, -22); c.closePath(); paint(c, "#e8473f");
    c.strokeStyle = "#fff"; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-6, -40); c.lineTo(16, -40); c.stroke();
    c.strokeStyle = INK;
    box(c, -18, -30, 46, 11, 5); paint(c, "#fff");
    circle(c, 5, -53, 7); paint(c, "#fff");
  },
  lamp(c, k, t, o) {
    c.beginPath(); c.moveTo(12, -26); c.quadraticCurveTo(30, -62, 50, -46); c.stroke();
    c.save();
    c.shadowColor = "#fff59a"; c.shadowBlur = o.glow ? 30 : 14;
    circle(c, 51, -40, 7 + Math.sin(t * 4) * .8); c.fillStyle = "#fff27a"; c.fill();
    c.restore();
    c.stroke();
  },
  crown(c) {
    c.beginPath(); c.moveTo(-14, -23); c.lineTo(-16, -46); c.lineTo(-6, -35); c.lineTo(2, -50); c.lineTo(10, -35); c.lineTo(20, -46); c.lineTo(18, -23); c.closePath();
    paint(c, "#ffcf26");
    circle(c, 2, -30, 3.5); paint(c, "#ff3b6b");
  },
  moustache(c) {
    c.fillStyle = "#5b3a1f";
    for (const s of [-1, 1]) {
      oval(c, 33 + s * 7, 9, 8, 4, s * .45); c.fill();
      circle(c, 33 + s * 14, 5, 3); c.fill();
    }
  },
  sleep(c) {
    c.beginPath(); c.moveTo(-12, -21); c.quadraticCurveTo(8, -34, 26, -19); c.quadraticCurveTo(4, -58, -40, -46); c.quadraticCurveTo(-20, -40, -12, -21); c.closePath();
    paint(c, "#5a6fd6");
    c.fillStyle = "#ffe066";
    for (const [x, y] of [[-2, -34], [-18, -42], [10, -27]]) { circle(c, x, y, 2.5); c.fill(); }
    circle(c, -40, -46, 6); paint(c, "#fff");
  },
  stem(c) {
    c.beginPath(); c.moveTo(4, -26); c.quadraticCurveTo(2, -36, -2, -42); c.lineTo(6, -44); c.quadraticCurveTo(10, -36, 12, -27); c.closePath(); paint(c, "#6d8f2e");
    c.beginPath(); c.ellipse(20, -38, 9, 4.5, -.4, 0, TAU); paint(c, "#7ddc5a");
    c.save(); c.strokeStyle = "#5aa83c"; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(8, -40); c.bezierCurveTo(-2, -52, -12, -40, -4, -36); c.stroke();
    c.restore();
  },
  wings() {},   // drawn behind the body, in fish()
  fangs(c) {
    c.fillStyle = "#fff"; c.lineWidth = 2;
    for (const [x, y] of [[26.5, 11.7], [32.5, 10.4]]) { c.beginPath(); c.moveTo(x - 2.6, y - 1); c.lineTo(x, y + 6); c.lineTo(x + 2.6, y - 1); c.closePath(); c.fill(); c.stroke(); }
    c.lineWidth = 4;
  },
  horn(c) {
    c.beginPath(); c.moveTo(36, -10); c.lineTo(86, -24); c.lineTo(39, 0); c.closePath(); paint(c, "#fff4cf");
    c.lineWidth = 2.5;
    for (const x of [48, 58, 68, 77]) { c.beginPath(); c.moveTo(x, -16 - (x - 40) * .22); c.lineTo(x + 3, -6 - (x - 40) * .3); c.stroke(); }
    c.lineWidth = 4;
  },
};

// ---------- everyone else ----------
function puffer(c, k, t, wig, o) {
  const p = o.puff || 0, r = 28 + p * 16, n = 14;
  c.save(); c.translate(-r + 2, 0); c.rotate(Math.sin(t * 9) * .3 * wig);
  c.beginPath(); c.moveTo(4, 0); c.lineTo(-14, -13); c.lineTo(-14, 13); c.closePath(); paint(c, "#e8b93e");
  c.restore();
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + .1, l = r + 7 + p * 7;
    c.beginPath(); c.moveTo(Math.cos(a - .14) * r, Math.sin(a - .14) * r); c.lineTo(Math.cos(a) * l, Math.sin(a) * l); c.lineTo(Math.cos(a + .14) * r, Math.sin(a + .14) * r);
    paint(c, "#e8b93e");
  }
  circle(c, 0, 0, r); paint(c, k.body);
  oval(c, 0, r * .42, r * .7, r * .38); c.fillStyle = "#fff3c4"; c.fill();
  c.fillStyle = "#c98f2a";
  for (const [x, y] of [[-.5, -.4], [-.15, -.6], [-.6, .05], [.1, -.75]]) { circle(c, x * r, y * r, 2.5 + p); c.fill(); }
  eye(c, r * .42, -r * .25, 9 + p * 3, t);
  circle(c, r * .8, r * .18, 3 + p * 2.5); paint(c, "#ff8a8a");
  cheek(c, r * .25, r * .2, 6);
}

function crab(c, k, t, wig) {
  const snap = (Math.sin(t * 8) * .5 + .5) * .7 * wig + .15;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      c.beginPath(); c.moveTo(s * 22, 4 + i * 6); c.lineTo(s * (36 + i * 3), 10 + i * 7); c.lineTo(s * (40 + i * 2), 26 + i * 4);
      limb(c, k.body, 5);
    }
    c.beginPath(); c.moveTo(s * 22, -6); c.lineTo(s * 36, -22); limb(c, k.body, 6);
    c.save(); c.translate(s * 38, -32); c.scale(s, 1);
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 13, -PI / 2 + snap, -PI / 2 - snap + TAU); c.closePath(); paint(c, k.body);
    c.restore();
  }
  oval(c, 0, 0, 34, 22); paint(c, k.body);
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 9, -18); c.lineTo(s * 12, -32); c.stroke(); eye(c, s * 12, -37, 8, t); }
  smile(c, 0, -2, 12);
  cheek(c, -18, 4, 6); cheek(c, 18, 4, 6);
}

function octopus(c, k, t, wig) {
  for (let i = 0; i < 6; i++) {
    const x0 = -25 + i * 10, w = Math.sin(t * 5 + i) * 8 * wig, f = (i - 2.5) * 5;
    c.beginPath(); c.moveTo(x0, 6); c.bezierCurveTo(x0 + w + f * .4, 22, x0 - w + f, 32, x0 + f * 1.4 + w * .6, 44);
    limb(c, k.body, 8);
  }
  oval(c, 0, -10, 32, 30); paint(c, k.body);
  c.fillStyle = "#d39cf2";
  for (const [x, y, r] of [[-16, -26, 4], [-6, -32, 3], [18, -24, 3.5]]) { circle(c, x, y, r); c.fill(); }
  eye(c, -11, -10, 9, t); eye(c, 11, -10, 9, t);
  smile(c, 0, 2, 9);
  cheek(c, -20, 4, 6); cheek(c, 20, 4, 6);
  box(c, -11, -58, 22, 18, 3); paint(c, INK);
  c.fillStyle = "#ff5fa2"; c.fillRect(-11, -45, 22, 4);
  oval(c, 0, -40, 20, 4); paint(c, INK);
}

function star(c, k, t, wig, o) {
  c.rotate((o.spin || 0) + Math.sin(t * 3) * .08 * wig);
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 19 : 45, a = -PI / 2 + i * PI / 5;
    c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.closePath(); paint(c, k.body);
  c.fillStyle = "#ffc2d4";
  for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * TAU / 5; circle(c, Math.cos(a) * 30, Math.sin(a) * 30, 3); c.fill(); }
  eye(c, -8, -4, 7, t); eye(c, 8, -4, 7, t);
  smile(c, 0, 4, 7);
  cheek(c, -13, 8, 4); cheek(c, 13, 8, 4);
}

function turtle(c, k, t, wig) {
  const pad = Math.sin(t * 5) * .45 * wig, skin = "#9bd16a";
  for (const [x, y, r] of [[20, 14, .6 + pad], [-22, 14, -.6 - pad]]) {
    c.save(); c.translate(x, y); c.rotate(r); oval(c, 0, 6, 8, 13); paint(c, skin); c.restore();
  }
  c.beginPath(); c.moveTo(-32, 4); c.lineTo(-44, 9); c.lineTo(-32, 12); c.closePath(); paint(c, skin);
  oval(c, 38, -4, 15, 13); paint(c, skin);
  oval(c, 0, 0, 34, 24); paint(c, k.body);
  c.fillStyle = "#3f8f4f";
  for (const [x, y, r] of [[0, -6, 9], [-18, 0, 6], [18, 0, 6], [-8, -18, 5], [10, -18, 5]]) { circle(c, x, y, r); c.fill(); }
  c.beginPath(); c.moveTo(-33, 6); c.quadraticCurveTo(0, 18, 33, 6); c.stroke();
  eye(c, 42, -8, 7, t);
  smile(c, 43, -1, 6, .1, .7);
  cheek(c, 36, 2, 4);
}

function frog(c, k, t, wig) {
  const kick = Math.sin(t * 6) * .4 * wig;
  for (const s of [-1, 1]) { oval(c, s * 28, 18, 17, 9, s * (.5 + kick)); paint(c, "#4e9e36"); }
  oval(c, 0, 6, 32, 24); paint(c, k.body);
  oval(c, 0, 14, 20, 12); c.fillStyle = "#d8f2a6"; c.fill();
  for (const s of [-1, 1]) { circle(c, s * 14, -18, 12); paint(c, k.body); eye(c, s * 14, -19, 8, t); }
  smile(c, 0, -2, 20, .2, .8);
  cheek(c, -21, 6, 5); cheek(c, 21, 6, 5);
  for (const s of [-1, 1]) { oval(c, s * 12, 29, 8, 4); paint(c, "#4e9e36"); }
}

function duck(c, k, t, wig) {
  c.save(); c.rotate(Math.sin(t * 3) * .06 * wig);
  c.beginPath(); c.moveTo(-34, 2); c.lineTo(-46, -16); c.lineTo(-24, -6); c.closePath(); paint(c, k.body);
  oval(c, -4, 10, 36, 22); paint(c, k.body);
  c.beginPath(); c.moveTo(-20, 4); c.quadraticCurveTo(-6, 26, 12, 6); c.stroke();
  circle(c, 18, -18, 18); paint(c, k.body);
  oval(c, 38, -13, 12, 6); paint(c, "#ff8a1f");
  c.beginPath(); c.moveTo(28, -13); c.lineTo(49, -13); c.stroke();
  eye(c, 22, -24, 6, t);
  cheek(c, 24, -11, 4);
  c.restore();
}

function boot(c, k, t) {
  c.beginPath(); c.moveTo(-22, -40); c.lineTo(8, -40); c.lineTo(8, 2); c.quadraticCurveTo(32, 2, 38, 16); c.lineTo(38, 26); c.lineTo(-22, 26); c.closePath();
  paint(c, k.body);
  box(c, -25, 22, 66, 11, 5); paint(c, "#3b2a1f");
  box(c, -26, -48, 38, 11, 5); paint(c, "#6b4428");
  c.lineWidth = 3;
  for (const y of [-28, -18, -8]) { c.beginPath(); c.moveTo(0, y); c.lineTo(10, y + 6); c.moveTo(0, y + 6); c.lineTo(10, y); c.stroke(); }
  c.lineWidth = 4;
  eye(c, -14, -18, 7, t); eye(c, -12, 4, 6, t + 1);
  circle(c, 26, 13, 3); c.fillStyle = INK; c.fill();
}

function sock(c, k, t) {
  const shape = () => { c.beginPath(); c.moveTo(-16, -42); c.lineTo(10, -42); c.lineTo(10, 2); c.quadraticCurveTo(36, 0, 38, 18); c.quadraticCurveTo(38, 34, 20, 34); c.lineTo(-6, 34); c.quadraticCurveTo(-16, 34, -16, 22); c.closePath(); };
  shape(); paint(c, k.body);
  c.save(); shape(); c.clip();
  c.fillStyle = "#fff";
  for (const y of [-30, -14]) c.fillRect(-20, y, 34, 7);
  c.restore();
  shape(); c.stroke();
  box(c, -19, -50, 32, 10, 4); paint(c, "#fff");
  eye(c, -8, 4, 7, t); eye(c, 6, 4, 7, t + 1);
  circle(c, 28, 24, 4); paint(c, "#3a2030");
}

function penguin(c, k, t, wig) {
  const flap = Math.sin(t * 8) * .35 * wig;
  for (const s of [-1, 1]) { oval(c, s * 10 + 4, 38, 10, 5); paint(c, "#ff9a1f"); }
  for (const s of [-1, 1]) { c.save(); c.translate(s * 22, -4); c.rotate(s * (.25 + flap)); oval(c, 0, 12, 7, 18); paint(c, k.body); c.restore(); }
  oval(c, 0, 0, 26, 38); paint(c, k.body);
  oval(c, 4, 8, 17, 27); c.fillStyle = "#fff"; c.fill();
  eye(c, -1, -16, 6, t); eye(c, 12, -16, 6, t);
  c.beginPath(); c.moveTo(13, -8); c.lineTo(28, -4); c.lineTo(13, 0); c.closePath(); paint(c, "#ff9a1f");
  cheek(c, 18, 2, 4);
  box(c, -24, -2, 48, 9, 4); paint(c, "#e8473f");
  box(c, -18, 2, 9, 20, 3); paint(c, "#e8473f");
}

function jelly(c, k, t, wig, o) {
  for (let i = 0; i < 5; i++) {
    const x0 = -24 + i * 12;
    c.beginPath(); c.moveTo(x0, 2);
    for (let j = 1; j <= 4; j++) c.lineTo(x0 + Math.sin(t * 4 + i + j) * 5 * wig, 2 + j * 11);
    limb(c, "#f6b8e8", 6);
  }
  const squish = 1 + Math.sin(t * 4) * .05 * wig;
  c.save(); c.scale(squish, 1 / squish);
  c.beginPath(); c.moveTo(-34, 4); c.bezierCurveTo(-34, -46, 34, -46, 34, 4);
  for (let i = 0; i < 6; i++) { const x = 34 - i * 68 / 6; c.quadraticCurveTo(x - 68 / 12, 12, x - 68 / 6, 4); }
  c.closePath();
  c.save();
  if (o.glow) { c.shadowColor = k.body; c.shadowBlur = 30; }
  c.globalAlpha = .92; c.fillStyle = k.body; c.fill();
  c.restore();
  c.stroke();
  oval(c, -14, -22, 8, 4, -.5); c.fillStyle = "rgba(255,255,255,.6)"; c.fill();
  eye(c, -10, -12, 7, t); eye(c, 10, -12, 7, t);
  smile(c, 0, -5, 6);
  cheek(c, -18, -4, 4); cheek(c, 18, -4, 4);
  c.restore();
}

// A friendly sheet ghost with a wavy hem.
function ghost(c, k, t, wig, o) {
  const shape = () => {
    c.beginPath(); c.moveTo(-30, 28); c.lineTo(-30, -6); c.bezierCurveTo(-30, -50, 30, -50, 30, -6); c.lineTo(30, 28);
    for (let i = 0; i < 4; i++) { const x = 30 - (i + 1) * 15, dip = (i % 2 ? 6 : 10) + Math.sin(t * 5 + i) * 3 * wig; c.quadraticCurveTo(x + 7.5, 28 + dip, x, 28); }
    c.closePath();
  };
  c.save(); c.rotate(Math.sin(t * 2.5) * .08 * wig);
  for (const s of [-1, 1]) { oval(c, s * 31, 6, 9, 6, s * .5); paint(c, k.body); }
  shape();
  c.save();
  if (o.glow) { c.shadowColor = "#d9ccff"; c.shadowBlur = 30; }
  c.globalAlpha = .95; c.fillStyle = k.body; c.fill();
  c.restore();
  c.stroke();
  oval(c, -14, -26, 7, 4, -.6); c.fillStyle = "#fff"; c.fill();
  eye(c, 2, -12, 9, t); eye(c, 20, -12, 9, t);
  oval(c, 12, 6, 4.5, 6); paint(c, INK);
  cheek(c, -6, 2, 5); cheek(c, 28, 2, 4);
  c.restore();
}

// A pumpkin trick-or-treat bucket, sweets poking out of the top.
function pail(c, k) {
  c.beginPath(); c.moveTo(-26, -24); c.bezierCurveTo(-26, -62, 26, -62, 26, -24); c.lineWidth = 5; c.stroke(); c.lineWidth = 4;
  for (const [x, y, col] of [[-14, -30, "#ff5fa2"], [0, -34, "#7ddc5a"], [13, -30, "#4fc3ff"]]) {
    c.save(); c.translate(x, y); c.rotate(x * .04);
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 6, 0); c.lineTo(s * 12, -5); c.lineTo(s * 12, 5); c.closePath(); paint(c, col); }
    oval(c, 0, 0, 8, 6); paint(c, col);
    c.restore();
  }
  const body = () => { c.beginPath(); c.moveTo(-32, -24); c.lineTo(32, -24); c.bezierCurveTo(40, 4, 34, 34, 0, 34); c.bezierCurveTo(-34, 34, -40, 4, -32, -24); c.closePath(); };
  body(); paint(c, k.body);
  c.save(); body(); c.clip();
  c.strokeStyle = "#e0650b"; c.lineWidth = 3;
  for (const x of [-18, 18]) { c.beginPath(); c.ellipse(x, 6, 12, 32, 0, 0, TAU); c.stroke(); }
  c.restore();
  box(c, -35, -29, 70, 9, 4); paint(c, "#e0650b");
  c.fillStyle = INK;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 6, -2); c.lineTo(s * 22, -2); c.lineTo(s * 14, -14); c.closePath(); c.fill(); }
  c.beginPath(); c.moveTo(-20, 10); c.quadraticCurveTo(0, 30, 20, 10); c.quadraticCurveTo(0, 18, -20, 10); c.fill();
  c.fillStyle = "#fff6b0";
  for (const s of [-1, 1]) { circle(c, s * 15 - 2, -5, 1.8); c.fill(); }
  cheek(c, -24, 8, 5); cheek(c, 24, 8, 5);
}

const SHAPES = { fish, puffer, crab, octopus, star, turtle, frog, duck, boot, sock, penguin, jelly, ghost, pail };

// Paints a creature into a small <canvas>: for the bucket and the fish book. Not caught yet
// shows as a silhouette.
export function creatureCanvas(cv, kind, css, hidden = false) {
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  cv.width = cv.height = Math.round(css * dpr);
  cv.style.width = cv.style.height = css + "px";
  const c = cv.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const k = CREATURES[kind], wide = k.wide || 1;
  drawCreature(c, kind, css / 2 - (wide - 1) * css * .12, css / 2 + css * .04, css * .34 / wide, { wig: 0 });
  if (hidden) { c.globalCompositeOperation = "source-in"; c.fillStyle = "#a9b8cc"; c.fillRect(0, 0, css, css); }
  return cv;
}
