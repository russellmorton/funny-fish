import { test } from "node:test";
import assert from "node:assert/strict";
import { COSTUMES, CHRISTMAS } from "../../src/creatures.js";
import { PLACES, SPOOKY, MERRY } from "../../src/sea.js";

test("at Halloween everyone from the everyday places has a costume", () => {
  for (const p of PLACES) for (const k of p.creatures) {
    const dress = COSTUMES[k];
    assert.ok(dress && (dress.hat || dress.wings || dress.fangs), k);
  }
});

test("the spooky sea's creatures are already dressed for it", () => {
  for (const k of SPOOKY.creatures) assert.equal(COSTUMES[k], undefined, k);
});

test("there's a good mix of witches, bats and vampires", () => {
  const count = type => Object.values(COSTUMES).filter(d => d[type]).length;
  for (const type of ["hat", "wings", "fangs"]) assert.ok(count(type) >= 5, type);
});

test("at Christmas everyone from the everyday places has a Santa hat, antlers or fairy lights", () => {
  for (const p of PLACES) for (const k of p.creatures) {
    const dress = CHRISTMAS[k];
    assert.ok(dress && (dress.hat || dress.antlers || dress.lights), k);
  }
  for (const k of [...SPOOKY.creatures, ...MERRY.creatures]) assert.equal(CHRISTMAS[k], undefined, k);
  const count = type => Object.values(CHRISTMAS).filter(d => d[type]).length;
  for (const type of ["hat", "antlers", "lights"]) assert.ok(count(type) >= 3, type);
});
