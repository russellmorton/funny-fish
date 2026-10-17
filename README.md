# Funny Fish

A fishing adventure for toddlers. A bear in a rain hat sits in a little red boat. Tap anywhere in the water and the hook drops there. The nearest fish always swims over and bites, so every tap catches something. The catch is reeled up and does something silly: a pufferfish puffs up, a starfish spins, a crab snaps its claws, an old boot gets stink lines. Its name is spoken and it goes in the bucket.

Five catches fill the bucket. Then the boat sails on to the next place, each with its own creatures:

1. **The lily pond:** a goldfish with a bow, a catfish with cat ears, a frog and a rubber duck
2. **The big blue sea:** a cool fish in sunglasses, a pufferfish, a crab and an old boot
3. **The coral reef:** a clownfish with a honky nose, an octopus in a top hat, a starfish and a turtle
4. **The icy sea:** a fish in a woolly hat, a narwhal, a penguin in a scarf and a smelly sock
5. **The night sea:** a glowing jellyfish, an anglerfish with its lamp, a king fish with a crown and a moustache, and a sleepy fish in a nightcap

After the night sea the boat sails back to the pond.

Made for little hands:

- There is no losing and no timer, and nothing to read. Tapping right on a fish catches that fish. Tapping anywhere else in the water still catches the nearest one.
- Every tap does something. Tapping the boat toots its horn, and taps during a catch make bubbles or sparkles.
- If nobody taps for a while, rings pulse round a fish and the game says "Tap the water to catch a fish!"
- Everything spoken also shows in a caption at the bottom.
- The **fish book** (top right) keeps a sticker of every creature you've ever caught, with a count. Tap a sticker to hear it again. Creatures you haven't caught yet show as grey shapes.
- The buttons for grown-ups are sound on/off and full screen. The fish book, the current place and the sound setting are remembered in the browser. The screen is kept awake while playing.

Keyboard: Enter or Space on the sea casts for a fish.

## Running it

No build step. It's a static page with plain ES modules.

```sh
npm install
npm start          # http://localhost:4173
```

## Tests

```sh
npm run test:unit  # places, creatures, swimming, biting, the fish book (node:test)
npm run test:e2e   # plays the game in Chromium, desktop and phone sizes (Playwright)
npm test           # both
```

## Layout

- `index.html`: markup and styles
- `src/sea.js`: the rules (places, creatures, where fish swim, which one bites, the fish book)
- `src/creatures.js`: canvas drawings of every creature and its funny extras
- `src/scene.js`: canvas drawing for each place, the boat and its captain, and the fishing line
- `src/game.js`: everything else, including the catch sequence, input, sound, voice, the bucket and the book

## Deploying

Vercel serves the repo root as a static site (`vercel.json`), and `.vercelignore` keeps tests and tooling out. GitHub Actions runs the tests on every push and pull request. Vercel Web Analytics (`src/analytics.js`) counts visits to the live site, without cookies.

All the sounds are synthesised in the browser, and the full-bucket jingle is an original tune written for the game.
