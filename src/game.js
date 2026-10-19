import {
  CREATURES, PER_BUCKET, sea, boat, onBoat, spawn, swim, hit, nearest, lure, approach, refit,
  nextPlace, bookAdd, found, cleanBook, journey, isHalloween, SPOOKY,
} from "./sea.js";
import { drawCreature, creatureCanvas, dressUp } from "./creatures.js";
import { drawScene, drawBoat, drawLine } from "./scene.js";

const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;
const ease = p => p < .5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
const pop = p => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;   // overshoots a little, then settles
const cap = s => s[0].toUpperCase() + s.slice(1);


// ---------- saved between visits: the fish book, where the boat is, sound on or off ----------
const KEY = "funny-fish";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
let book = cleanBook(saved.book);
let muted = saved.muted === true;
let spookyChoice = typeof saved.halloween === "boolean" ? saved.halloween : null;   // the Halloween switch, once used

// In October the captain dresses up, everyone wears a costume, bats come out, and the journey goes on
// to the spooky sea. The switch on the title screen turns it on or off on any day.
let halloween, ROUTE;
function setHalloween(on) {
  halloween = on; ROUTE = journey(on);
  dressUp(on);
  if (on) document.body.dataset.halloween = ""; else delete document.body.dataset.halloween;
  $("spooky").setAttribute("aria-pressed", String(on));
}
setHalloween(isHalloween(new Date(), location.search, spookyChoice));

let place = Number.isInteger(saved.place) && saved.place >= 0 && saved.place < ROUTE.length ? saved.place : 0;
function save() { try { localStorage.setItem(KEY, JSON.stringify({ book, place, muted, halloween: spookyChoice ?? undefined })); } catch {} }

// ---------- state ----------
// title → fish → cast → wait (a fish swims to the worm) → reel → show → stow (into the bucket)
// → fish again, or when the bucket is full: party → sail → fish at the next place.
let state = "title", stateAt = 0, T = 0;
let fish = [], bucket = [], parts = [];
let hook = null;        // { x, y, from, to, p, fish } while the line is out
let shown = null;       // the creature being shown off: { kind, from, size, t }
let sail = null;        // { from, to }
let lastTap = 0, nudgedAt = -99, honk = 0, nextBubble = 1;

function setState(s) { state = s; stateAt = T; document.body.dataset.state = s; }
document.body.dataset.place = ROUTE[place].id;

