// The rules of the sea, kept apart from the drawing so they can be tested: the places on the
// journey, who lives in each one, how they swim, and which one bites the hook.

export const PER_BUCKET = 5;
const TAU = Math.PI * 2;

// shape: which drawing (creatures.js). swim: "mid" anywhere in the water, "surface" floating,
// "bottom" along the sea floor, "drift" bobbing up and down. sound: what it does when caught.
// junk turns up less often. scale is its size next to an ordinary fish.
export const CREATURES = {
  goldfish:  { name: "goldfish", say: "A goldfish with a bow!", shape: "fish", body: "#ff9a2e", fin: "#ff6a1f", extras: ["bow"], sound: "blub" },
  catfish:   { name: "catfish", say: "A catfish! Meow!", shape: "fish", body: "#93a6cc", fin: "#6b7fa6", extras: ["cat"], sound: "meow" },
  frog:      { name: "frog", say: "A froggy! Ribbit!", shape: "frog", body: "#6cc04a", sound: "ribbit", scale: .9 },
  duck:      { name: "rubber duck", say: "A rubber duck! Squeak squeak!", shape: "duck", body: "#ffd93b", sound: "squeak", swim: "surface", junk: true, scale: .85 },

  coolfish:  { name: "cool fish", say: "A cool fish in sunglasses!", shape: "fish", body: "#3cc6d9", fin: "#1f93b8", extras: ["shades"], sound: "boing" },
  puffer:    { name: "pufferfish", say: "A pufferfish! Puff!", shape: "puffer", body: "#f5d36b", sound: "puff", scale: .9 },
  crab:      { name: "crab", say: "A crab! Snap snap!", shape: "crab", body: "#f0573a", sound: "snap", swim: "bottom", scale: .85 },
  boot:      { name: "old boot", say: "An old boot! Pee-yew!", shape: "boot", body: "#9a6a42", sound: "raspberry", swim: "bottom", junk: true, slow: true, scale: .85 },

  clownfish: { name: "clownfish", say: "A clownfish with a honky nose!", shape: "fish", body: "#ff7a1a", fin: "#ff5a00", stripes: true, extras: ["clown"], sound: "honk" },
  octopus:   { name: "octopus", say: "An octopus! Wiggle wiggle!", shape: "octopus", body: "#b46ae0", sound: "wiggle", swim: "drift" },
  starfish:  { name: "starfish", say: "A starfish! Twinkle twinkle!", shape: "star", body: "#ff8fb1", sound: "twinkle", swim: "bottom", slow: true, scale: .85 },
  turtle:    { name: "turtle", say: "A turtle! Hello, turtle!", shape: "turtle", body: "#58b368", sound: "tada", slow: true, scale: 1.1 },

  woolly:    { name: "woolly hat fish", say: "A fish in a woolly hat! Brrr!", shape: "fish", body: "#9fd8f5", fin: "#5fb3e0", extras: ["hat"], sound: "brrr" },
  narwhal:   { name: "narwhal", say: "A narwhal! A unicorn of the sea!", shape: "fish", body: "#a8bbdc", fin: "#7d93bd", spots: "#8098c4", extras: ["horn"], sound: "tada", scale: 1.15, wide: 1.35 },
  penguin:   { name: "penguin", say: "A penguin! It wants a ride!", shape: "penguin", body: "#2e3550", sound: "squawk" },
  sock:      { name: "smelly sock", say: "A smelly sock! Pee-yew!", shape: "sock", body: "#e85d75", sound: "raspberry", junk: true, scale: .85 },

  jelly:     { name: "jellyfish", say: "A jellyfish! Wobble wobble!", shape: "jelly", body: "#ff9de2", sound: "wobble", swim: "drift", slow: true, glows: true },
  angler:    { name: "anglerfish", say: "An anglerfish with a little lamp!", shape: "fish", body: "#6a58a0", fin: "#4b3c7a", extras: ["lamp"], sound: "ding", glows: true },
  kingfish:  { name: "king fish", say: "A king fish with a crown and a moustache!", shape: "fish", body: "#6c8cff", fin: "#4b63d6", extras: ["crown", "moustache"], sound: "tada" },
  sleepy:    { name: "sleepy fish", say: "A sleepy fish in a nightcap! Snore!", shape: "fish", body: "#7fd6c2", fin: "#4fb39e", extras: ["sleep"], sound: "snore", slow: true },
};

// The journey, in order. After the last place the boat sails back to the first.
export const PLACES = [
  { id: "pond", name: "the lily pond", creatures: ["goldfish", "catfish", "frog", "duck"] },
  { id: "sea", name: "the big blue sea", creatures: ["coolfish", "puffer", "crab", "boot"] },
  { id: "reef", name: "the coral reef", creatures: ["clownfish", "octopus", "starfish", "turtle"] },
  { id: "ice", name: "the icy sea", creatures: ["woolly", "narwhal", "penguin", "sock"] },
  { id: "night", name: "the night sea", creatures: ["jelly", "angler", "kingfish", "sleepy"] },
];
export const nextPlace = i => (i + 1) % PLACES.length;

