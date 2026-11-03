---
name: explainer-video
description: Make a TAAM animated explainer short (like the backlinks video) in the Constructivist Propaganda print style, timed to a voiceover, and render it to a 9:16 MP4 with sound effects. Use when the user asks for an explainer, animated short, "video like the backlink one", or gives a script/voiceover + transcript to animate.
argument-hint: "<topic or script> [voiceover file] [transcript.json]"
---

# TAAM explainer video (backlinks-short pipeline)

Rebuilds the workflow that made `Downloads\backlinks-short\backlinks-short-9x16.mp4`: a canvas animation in the
1920s Rodchenko / Lissitzky agitprop poster style (cream litho paper, TAAM orange `#F46325` + ink `#111111`, halftone
mascot cut-outs, slanted slabs, stencil numbers, the orange wedge between scenes, grain + vignette on every frame),
every reveal landing on its spoken word, with a synthesized print-shop sound score ducked under the voiceover.

Skill folder: `${CLAUDE_SKILL_DIR}` (call it `$K`).
- `engine/`: reusable parts. Copy, don't edit in place: `harness.js` (H helper lib), `sound.js` (SOUND kit),
  `brands.js` (Simple Icons brand paths as `BRAND[name]` Path2D; SVGs in `brand-icons/`), `player.js` +
  `player_page.html` (player with voiceover loading), `frame.html` (single frame preview), `prep_mascots.py`,
  `build.sh`, `render.js`.
- `example-backlinks/`: the finished backlinks build. `style.js` = BEATS table + all drawing helpers (paper, exInk,
  screenPhoto/paste, slab, slam, numBox, barArrow, knockouts, wedge, scratches, logo, site cards, brand letters...)
  + `explainer()`; `score.js` = `scoreSound(k)`; `sb_page.html` + `sb.js` = storyboard page. **Start every new video
  from a copy of these** and replace the story; keep the medium.
- `reference/original-brief.md`: the user's original brief + reference source. Read the STYLE CARD there if a
  technique is missing from the example.