// ---------- sound + voice ----------
let ac, noiseBuf;
function audio() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { ac = null; } }
  if (ac?.state === "suspended") ac.resume().catch(() => {});
  return ac;
}
function tone(freq, t0, dur, type = "sine", gain = .18, slide) {
  const a = audio(); if (!a || muted) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, a.currentTime + t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, a.currentTime + t0 + dur);
  g.gain.setValueAtTime(0.0001, a.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(gain, a.currentTime + t0 + .02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
  o.connect(g).connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + .05);
}
function hiss(dur, freq, type = "bandpass", gain = .2, t0 = 0) {
  const a = audio(); if (!a || muted) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
  const t = a.currentTime + t0;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + .01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(a.destination); s.start(t, Math.random() * .5); s.stop(t + dur + .05);
}
const sfx = {
  cast: () => { hiss(.25, 2500, "bandpass", .07); tone(900, 0, .2, "sine", .05, 500); },
  splash: () => { hiss(.35, 900, "lowpass", .3); tone(320, 0, .15, "sine", .12, 120); },
  bubble: () => tone(400 + Math.random() * 300, 0, .1, "sine", .12, 900 + Math.random() * 300),
  chomp: () => { tone(220, 0, .08, "square", .06, 140); tone(200, .11, .08, "square", .06, 120); },
  reel: () => { for (let i = 0; i < 10; i++) tone(1700, i * .07, .03, "square", .02); },
  plink: () => { tone(1320, 0, .25, "triangle", .12, 1760); tone(1760, .1, .3, "sine", .06); },
  toot: () => { for (const t0 of [0, .4]) { tone(233, t0, .3, "triangle", .16); tone(294, t0, .3, "triangle", .1); } },
  whoosh: () => hiss(1.4, 500, "bandpass", .18),
  // what each creature does when it's caught
  blub: () => [0, .1, .2].forEach((d, i) => tone(300 + i * 120, d, .1, "sine", .16, 700 + i * 150)),
  meow: () => { tone(520, 0, .16, "triangle", .14, 820); tone(820, .16, .32, "triangle", .14, 430); },
  ribbit: () => { for (const d of [0, .16]) tone(170, d, .12, "square", .06, 120); },
  squeak: () => { tone(1300, 0, .1, "sine", .14, 1900); tone(1300, .16, .12, "sine", .14, 2000); },
  boing: () => tone(160, 0, .5, "triangle", .2, 720),
  puff: () => { tone(160, 0, .5, "sine", .14, 520); hiss(.4, 1200, "bandpass", .08); tone(500, .5, .1, "sine", .18, 1200); },
  snap: () => { for (const d of [0, .18, .36]) { hiss(.04, 4000, "highpass", .3, d); tone(1200, d, .04, "square", .03); } },
  raspberry: () => { tone(110, 0, .5, "sawtooth", .06, 85); hiss(.5, 300, "lowpass", .15); },
  honk: () => { for (const d of [0, .3]) { tone(330, d, .22, "square", .05); tone(415, d, .22, "square", .04); } },
  wiggle: () => [523, 659, 523, 659, 784].forEach((f, i) => tone(f, i * .09, .12, "sine", .14)),
  twinkle: () => [1568, 2093, 2637, 2093, 3136].forEach((f, i) => tone(f, i * .1, .3, "triangle", .07)),
  brrr: () => { for (let i = 0; i < 12; i++) tone(190 + (i % 2) * 30, i * .045, .04, "square", .04); },
  tada: () => { [523, 659, 784].forEach((f, i) => tone(f, i * .08, .2, "triangle", .14)); tone(1047, .26, .5, "triangle", .16); },
  squawk: () => { tone(760, 0, .14, "sawtooth", .05, 520); tone(760, .2, .18, "sawtooth", .05, 480); },
  wobble: () => [330, 392, 330, 392, 330].forEach((f, i) => tone(f, i * .1, .14, "sine", .15, f * 1.08)),
  ding: () => { tone(1568, 0, 1.2, "sine", .16); tone(3136, 0, .6, "sine", .04); },
  snore: () => { hiss(.7, 350, "lowpass", .25); tone(90, 0, .7, "sawtooth", .03, 70); tone(600, .8, .3, "sine", .08, 1200); },
  woo: () => { tone(330, 0, .5, "sine", .14, 520); tone(520, .45, .8, "sine", .14, 300); tone(660, .45, .8, "triangle", .03, 380); },
  boo: () => { tone(260, 0, .18, "triangle", .12, 330); tone(330, .2, .9, "sine", .16, 200); },
  flap: () => { for (let i = 0; i < 6; i++) hiss(.06, 1600, "bandpass", .18, i * .09); tone(2400, .55, .08, "sine", .06, 3000); },
  treat: () => { hiss(.3, 5000, "highpass", .08); [784, 988, 1175, 1568].forEach((f, i) => tone(f, .1 + i * .08, .25, "triangle", .1)); },
};
// An original little sea-shanty jingle for a full bucket.
function jingle() {
  const n = [[392, 0], [523, .16], [523, .32], [523, .48], [659, .64], [587, .8], [523, .96], [659, 1.2], [784, 1.44]];
  n.forEach(([f, d], i) => tone(f, d, i === n.length - 1 ? .7 : .2, "triangle", .14));
  [[131, 0], [196, .48], [131, .96], [196, 1.44]].forEach(([f, d]) => tone(f, d, .4, "sine", .12));
}