// The screen as the sea sees it: the waterline, how big a fish is, and the band fish swim in.
export function sea(W, H) {
  const top = Math.round(H * (H > W ? .3 : .34));
  const s = Math.round(Math.max(30, Math.min(72, Math.min(W, H * .8) * .12)));
  return { W, H, top, s, minY: top + s * 1.4, maxY: H - s * 1.2 };
}
export const sizeOf = (kind, S) => S.s * (CREATURES[kind].scale || 1);

// The boat sits in the middle of the waterline; the rod tip is up and to the right.
export function boat(S) {
  const k = Math.max(.5, Math.min(1.2, Math.min(S.W * 1.15, S.H * 1.3) / 700));
  return { x: S.W / 2, y: S.top, k, tip: { x: S.W / 2 + 100 * k, y: S.top - 125 * k } };
}
export const onBoat = (B, x, y) => Math.abs(x - B.x) < 86 * B.k && y > B.y - 105 * B.k && y < B.y + 26 * B.k;

// A kind for the next fish, preferring ones not already swimming so the sea stays varied.
export function pickKind(place, rand = Math.random, present = []) {
  let pool = place.creatures.filter(k => !present.includes(k));
  if (!pool.length) pool = place.creatures;
  const w = pool.map(k => CREATURES[k].junk ? .5 : 1);
  let r = rand() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) if ((r -= w[i]) < 0) return pool[i];
  return pool[pool.length - 1];
}

function lane(kind, S, rand) {
  const swim = CREATURES[kind].swim;
  if (swim === "surface") return S.top + sizeOf(kind, S) * .35;
  if (swim === "bottom") return S.maxY - rand() * S.s * .4;
  return S.minY + rand() * (S.maxY - S.minY);
}

// A new fish, swimming in from one side (or, with inside, already somewhere on screen).
export function spawn(S, place, rand = Math.random, present = [], inside = false) {
  const kind = pickKind(place, rand, present), size = sizeOf(kind, S), dir = rand() < .5 ? 1 : -1;
  const x = inside ? size + rand() * (S.W - 2 * size) : dir > 0 ? -size * 1.6 : S.W + size * 1.6;
  const y = lane(kind, S, rand);
  const speed = S.s * (.6 + rand() * .9) * (CREATURES[kind].slow ? .5 : 1);
  return { kind, x, y, baseY: y, dir, size, speed, phase: rand() * TAU, state: "swim" };
}

// Moves a swimming fish along. Returns false once it has swum off the far side.
export function swim(f, dt, S, t) {
  const swim = CREATURES[f.kind].swim;
  const bob = swim === "surface" ? .06 : swim === "bottom" ? 0 : swim === "drift" ? .5 : .22;
  f.x += f.dir * f.speed * dt;
  f.y = f.baseY + Math.sin(t * 1.5 + f.phase) * S.s * bob;
  return f.dir > 0 ? f.x < S.W + f.size * 2 : f.x > -f.size * 2;
}

// The swimming fish under a tap, if any, with some slack for little fingers.
export function hit(fish, x, y, slack = 1.5) {
  let best = null, bd = Infinity;
  for (const f of fish) {
    if (f.state !== "swim") continue;
    const d = Math.hypot(f.x - x, f.y - y);
    if (d < f.size * slack && d < bd) { bd = d; best = f; }
  }
  return best;
}

// The swimming fish closest to the hook, preferring ones you can see.
export function nearest(fish, x, y, S) {
  let best = null, bd = Infinity;
  for (const f of fish) {
    if (f.state !== "swim") continue;
    const d = Math.hypot(f.x - x, f.y - y) + (f.x > 0 && f.x < S.W ? 0 : S.W * 2);
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}

// The fish has seen the worm and comes for it, fast enough to get there in under a second.
export function lure(f, hx, hy, S) {
  f.state = "bite";
  f.rush = Math.max(S.s * 5, Math.hypot(f.x - hx, f.y - hy) / .9);
}

// Swims a lured fish toward the hook until its mouth is on it. Returns true when it bites.
export function approach(f, hx, hy, dt) {
  if (Math.abs(hx - f.x) > f.size * .4) f.dir = hx > f.x ? 1 : -1;
  const tx = hx - f.dir * f.size * .8, dx = tx - f.x, dy = hy - f.y, d = Math.hypot(dx, dy), step = f.rush * dt;
  if (d <= step) { f.x = tx; f.y = hy; return true; }
  f.x += dx / d * step; f.y += dy / d * step;
  return false;
}

// Keeps a fish in the same part of the sea when the screen changes size.
export function refit(f, from, to) {
  const m = y => to.minY + (y - from.minY) / (from.maxY - from.minY) * (to.maxY - to.minY);
  f.x *= to.W / from.W;
  f.size = sizeOf(f.kind, to);
  f.speed *= to.s / from.s;
  if (CREATURES[f.kind].swim === "surface") f.y = f.baseY = to.top + f.size * .35;
  else { f.baseY = m(f.baseY); f.y = m(f.y); }
}

// The fish book: how many of each creature you've caught, ever.
export const bookAdd = (book, kind) => ({ ...book, [kind]: (book[kind] || 0) + 1 });
export const found = book => Object.keys(CREATURES).filter(k => book[k] > 0).length;
export function cleanBook(raw) {
  const book = {};
  if (raw && typeof raw === "object") for (const k of Object.keys(CREATURES)) if (Number.isInteger(raw[k]) && raw[k] > 0) book[k] = raw[k];
  return book;
}
