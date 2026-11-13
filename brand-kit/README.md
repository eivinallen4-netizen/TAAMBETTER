# TAAM brand kit

Everything for making on-brand TAAM work: docs, posters, flyers, slides, social posts, pictures and videos. This folder is self-contained. Copy it (or `TAAM_brand_kit.zip`, which sits next to this folder) to any computer and it works.

## Start here
| File | Use it for |
| --- | --- |
| [TAAM_BRAND_KIT.md](TAAM_BRAND_KIT.md) | Paste into a chat or project for docs, posters, slides, social, pictures. |
| [TAAM_BRAND_AND_VIDEO_KIT.md](TAAM_BRAND_AND_VIDEO_KIT.md) | Brand kit + video editing kit in one file, for a project that does everything. |
| [company-info.md](company-info.md) | Long-form company background (colors in it are outdated; use the brand kit's). |

**In a Claude project:** add `TAAM_BRAND_AND_VIDEO_KIT.md` to the project instructions/knowledge, then upload the logos, mascot poses and props you want it to use (from `assets/`).

## What's in the folder
```
brand-kit/
├─ TAAM_BRAND_KIT.md              brand rules (voice, colors, type, imagery, layout)
├─ TAAM_BRAND_AND_VIDEO_KIT.md    brand rules + video kit guide
├─ company-info.md
├─ assets/
│  ├─ logos/          PNG lockups, transparent/, svg/ (A-mark + wordmarks)
│  ├─ app-icon/       app icon, .ico, favicons
│  ├─ colors/         TAAM_colors.css, hex list, swatches, palette
│  ├─ fonts/          Montserrat Medium / Bold / ExtraBold / Black .ttf
│  ├─ typography/     type sheet
│  ├─ brand-board/    full original board
│  ├─ mascot/         9 poses, PNG + WebP
│  ├─ props/          12 props in the mascot style
│  ├─ doodles/        6 hand-drawn arrows
│  ├─ icons/          9 service icons (SVG)
│  ├─ stickers/       25 die-cut stickers (logo + racing set)
│  └─ art-prompts/    references/ (images to give Codex) + stickers/ (prompts + scripts)
└─ taam-video-kit/    the full HyperFrames editing kit (blocks, art, sound, music)
```

## Setting up on a new computer

**Docs, posters, pictures:** nothing to install. Install the fonts in `assets/fonts/` (double-click each .ttf → Install). For body text in Montserrat Regular, also install Montserrat from fonts.google.com/specimen/Montserrat (free).

**Video kit** (`taam-video-kit/`), install once:
1. Node.js LTS: `winget install OpenJS.NodeJS.LTS` (Mac: `brew install node`)
2. FFmpeg: `winget install --id Gyan.FFmpeg -e` (Mac: `brew install ffmpeg`)
3. Then in `taam-video-kit/`: `npm run dev` to preview, `npm run render` to make the MP4. The pinned HyperFrames version downloads itself on first run.
4. Optional, for AI captions: `npx hyperframes transcribe your-video.mp4 --model small.en`.

**Making new props/stickers** (optional):
1. Python 3 with Pillow and NumPy: `pip install pillow numpy`
2. Codex CLI, signed in (`npm i -g @openai/codex`, then `codex login`)
3. Video props: `cd taam-video-kit/art-src && ./gen.sh trophy "a chunky trophy cup"` then `python cutout.py props/trophy.png ../assets/props/trophy.webp`. On Windows run `gen.sh` from Git Bash.
4. Every prompt ends "no people, no hands, no faces, no silhouettes". Check every output.

**Sound credits:** CC BY sounds must be credited where a video is published. List: `taam-video-kit/assets/sfx/CREDITS.md`.

## Keeping it in sync
If you edit `TAAM_BRAND_KIT.md` or the video kit README, rebuild the combined file (ask Claude to "rebuild the combined brand + video kit file").