// Speaks, and shows the words in the caption for a few seconds, so nothing depends on hearing.
let captionTimer;
function say(text, delay = 0) {
  const cap = $("caption");
  cap.textContent = text; cap.classList.add("on");
  clearTimeout(captionTimer);
  captionTimer = setTimeout(() => cap.classList.remove("on"), 3800);
  if (muted) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = .9; u.pitch = 1.3;
    setTimeout(() => speechSynthesis.speak(u), delay);
  } catch {}
}

// ---------- the canvas ----------
const cv = $("sea"), c = cv.getContext("2d");
let S, B, dpr = 1, tip;
function resize() {
  const W = cv.clientWidth, H = cv.clientHeight, old = S;
  dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  S = sea(W, H); B = boat(S); tip = { ...B.tip };
  if (old) for (const f of fish) refit(f, old, S);
}
new ResizeObserver(resize).observe(cv);
resize();

const want = () => clamp(Math.round(S.W * S.H / 150000), 4, 7);
const here = () => ROUTE[place];
const night = () => here().id === "night" || here().id === "spooky";
function stock(inside) {
  while (fish.filter(f => f.state === "swim").length < want()) fish.push(spawn(S, here(), Math.random, fish.map(f => f.kind), inside));
}
stock(true);

// ---------- particles: bubbles, splashes, sparkles ----------
function bubbles(x, y, n, r = 1) {
  for (let i = 0; i < n; i++) parts.push({ k: "bubble", x: x + (Math.random() - .5) * 30 * r, y, vy: -(50 + Math.random() * 70), r: (3 + Math.random() * 6) * r, ph: Math.random() * TAU, life: 4 });
}
function splash(x, y) {
  sfx.splash();
  for (let i = 0; i < 14; i++) parts.push({ k: "drop", x, y, vx: (Math.random() - .5) * 260, vy: -(160 + Math.random() * 220), r: 2.5 + Math.random() * 4, life: 2 });
  parts.push({ k: "ring", x, y, r: 6, life: .7 });
}
function sparkle(x, y, n, spread = 1) {
  const cols = halloween ? ["#ff8c1a", "#b77cff", "#9dff7a", "#ffd23f", "#ffffff"] : ["#ffd23f", "#ff6b9d", "#7ddc5a", "#4fc3ff", "#ffffff"];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, v = (120 + Math.random() * 220) * spread;
    parts.push({ k: "star", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, r: 5 + Math.random() * 6, rot: Math.random() * TAU, col: cols[i % cols.length], life: 1.2 });
  }
}
function stepParts(dt) {
  for (const p of parts) {
    p.life -= dt;
    if (p.k === "bubble") { p.y += p.vy * dt; p.x += Math.sin(T * 3 + p.ph) * 20 * dt; if (p.y < S.top + 4) p.life = 0; }
    else if (p.k === "drop") { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vy > 0 && p.y > S.top + 6) p.life = 0; }
    else if (p.k === "ring") p.r += 90 * dt;
    else if (p.k === "star") { p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += 4 * dt; }
  }
  parts = parts.filter(p => p.life > 0);
}
function drawParts() {
  for (const p of parts) {
    c.save();
    if (p.k === "bubble") {
      c.globalAlpha = .8; c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 2;
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.stroke();
      c.fillStyle = "rgba(255,255,255,.7)"; c.beginPath(); c.arc(p.x - p.r * .35, p.y - p.r * .35, p.r * .25, 0, TAU); c.fill();
    } else if (p.k === "drop") {
      c.fillStyle = "rgba(220,245,255,.95)"; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
    } else if (p.k === "ring") {
      c.globalAlpha = Math.max(0, p.life / .7); c.strokeStyle = "#fff"; c.lineWidth = 3;
      c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * .3, 0, 0, TAU); c.stroke();
    } else if (p.k === "star") {
      c.globalAlpha = Math.min(1, p.life * 2); c.translate(p.x, p.y); c.rotate(p.rot);
      c.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? p.r * .45 : p.r, a = i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath(); c.fillStyle = p.col; c.fill();
    }
    c.restore();
  }
}