## Inputs (ask only for what's missing)
1. **Content / script** (from `$ARGUMENTS` or the conversation).
2. **Voiceover audio** (mp3/m4a/wav, usually on the Desktop or in Downloads).
3. **Word timing**: the user's `transcript.json` (`{text, chunks:[{text, timestamp:[start,end]}]}`, usually in
   Downloads) or an SRT. If there's none, ask for one. Read it with
   `node -e "const j=require('./transcript.json');console.log(j.chunks.map((c,i)=>i+' '+c.text.trim()+' '+c.timestamp.join('-')).join('\n'))"`.
   If the transcript and the script differ, trust the transcript (it's what was actually said) and tell the user what differed.
4. Format: **9:16 720x1280 canvas (rendered at 1080x1920)** by default. 16:9 = 1280x720 only if asked.

## House rules (from CLAUDE.md, non-negotiable)
- Imagery = the TAAM rubber-hose mascot (`public/characters/*.png`) and props in flat B&W bold outline only. No people,
  faces, hands, silhouettes, photos or 3D. Brand logos come from `brands.js` (real Simple Icons marks), never redrawn.
- Never "discount / % off / deal / save / sale" on screen.
- Frame 1 is a full-screen title card that is already printed (no slam-in): the scroll-stopper and thumbnail
  (backlinks: YOUR WEBSITE / NEEDS / REFERENCES, leaving at ~0.85 s).
- End card: TAAM wordmark + the takeaway + FOLLOW, ending ~1 s after the last word.
- Keep key content clear of the top ~140 px and bottom ~220 px (Shorts/Reels UI and captions).

## Steps

### 1. Set up a working folder
```bash
K="${CLAUDE_SKILL_DIR}"; W="<scratchpad>/<slug>"; mkdir -p "$W" && cd "$W"
cp "$K"/engine/{harness.js,sound.js,brands.js,player.js,player_page.html,frame.html,build.sh,render.js} .
cp "$K"/example-backlinks/{style.js,score.js,sb_page.html,sb.js} .
python "$K/engine/prep_mascots.py" wave famous phone   # any names from public/characters; writes mascots.js
npm init -y >/dev/null && npm i puppeteer-core ffmpeg-static   # run in background, takes a minute
```
`prep_mascots.py` reads `C:/Users/Theo/Desktop/TAAMBETTER/public/characters/<name>.png`, cuts out the background and
tones it lit from top-left for the halftone screen. Pick poses that fit the story (`ls public/characters`).
Need another brand logo? Get its path from Simple Icons (cdn.jsdelivr.net/npm/simple-icons/icons/<slug>.svg) and add it to `BRAND_D` in `brands.js`.

### 2. BEATS table
Rewrite `BEATS` at the top of `style.js`: one entry per idea `{ id, start, end, said, screen, at: { word: time }, wedge? }`.
Every time in `explainer()` and `scoreSound()` reads from BEATS / `at` word times, never loose numbers, so a new
voiceover take only means editing this table. `DURATION` = last `end` + 1. `wedge: t` on a beat = orange wedge scene change there.

### 3. Draw the explainer
Rewrite the body of `explainer(ctx, W, HH, t)` for the new story using the existing helpers. Rules:
- Pure function of t: randomness only from `H.rng(seed)` / `H.makeNoise(seed)`. Caching static textures is fine.
- Reveals land on their word: lead by up to 0.1-0.2 s (`LEAD`), never lag. Animate "on twos" (`tq`, 1/15 s steps).
- Build one idea per beat, hold the finished state until the sentence ends, change the picture in speech pauses.
  Continuous transforms when the idea builds; the orange wedge when the story moves on. Mix both.
- On-screen text = key words, labels, numbers only. No sentences, no subtitles.
- Sizes at 720 px wide: headlines >= 44 px, labels >= 28 px, key numbers >= 64 px. Fill the frame.
- Keep the print pipeline at the end of `explainer()` untouched: back plate + knockouts, exInk on every plate,
  multiplied plates, pasted halftone mascots, wedge layer, scratches, grain, vignette. That's what makes it look printed.
- Keep frames fast (< ~200 ms) or the render takes forever.

Preview single frames (and check timing with `document.title`):
```bash
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
for t in 0 2.3 8.9; do "$CH" --headless=new --disable-gpu --allow-file-access-from-files --hide-scrollbars --window-size=720,1280 --virtual-time-budget=15000 --screenshot="$(cygpath -w $PWD)\\f_$t.png" "file:///$(cygpath -m $PWD)/frame.html#t=$t" 2>/dev/null; done
```
Then **look at the PNGs** (Read them, or tile them into a contact sheet with PIL) and fix clipping, overlaps,
beams striking through cards/type (use `knock`/`knockText`), and anything too small. Iterate until clean.

### 4. Storyboard, then wait for OK
Update `sb.js` PANELS (one per beat, ~8-13: `b` beat id, `t` key-frame time, `name`, `text` on-screen words,
`flow` how it gets there, `sound`) and the title/header text in `sb_page.html`. Run `bash build.sh --storyboard`,
screenshot `sb_preview.html` (window 1280x1800, `--virtual-time-budget=40000`) and check every panel drew (an empty
grid = a JS error; avoid raw `'` inside sb.js strings, use ’). Publish `storyboard.html` as an Artifact (load the
`artifact-design` skill first) and list any facts/numbers you assumed. **Stop and wait for the user's OK.**

### 5. Sound score
Rewrite `scoreSound(k)` in `score.js`. Same BEATS times as the picture, quantized to the same on-twos frames.
Print-shop palette: press slams for slabs, iron ram for the wedge, rubber/steel stamps, stencil-stamp counters,
paper slaps, beam cracks, short brass blasts only on the 3-4 key hits. Small frequent sounds `{ minor: true }`.
Big hits full volume, placed in pauses or on stressed words.

### 6. Build, publish player, render MP4
```bash
bash build.sh <slug> "<Title>" 720 1280            # -> <slug>.html (artifact) + <slug>.local.html (render)
node render.js <slug>.local.html "<voiceover path>" <slug>-9x16.mp4 > render.log 2>&1   # run_in_background
```
Publish `<slug>.html` as an Artifact (interactive player, drop the voiceover on it). The render does ~1,700 frames
for a 58 s piece and takes roughly 7-12 minutes; watch `render.log` for `frame N/total`, `DONE` or `Error` with Monitor.

### 7. Verify before reporting
```bash
FF=node_modules/ffmpeg-static/ffmpeg.exe
$FF -hide_banner -i <slug>-9x16.mp4 2>&1 | grep -E "Duration|Stream"        # length must equal DURATION
$FF -hide_banner -i <slug>-9x16.mp4 -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"   # ~ -16 LUFS
$FF -y -v error -i <slug>-9x16.mp4 -frames:v 1 -vf scale=360:640 first.png   # title card on frame 1
```
Also pull 4-5 frames across the piece and look at them, and compare `silencedetect` pauses in the output audio
against the transcript gaps to confirm the voice isn't offset. Then copy the MP4, `effects.wav` and the
`.local.html` player (renamed `<slug>.html`) to `Downloads\<slug>\` and tell the user the path, length, loudness,
and what you did/didn't check.

## New voiceover take for an existing video
Re-read the new transcript, update only BEATS / `at` times (and any changed lines), re-preview the frames that moved,
rebuild, re-render. Keep the previous MP4 as `-take1`.

## Background music (if asked)
Slow mechanical factory-style march, 100-110 BPM, minor key, snare/low drums, plucked low strings, no vocals, no
big brass (the score already uses brass on key hits). Sit it about -28 LUFS under the voice.
