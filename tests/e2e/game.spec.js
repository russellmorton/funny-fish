import { test, expect } from "@playwright/test";
import { sea, boat, PLACES, CREATURES } from "../../src/sea.js";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
});
test.afterEach(() => expect(errors).toEqual([]));

const state = page => page.evaluate(() => document.body.dataset.state);
const caught = page => page.locator("#bucket li.full");

async function play(page) {
  await page.locator("#title-screen").click();
  await expect(page.locator("#title-screen")).toBeHidden();
  await expect.poll(() => state(page)).toBe("fish");
}
// The sea as the game lays it out, in page coordinates.
async function geometry(page) {
  const v = page.viewportSize();
  const S = sea(v.width, v.height);
  return { S, B: boat(S), water: (fx, fy) => ({ x: v.width * fx, y: S.top + (S.maxY - S.top) * fy }) };
}
// Taps the water and waits for whatever bites to be shown off, then taps it into the bucket.
async function catchOne(page, fx = .3, fy = .6) {
  const { water } = await geometry(page);
  const before = await caught(page).count();
  const p = water(fx, fy);
  await page.mouse.click(p.x, p.y);
  await expect.poll(() => state(page), { timeout: 5000 }).toBe("show");
  await page.waitForTimeout(800);
  await page.mouse.click(p.x, p.y);
  await expect.poll(() => state(page)).not.toBe("stow");
  if (before < 4) await expect(caught(page)).toHaveCount(before + 1);
}

test("the title shows until you tap, then the game says what to do", async ({ page }) => {
  await expect(page.locator("#title")).toHaveAttribute("aria-label", "Funny Fish");
  await expect.poll(() => state(page)).toBe("title");
  await play(page);
  await expect(page.locator("#caption")).toHaveText("Let's go fishing! Tap the water.");
});

test("tapping anywhere in the water always catches something from this place", async ({ page }) => {
  await play(page);
  await catchOne(page, .8, .9);
  const kind = await caught(page).first().getAttribute("data-kind");
  expect(PLACES[0].creatures).toContain(kind);
  await expect(page.locator("#caption")).toHaveText(CREATURES[kind].say);
  await expect(caught(page).first()).toHaveAttribute("aria-label", new RegExp(CREATURES[kind].name, "i"));
});

test("the catch goes into the bucket by itself if you don't tap", async ({ page }) => {
  await play(page);
  const { water } = await geometry(page);
  const p = water(.5, .5);
  await page.mouse.click(p.x, p.y);
  await expect.poll(() => state(page), { timeout: 5000 }).toBe("show");
  await expect(caught(page)).toHaveCount(1, { timeout: 6000 });
  await expect.poll(() => state(page)).toBe("fish");
});

test("tapping the boat toots the horn instead of casting", async ({ page }) => {
  await play(page);
  const { B } = await geometry(page);
  await page.mouse.click(B.x - 8 * B.k, B.y - 88 * B.k);   // the captain's hat, out of reach of a floating duck
  await page.waitForTimeout(300);
  expect(await state(page)).toBe("fish");
});

test("five fish fill the bucket, and the boat sails on to the next place", async ({ page }) => {
  test.setTimeout(120_000);
  await play(page);
  for (let i = 0; i < 5; i++) await catchOne(page, .2 + i * .15, .3 + (i % 3) * .25);
  await expect.poll(() => state(page)).toBe("party");
  await expect(page.locator("#caption")).toHaveText("Your bucket is full! Let's sail to the big blue sea!");
  await expect.poll(() => state(page), { timeout: 6000 }).toBe("sail");
  await expect.poll(() => state(page), { timeout: 8000 }).toBe("fish");
  await expect(page.locator("body")).toHaveAttribute("data-place", "sea");
  await expect(caught(page)).toHaveCount(0);
  await expect(page.locator("#caption")).toHaveText("Welcome to the big blue sea!");

  // the boat is still there after a reload, and the book remembers all five
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-place", "sea");
  await page.getByRole("button", { name: "Fish book" }).click();
  const stickers = page.locator(".sticker:not(.no)");
  const total = await stickers.evaluateAll(els => els.reduce((n, b) => n + +b.querySelector(".n").textContent.slice(1), 0));
  expect(total).toBe(5);
});

test("the fish book shows what you've caught and hides the rest", async ({ page }) => {
  await play(page);
  await catchOne(page);
  const kind = await caught(page).first().getAttribute("data-kind");
  await page.getByRole("button", { name: "Fish book" }).click();
  const dialog = page.getByRole("dialog", { name: "Fish book" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".sticker")).toHaveCount(Object.keys(CREATURES).length);
  await expect(dialog.locator(".sticker:not(.no)")).toHaveCount(1);
  await expect(dialog.locator(`.sticker[data-kind="${kind}"]`)).toHaveAttribute("aria-label", new RegExp(`${CREATURES[kind].name}, caught 1`, "i"));
  await expect(dialog.getByText(`1 of ${Object.keys(CREATURES).length} found`)).toBeVisible();
  await dialog.locator(`.sticker[data-kind="${kind}"]`).click();
  await expect(page.locator("#caption")).toHaveText(CREATURES[kind].say);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("sound can be turned off, and stays off", async ({ page }) => {
  const mute = page.locator("#mute");
  await expect(mute).toHaveAttribute("aria-pressed", "false");
  await mute.click();
  await expect(mute).toHaveAttribute("aria-pressed", "true");
  await expect(mute).toHaveAttribute("aria-label", "Sound off");
  await page.reload();
  await expect(page.locator("#mute")).toHaveAttribute("aria-pressed", "true");
});

test("Enter on the sea casts for a fish", async ({ page }) => {
  await play(page);
  await page.locator("#sea").focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => state(page), { timeout: 5000 }).toBe("show");
});

test("nothing spills off the side of the screen", async ({ page }) => {
  await play(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  const hud = await page.locator(".hud").boundingBox();
  const right = await page.locator(".btns").boundingBox();
  expect(right.x + right.width).toBeLessThanOrEqual(hud.width);
  const bucket = await page.locator(".bucket").boundingBox();
  expect(bucket.x + bucket.width).toBeLessThan(right.x);
});