// ---------- the bucket ----------
const slots = [...$("bucket").querySelectorAll("li")];
function renderBucket() {
  slots.forEach((li, i) => {
    const kind = bucket[i];
    if (li.dataset.kind === (kind || "")) return;
    li.dataset.kind = kind || "";
    li.replaceChildren();
    li.classList.toggle("full", !!kind);
    li.setAttribute("aria-label", kind ? cap(CREATURES[kind].name) : "Empty");
    if (kind) li.append(creatureCanvas(document.createElement("canvas"), kind, li.clientWidth));
  });
}
function slotCentre(i) {
  const r = slots[Math.min(i, slots.length - 1)].getBoundingClientRect(), cr = cv.getBoundingClientRect();
  return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top, size: r.width * .36 };
}

// ---------- playing ----------
function cast(x, y) {
  const target = hit(fish, x, y);
  if (hook?.fish?.state === "bite") hook.fish.state = "swim";
  const from = hook ? { x: hook.x, y: hook.y } : { x: tip.x, y: S.top + S.s * .5 };
  const to = target ? { x: target.x + target.dir * target.size * .8, y: target.y }
                    : { x: clamp(x, S.s, S.W - S.s), y: clamp(y, S.top + S.s * .8, S.maxY) };
  hook = { x: from.x, y: from.y, from, to, p: 0, fish: target };
  if (target) lure(target, to.x, to.y, S);
  setState("cast");
  sfx.cast();
}

function update(dt) {
  honk = Math.max(0, honk - dt * 2.5);
  for (const f of fish) if (f.state === "swim" && !swim(f, dt, S, T)) f.state = "gone";
  fish = fish.filter(f => f.state !== "gone");
  if (state !== "sail" && state !== "party") stock(false);

  if (state === "cast") {
    hook.p = Math.min(1, hook.p + dt / .32);
    const e = ease(hook.p), wasAbove = hook.y < S.top;
    hook.x = lerp(hook.from.x, hook.to.x, e);
    hook.y = lerp(hook.from.y, hook.to.y, e) - Math.sin(Math.PI * hook.p) * S.s * 1.2;
    if (wasAbove && hook.y >= S.top) splash(hook.x, S.top);
    if (hook.p >= 1) {
      if (!hook.fish) {
        hook.fish = nearest(fish, hook.x, hook.y, S);
        if (!hook.fish) { fish.push(spawn(S, here(), Math.random, [], false)); hook.fish = fish[fish.length - 1]; }
        lure(hook.fish, hook.x, hook.y, S);
      }
      setState("wait");
    }
  } else if (state === "wait") {
    hook.y = hook.to.y + Math.sin(T * 3) * 2;
    if (approach(hook.fish, hook.x, hook.y, dt)) {
      hook.fish.state = "hooked";
      sfx.chomp(); sfx.reel();
      bubbles(hook.x, hook.y, 6);
      hook.from = { x: hook.x, y: hook.y };
      setState("reel");
    }
  } else if (state === "reel") {
    const p = Math.min(1, (T - stateAt) / .8), e = ease(p), wasBelow = hook.y > S.top;
    hook.x = lerp(hook.from.x, tip.x, e);
    hook.y = lerp(hook.from.y, S.top - S.s * 1.4, e);
    const f = hook.fish;
    f.x = hook.x; f.y = hook.y + f.size * .85;
    if (wasBelow && hook.y <= S.top) splash(hook.x, S.top);
    if (p >= 1) {
      fish = fish.filter(g => g !== f);
      shown = { kind: f.kind, from: { x: f.x, y: f.y }, size: f.size, dir: f.dir };
      hook = null;
      const k = CREATURES[f.kind];
      sfx[k.sound](); say(k.say, 350);
      setState("show");
    }
  } else if (state === "show") {
    if (T - stateAt > 3.4) setState("stow");
  } else if (state === "stow") {
    if (T - stateAt > .6) {
      bucket.push(shown.kind);
      book = bookAdd(book, shown.kind); save();
      const at = slotCentre(bucket.length - 1);
      sparkle(at.x, at.y, 8, .5);
      sfx.plink();
      shown = null;
      renderBucket();
      if (bucket.length >= PER_BUCKET) full(); else setState("fish");
    }
  } else if (state === "party") {
    if (T - stateAt > 3.2) setSail();
  } else if (state === "sail") {
    if (T - stateAt > sailTime()) arrive();
  } else if (state === "fish" && T - lastTap > 7 && T - nudgedAt > 20) {
    nudgedAt = T;
    say("Tap the water to catch a fish!");
  }

  if ((nextBubble -= dt) < 0 && state !== "sail") {
    nextBubble = .5 + Math.random();
    const f = fish[Math.random() * fish.length | 0];
    if (f && f.state === "swim") bubbles(f.x + f.dir * f.size, f.y - f.size * .2, 1, .6);
  }
  stepParts(dt);
}

