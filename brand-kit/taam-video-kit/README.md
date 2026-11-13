# TAAM editing kit for HyperFrames

Reusable motion graphics in the TAAM website style: Montserrat 900 all-caps, orange `#F46325` / ink `#111111`, white type, outline type for statements, the halftone dot screen and the black-and-white rubber-hose mascot. The brand is carried by more than the mascot: a set of props drawn in the same bold-outline style, the A-mark, outline type, the orange marker and the halftone screen. `index.html` is a 39 s demo reel that uses every block.

```bash
npm run dev      # preview and edit in the browser
npm run check    # lint, layout and motion checks
npm run render   # render index.html to MP4
```

## Blocks (`compositions/`)

| Block | What it is | Ground | Variables |
| --- | --- | --- | --- |
| `taam-title.html` | Title card. Text shows from frame 0 so it works as a thumbnail; a mascot jumps in | full frame | `eyebrow`, `line1`, `line2` (outline), `tone` orange/ink, `pose`, `hold` |
| `taam-lower-third.html` | Name bar; the peek mascot pops up over it | transparent | `name`, `role`, `mascot` on/off, `hold` |
| `taam-callout.html` | Mascot points at a white tip card | transparent | `eyebrow`, `text`, `side` right/left, `pose`, `hold` |
| `taam-captions.html` | Word-by-word captions; the spoken word lights up orange | transparent | `words` (JSON), `maxWords`, `placement` low/vertical |
| `taam-ticker.html` | Tilted marquee band, solid and outline items alternating | transparent | `items` (comma list), `position` low/middle/top, `hold` |
| `taam-chapter.html` | Chapter card: outline number, orange rule, title | full frame ink | `number`, `eyebrow`, `title`, `hold` |
| `taam-stat.html` | Big number that counts up, with an outlined label | full frame | `value`, `decimals`, `prefix`, `suffix`, `label`, `tone`, `pose`, `hold` |
| `taam-transition.html` | Orange and ink slash wipe with the TAAM mark, 1.2 s | transparent | `mark` on/off |
| `taam-end-card.html` | Wordmark, takeaway, CTA pill, URL, waving mascot | full frame ink | `line1`, `line2`, `cta`, `url`, `pose` |
| `taam-sticker.html` | A prop slaps onto the footage as a die-cut sticker, with an orange tag | transparent | `prop`, `label`, `x`, `y`, `size`, `tilt`, `hold` |
| `taam-icon-row.html` | Three props on white cards with a word each (Found / Called / Booked) | full frame | `headline`, `prop1`–`3`, `word1`–`3`, `tone`, `hold` |
| `taam-word.html` | One-word punch: the word solid on an orange marker, outline echoes above and below | full frame | `word`, `sub`, `tone` ink/orange, `hold` |
| `taam-bug.html` | Corner logo bug, the A-mark spins once every 8 s; mount it across the whole edit | transparent | `label`, `corner`, `hold` |
| `taam-progress.html` | Progress bar on the bottom edge with the A-mark rolling along it | transparent | `length` |

**Art.** Anywhere a block has a `pose`, it takes a mascot pose, a prop or `none`.

- Mascot poses (`assets/characters/`, from the website): `wave`, `peek`, `chill` (pointing), `phone`, `famous` (trophy), `counting`, `money-gun`, `sitting` (coin flip), `fishing`.
- Props (`assets/props/`, drawn with Codex): `phone-ringing`, `map-pin`, `search-bar`, `megaphone`, `stars`, `browser`, `growth`, `calendar`, `clapper`, `notify`, `coffee-cup`, `burst` (an empty starburst badge to put text on).
- Doodle arrows (`assets/doodles/arrow-1` to `arrow-6`), ready to point at things in footage.

## Making new art with Codex

`art-src/gen.sh` asks Codex for one prop in the house style, using existing TAAM art as the line-weight reference. `art-src/cutout.py` removes the white background and saves a trimmed webp.

```bash
cd art-src
./gen.sh trophy "a chunky trophy cup with two handles and sparkle marks"
python cutout.py props/trophy.png ../assets/props/trophy.webp
```

Then add the name to the `pose` lists in the blocks that should offer it. Look at every image before using it: no people, faces, hands or silhouettes.

## Using a block

Mount it in `index.html` with a host `div`. Give each host its own `id`, and set its values in `data-variable-values`:

```html
<div id="guest-name"
  data-composition-id="taam-lower-third"
  data-composition-src="compositions/taam-lower-third.html"
  data-variable-values='{"name":"Jane Doe","role":"Owner · Doe Plumbing","hold":4}'
  data-start="12" data-duration="4"
  data-track-index="2" data-track-kind="graphics"
  data-width="1920" data-height="1080" style="z-index:3"></div>
```

- **`hold` must match the host's `data-duration`.** The block times its exit from `hold`.
- **Transitions:** start the host 0.55 s before your cut. The frame is fully covered from 0.45 s to 0.75 s.
- **Captions:** run `npx hyperframes transcribe your-video.mp4 --model small.en`, then paste the words into `words` as `[{"text":"Hello","start":0.2,"end":0.5}, …]`. Times count from the captions host's `data-start`. Put the captions host on its own `data-track-kind="captions"` track. Captions and the lower third both sit at the bottom, so don't run them at the same time.
- **Stacking:** footage `z-index:1`, full-frame cards 2, overlays and stickers 3, captions 4, logo bug 5, progress bar 9, transitions 10.
- **Footage:** the grey `.plate` divs in the demo stand in for real clips. Swap each one for
  `<video id="clip-1" class="clip" src="assets/your-clip.mp4" data-start="4" data-duration="7" data-track-index="0" data-has-audio="true" playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1"></video>`.

## Vertical (9:16)

Every block sizes from the frame (`cqmin`/`cqw` units), so it can mount in a 1080×1920 root. Set `placement: "vertical"` on the captions. Layouts are tuned for 16:9; look at a vertical render before you ship one.

## Sound

Sound effects live in `assets/sfx/` (Openverse, CC0 and CC BY). Each `<audio>` in the demo starts so the sound's peak lands one frame after the action it belongs to: pops on badges and cards, a slap on stickers and the word punch, whooshes on the wipes, a boing when the mascot lands, one impact on the stat payoff. **Credit the CC BY sounds listed in `assets/sfx/CREDITS.md` wherever a video using them is published.**

The music bed is `assets/bgm/groove.mp3` (HeyGen catalog, 105 BPM). It starts at 9.165 s into the file (`data-media-start`), where the full groove drops on a bar line, and fades out over the last 2 s. The final mix measures −15.9 LUFS with a −1.0 dBTP peak, inside the −16 to −14 LUFS social range; hits sit about 3–6 dB over the bed. `cartoon-boing-loud` and `air-whoosh-short-loud` are the downloaded files boosted by 18 dB, because the originals were recorded very quietly.

New music: sign in (`npx hyperframes auth login`, free), then run the audio engine with a `bgm.query` describing the feel and tempo. Find the track's drop and set `data-media-start` to it rather than starting on a quiet intro.

Rendering and the audio check need FFmpeg on PATH: `winget install --id Gyan.FFmpeg -e`. The demo renders to `renders/taam-kit-demo.mp4` with `npm run render -- --output renders/taam-kit-demo.mp4`.

## House rules

- Imagery is the TAAM mascot and props in its flat black-and-white style only. No people, faces, hands or photos in the graphics. New poses: generate with Codex from the existing PNGs, prompt ending "no people, no hands, no faces, no silhouettes".
- No "discount", "% off", "deal", "save" or "sale" in any on-screen copy.
