import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CREATURES, PLACES, PER_BUCKET, nextPlace, sea, sizeOf, boat, onBoat, pickKind, spawn, swim, hit, nearest,
  lure, approach, refit, bookAdd, found, cleanBook, SPOOKY, journey, isHalloween,
} from "../../src/sea.js";

// a repeatable stand-in for Math.random
function rng(seed = 1) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const SCREENS = [[1280, 720], [412, 839], [915, 412], [768, 1024], [1920, 1080], [320, 568]];

test("every place has its own creatures, and every creature lives somewhere", () => {
  const seen = new Set();
  for (const p of journey(true)) {
    assert.ok(p.creatures.length >= 3, p.id);
    for (const k of p.creatures) { assert.ok(k in CREATURES, k); assert.ok(!seen.has(k), `${k} is in two places`); seen.add(k); }
    assert.ok(p.creatures.some(k => !CREATURES[k].junk), `${p.id} has real fish`);
  }
  assert.deepEqual([...seen].sort(), Object.keys(CREATURES).sort());
  for (const [k, c] of Object.entries(CREATURES)) {
    assert.ok(c.name && c.say, k);
    assert.ok(["fish", "puffer", "crab", "octopus", "star", "turtle", "frog", "duck", "boot", "sock", "penguin", "jelly", "ghost", "pail"].includes(c.shape), k);
    if (c.shape === "fish") assert.ok(c.body && c.fin, k);
  }
});

test("the journey visits every place and comes back round", () => {
  let i = 0;
  const visited = [i];
  for (let n = 0; n < PLACES.length; n++) visited.push(i = nextPlace(i));
  assert.equal(i, 0);
  assert.deepEqual(new Set(visited).size, PLACES.length);
  assert.equal(PER_BUCKET, 5);
});

test("at Halloween the journey goes on from the night sea to the spooky sea and back to the pond", () => {
  const route = journey(true);
  assert.deepEqual(route.map(p => p.id), [...PLACES.map(p => p.id), "spooky"]);
  assert.equal(route[nextPlace(PLACES.length - 1, route)], SPOOKY);
  assert.equal(nextPlace(route.length - 1, route), 0);
  assert.equal(journey(false), PLACES);
});

test("Halloween is all of October, and the address can switch it on or off", () => {
  assert.equal(isHalloween(new Date(2026, 9, 1)), true);
  assert.equal(isHalloween(new Date(2026, 9, 31, 23, 59)), true);
  assert.equal(isHalloween(new Date(2026, 8, 30)), false);
  assert.equal(isHalloween(new Date(2026, 10, 1)), false);
  assert.equal(isHalloween(new Date(2026, 3, 2), "?halloween=1"), true);
  assert.equal(isHalloween(new Date(2026, 9, 20), "?halloween=0"), false);
  assert.equal(isHalloween(new Date(2026, 9, 20), "?halloween=maybe"), true);
});

test("the grown-ups' Halloween switch beats the date, and the address beats the switch", () => {
  assert.equal(isHalloween(new Date(2026, 4, 1), "", true), true);
  assert.equal(isHalloween(new Date(2026, 9, 20), "", false), false);
  assert.equal(isHalloween(new Date(2026, 9, 20), "", null), true);
  assert.equal(isHalloween(new Date(2026, 4, 1), "?halloween=0", true), false);
  assert.equal(isHalloween(new Date(2026, 4, 1), "?halloween=1", false), true);
});

test("on any screen the water sits below the sky, fish fit in it, and the boat fits too", () => {
  for (const [W, H] of SCREENS) {
    const S = sea(W, H), B = boat(S);
    assert.ok(S.top > H * .25 && S.top < H * .4, `${W}x${H}`);
    assert.ok(S.minY > S.top && S.maxY > S.minY && S.maxY < H, `${W}x${H} swimming band`);
    assert.ok(S.s >= 30 && S.s <= 72);
    assert.ok(B.tip.y > 0 && B.tip.y < S.top && B.tip.x < W, `${W}x${H} rod tip on screen`);
    assert.ok(B.y - 105 * B.k > 0, `${W}x${H} captain's hat on screen`);
    assert.ok(onBoat(B, B.x, B.y - 10) && !onBoat(B, B.x, S.maxY) && !onBoat(B, 5, B.y));
  }
});