function full() {
  setState("party");
  $("bucket").classList.add("party");
  jingle();
  for (let i = 0; i < 4; i++) setTimeout(() => sparkle(S.W * (.2 + Math.random() * .6), S.H * (.3 + Math.random() * .3), 18), i * 350);
  say(`Your bucket is full! Let's sail to ${ROUTE[nextPlace(place, ROUTE)].name}!`);
}
const sailTime = () => reduce ? 1 : 3.6;
function setSail() {
  sail = { from: place, to: nextPlace(place, ROUTE) };
  setState("sail");
  sfx.toot(); sfx.whoosh();
  honk = 1;
}
function arrive() {
  place = sail.to; sail = null; save();
  document.body.dataset.place = here().id;
  fish = []; stock(true);
  for (const f of fish) bubbles(f.x, f.y, 6);
  bucket = []; renderBucket();
  $("bucket").classList.remove("party");
  setState("fish");
  lastTap = T;
  say(`Welcome to ${here().name}!`);
}

function tap(x, y) {
  lastTap = T;
  audio();
  if (state === "title") return;
  const fishing = state === "fish" || state === "cast" || state === "wait";
  // a fish (or a duck floating past the boat) comes before the boat's horn
  if (fishing && hit(fish, x, y)) return cast(x, y);
  if (onBoat(B, x, y)) { honk = 1; sfx.toot(); bubbles(B.x, S.top + 10, 4); return; }
  if (fishing) return cast(x, y);
  if (state === "show" && T - stateAt > .7) return setState("stow");
  if (y > S.top) { bubbles(x, y, 5); sfx.bubble(); } else sparkle(x, y, 6, .4);
}

cv.addEventListener("pointerdown", e => {
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  tap(e.clientX - r.left, e.clientY - r.top);
});
cv.addEventListener("contextmenu", e => e.preventDefault());
cv.addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  const on = fish.filter(f => f.state === "swim" && f.x > 0 && f.x < S.W), f = on[Math.random() * on.length | 0];
  tap(f ? f.x : S.W * .3, f ? f.y : (S.top + S.H) / 2);
});

// ---------- drawing ----------
function draw() {
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  let off = 0;
  if (state === "sail") {
    const e = ease(Math.min(1, (T - stateAt) / sailTime()));
    off = -e * S.W;
    drawScene(c, S, ROUTE[sail.from].id, T, off, halloween);
    drawScene(c, S, ROUTE[sail.to].id, T, off + S.W, halloween);
  } else drawScene(c, S, here().id, T, 0, halloween);

  const glow = night();
  for (const f of fish) {
    if (f.state === "hooked") continue;
    drawCreature(c, f.kind, f.x + off, f.y, f.size, { dir: f.dir, t: T + f.phase, wig: f.state === "bite" ? 2 : 1, glow });
  }
  if (state === "fish" && T - lastTap > 7) nudge();

  tip = drawBoat(c, B, T, honk, halloween);
  if (hook) {
    drawLine(c, S, tip, hook, T, !hook.fish || hook.fish.state !== "hooked");
    if (hook.fish?.state === "hooked") {
      const f = hook.fish;
      drawCreature(c, f.kind, f.x, f.y, f.size, { dir: f.dir, t: T * 1.6, wig: 2, tilt: -Math.PI / 2 + Math.sin(T * 14) * .25, glow });
    }
  } else if (state !== "sail" && state !== "party") {
    const rest = { x: tip.x + Math.sin(T * 1.3) * 3, y: S.top + S.s * .5 };
    drawLine(c, S, tip, rest, T);
  }
  drawParts();
  if (shown) drawShown();
}