test("new fish swim in from the edge facing the screen, or start somewhere in the water", () => {
  const r = rng(7);
  for (const [W, H] of SCREENS) {
    const S = sea(W, H);
    for (const place of journey(true)) for (let i = 0; i < 40; i++) {
      const f = spawn(S, place, r);
      assert.ok(place.creatures.includes(f.kind));
      assert.ok(f.dir > 0 ? f.x < 0 : f.x > W, "starts off screen");
      assert.ok(f.y > S.top && f.y < H, `${f.kind} in the water`);
      assert.equal(f.size, sizeOf(f.kind, S));
      const g = spawn(S, place, r, [], true);
      assert.ok(g.x >= g.size && g.x <= W - g.size, "inside starts on screen");
    }
  }
});

test("fish swim across and are gone once past the far side", () => {
  const S = sea(1280, 720), f = spawn(S, PLACES[0], rng(3));
  let t = 0, ok = true;
  while (ok && t < 120) { ok = swim(f, .05, S, t); t += .05; }
  assert.ok(!ok, "it got there");
  assert.ok(f.dir > 0 ? f.x > S.W : f.x < 0);
});

test("the sea stays varied: kinds already swimming are picked last, junk less often", () => {
  const r = rng(11), place = PLACES[1];
  for (let i = 0; i < 100; i++) assert.equal(pickKind(place, r, ["coolfish", "puffer", "crab"]), "boot");
  const counts = {};
  for (let i = 0; i < 8000; i++) { const k = pickKind(place, r); counts[k] = (counts[k] || 0) + 1; }
  assert.ok(counts.boot < counts.crab * .7, JSON.stringify(counts));
  assert.ok(counts.boot > 0);
});

test("a tap near a fish picks it, with slack for little fingers; far away picks nothing", () => {
  const S = sea(1280, 720);
  const a = { kind: "goldfish", x: 300, y: 400, size: 50, state: "swim" }, b = { kind: "frog", x: 600, y: 400, size: 50, state: "swim" };
  assert.equal(hit([a, b], 340, 430), a);
  assert.equal(hit([a, b], 450, 400), null);
  assert.equal(hit([{ ...a, state: "hooked" }], 300, 400), null);
  assert.equal(nearest([a, b], 520, 380, S), b);
  assert.equal(nearest([{ ...b, x: -100 }, a], 0, 400, S), a, "prefers fish you can see");
});

test("a lured fish always reaches the worm within a second, mouth first", () => {
  const r = rng(5);
  for (const [W, H] of SCREENS) {
    const S = sea(W, H);
    for (let i = 0; i < 50; i++) {
      const f = spawn(S, PLACES[i % 5], r, [], i % 2 === 0);
      const hx = S.s + r() * (W - 2 * S.s), hy = S.minY + r() * (S.maxY - S.minY);
      lure(f, hx, hy, S);
      let t = 0;
      while (!approach(f, hx, hy, 1 / 60) && t < 5) t += 1 / 60;
      assert.ok(t <= 1, `${W}x${H}: took ${t.toFixed(2)}s`);
      assert.ok(Math.abs(f.x + f.dir * f.size * .8 - hx) < 1e-6 && Math.abs(f.y - hy) < 1e-6, "mouth on the hook");
      assert.equal(f.dir, hx >= f.x ? 1 : -1, "facing the worm");
    }
  }
});

test("fish keep their place in the sea when the screen turns", () => {
  const A = sea(1280, 720), B = sea(412, 839), r = rng(9);
  for (let i = 0; i < 50; i++) {
    const f = spawn(A, PLACES[i % 5], r, [], true);
    refit(f, A, B);
    assert.ok(f.x >= 0 && f.x <= B.W && f.y > B.top && f.y < B.H, f.kind);
    assert.equal(f.size, sizeOf(f.kind, B));
  }
});

test("the fish book counts catches and survives junk in storage", () => {
  let book = {};
  book = bookAdd(book, "goldfish"); book = bookAdd(book, "goldfish"); book = bookAdd(book, "crab");
  assert.deepEqual(book, { goldfish: 2, crab: 1 });
  assert.equal(found(book), 2);
  assert.deepEqual(cleanBook({ goldfish: 3, shark: 2, crab: -1, frog: "1", duck: 1.5 }), { goldfish: 3 });
  assert.deepEqual(cleanBook(null), {});
  assert.deepEqual(cleanBook("nope"), {});
});