// Rings round a fish when nobody has tapped for a while, to show where to tap.
function nudge() {
  const f = fish.find(f => f.state === "swim" && f.x > f.size && f.x < S.W - f.size);
  if (!f) return;
  c.save();
  for (let i = 0; i < 2; i++) {
    const p = ((T * .8 + i * .5) % 1);
    c.globalAlpha = 1 - p; c.strokeStyle = "#fff"; c.lineWidth = 5;
    c.beginPath(); c.arc(f.x, f.y, f.size * (1.1 + p * .9), 0, TAU); c.stroke();
  }
  c.restore();
}

// The catch, big in the middle of the screen, doing its funny thing; then off to the bucket.
function drawShown() {
  const k = CREATURES[shown.kind], t = T - stateAt;
  const big = Math.min(S.W, S.H) * .2, mid = { x: S.W / 2, y: S.H * .56 };
  let x, y, size, wig = 1.5, tilt = 0, extra = {};
  if (state === "show") {
    const p = Math.min(1, t / .45), e = pop(p);
    x = lerp(shown.from.x, mid.x, ease(p)); y = lerp(shown.from.y, mid.y, ease(p)) - Math.sin(Math.PI * p) * S.s * 2;
    size = lerp(shown.size, big, e);
    if (p >= 1) {
      y += reduce ? 0 : -Math.abs(Math.sin(t * 4)) * big * .15;
      tilt = reduce ? 0 : Math.sin(t * 6) * .12;
    }
    c.save();
    const g = c.createRadialGradient(mid.x, mid.y, 0, mid.x, mid.y, big * 3);
    g.addColorStop(0, `rgba(255,255,255,${.55 * Math.min(1, t * 3)})`); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, S.W, S.H);
    c.translate(mid.x, mid.y); c.rotate(T * .4);
    c.globalAlpha = .35 * Math.min(1, t * 3); c.fillStyle = "#fff6b0";
    for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, big * 2.6, i * TAU / 12, i * TAU / 12 + .13); c.closePath(); c.fill(); }
    c.restore();
    if (k.shape === "puffer") extra.puff = clamp((t - .5) * 3, 0, 1);
    if (k.shape === "star") extra.spin = clamp(t - .3, 0, 1) * TAU * 2;
    if (k.shape === "frog" && !reduce) y -= Math.abs(Math.sin(t * 3)) * big * .4;
    if (t > .45 && Math.random() < .08) sparkle(x + (Math.random() - .5) * big * 2, y - big * .6, 1, .4);
  } else {
    const p = Math.min(1, t / .6), at = slotCentre(bucket.length);
    x = lerp(mid.x, at.x, ease(p)); y = lerp(mid.y, at.y, ease(p)) - Math.sin(Math.PI * p) * S.s * 2;
    size = lerp(big, at.size, ease(p)); wig = 1;
    if (k.shape === "puffer") extra.puff = 1 - p;
  }
  drawCreature(c, shown.kind, x, y, size, { dir: 1, t: T * 1.4, wig, tilt, show: state === "show", glow: night(), ...extra });
}

// ---------- the loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000);   // keeps time on slow devices, without leaping after a pause
  last = now; T += dt;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setState("title");
renderBucket();

// ---------- title, buttons and the fish book ----------
function renderTitle() {
  const cols = halloween ? ["#ff8c1a", "#b77cff", "#9dff7a"] : ["#ff9a2e", "#ffd23f", "#4fc3ff", "#7ddc5a", "#ff6b9d"];
  $("title").innerHTML = [..."Funny Fish"].map((ch, i) =>
    ch === " " ? " " : `<span aria-hidden="true" style="color:${cols[i % cols.length]};--i:${i}">${ch}</span>`).join("");
}
renderTitle();

// The grown-ups' Halloween switch, on the title screen only, so it never changes mid-game.
$("spooky").addEventListener("click", e => {
  e.stopPropagation();   // not a tap to start
  spookyChoice = !halloween;
  setHalloween(spookyChoice);
  if (place >= ROUTE.length) {   // the spooky sea is gone: back to the pond
    place = 0;
    document.body.dataset.place = here().id;
    fish = []; stock(true);
  }
  save();
  renderTitle();
});

let lock;
async function wake() { try { lock = await navigator.wakeLock?.request("screen"); } catch {} }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && state !== "title") wake(); });

function start() {
  if (state !== "title") return;
  audio();
  $("title-screen").hidden = true;
  setState("fish");
  lastTap = T;
  wake();
  cv.focus({ preventScroll: true });
  const hello = place === 0 && !found(book) ? "Let's go fishing! Tap the water." : `Let's go fishing at ${here().name}!`;
  say(halloween ? `Happy Halloween! ${hello}` : hello);
}
$("title-screen").addEventListener("click", start);

function setMuted(m) {
  muted = m; save();
  $("mute").setAttribute("aria-pressed", String(muted));
  $("mute").setAttribute("aria-label", muted ? "Sound off" : "Sound on");
  $("wave").style.display = muted ? "none" : "";
  if (muted) try { speechSynthesis.cancel(); } catch {}
}
$("mute").addEventListener("click", () => setMuted(!muted));
setMuted(muted);

if (document.fullscreenEnabled) {
  $("full").hidden = false;
  $("full").addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  });
}

function openBook() {
  const grid = $("book-pages");
  grid.replaceChildren();
  // the spooky sea's page stays in the book after October, once something from it has been caught
  const pages = halloween || !SPOOKY.creatures.some(k => book[k]) ? ROUTE : [...ROUTE, SPOOKY];
  const kinds = pages.flatMap(p => p.creatures);
  for (const p of pages) {
    const h = document.createElement("h3");
    h.textContent = cap(p.name);
    const row = document.createElement("div");
    row.className = "grid";
    for (const kind of p.creatures) {
      const k = CREATURES[kind], n = book[kind] || 0, b = document.createElement("button");
      b.type = "button";
      b.className = "sticker" + (n ? "" : " no");
      b.dataset.kind = kind;
      b.setAttribute("aria-label", n ? `${cap(k.name)}, caught ${n}` : "Not caught yet");
      b.append(creatureCanvas(document.createElement("canvas"), kind, 76, !n));
      if (n) {
        const badge = document.createElement("span");
        badge.className = "n"; badge.textContent = "×" + n;
        b.append(badge);
        b.addEventListener("click", () => {
          audio(); sfx[k.sound](); say(k.say, 300);
          b.classList.remove("wiggle"); void b.offsetWidth; b.classList.add("wiggle");
        });
      } else b.addEventListener("click", () => { audio(); sfx.bubble(); });
      row.append(b);
    }
    grid.append(h, row);
  }
  $("book-count").textContent = `${kinds.filter(k => book[k]).length} of ${kinds.length} found`;
  $("book").hidden = false;
  $("book-close").focus();
}
function closeBook() { $("book").hidden = true; $("book-btn").focus(); }
$("book-btn").addEventListener("click", openBook);
$("book-close").addEventListener("click", closeBook);
$("book").addEventListener("click", e => { if (e.target === $("book")) closeBook(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("book").hidden) closeBook(); });
