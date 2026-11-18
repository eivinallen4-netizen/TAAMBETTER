#!/bin/bash
# Generate industry props for the stories with Codex image_gen (TAAM bold-outline black-and-white style).
# Run: bash gen-assets.sh            (all)   |   bash gen-assets.sh ac-unit   (one)
# House rule: no people, no hands, no faces, no silhouettes. Check every output before using it.
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/assets"; mkdir -p "$OUT" "$HERE/assets/_logs"
REF="$HERE/../../public/characters"

STYLE='Style: TAAM brand prop illustration. Flat 1930s rubber-hose cartoon style matching the reference images exactly: thick bold black outlines (same weight as the reference), solid white fills, small black shading accents, no grey, no colour, no gradients, no texture. A single object, centred, filling about 85% of the frame, slight playful tilt, a couple of small motion/sparkle lines allowed. Fully transparent background (real alpha), no ground shadow, no frame, no border. The reference images are only for line style: do NOT draw the round mascot character.'

gen () {
  name=$1; subject=$2
  [ -n "$ONLY" ] && [ "$ONLY" != "$name" ] && return
  [ -f "$OUT/$name.png" ] && { echo "skip $name (exists)"; return; }
  codex exec --skip-git-repo-check --ephemeral -s workspace-write -c model_reasoning_effort="low" -C "$OUT" \
    -i "$REF/money-gun.png" -i "$REF/phone.png" -o "$OUT/_logs/$name.md" \
    "Use your built-in image_gen tool to generate one square image with a transparent background.
Use case: logo-brand
Asset type: transparent sticker prop for Instagram story templates
Subject: $subject
$STYLE
Avoid: no people, no human hands, no faces, no silhouettes, no mascot, no text unless stated, no photo, no 3D.
no people, no hands, no faces, no silhouettes
Then copy the generated PNG from \$CODEX_HOME/generated_images into the current working directory as $name.png. Do not overwrite an existing file. Reply with only the final saved path." \
    </dev/null > "$OUT/_logs/$name.log" 2>&1 && echo "done $name"
}
ONLY="$1"

# movers & junk removal
gen boxes       'a tall stack of three taped cardboard moving boxes, the top one with a small "this side up" arrow, no words' &
gen hand-truck  'a two-wheel hand truck dolly carrying two taped cardboard moving boxes, standing upright' &
gen moving-truck 'a boxy moving truck seen from the side, with a big blank cargo box and round wheels, motion lines behind it' &
gen junk-pile   'a junk pile: an old worn couch with a mattress leaning on it, a broken chair and a few loose boxes stacked on top' &
# hvac
gen ac-unit     'an outdoor air conditioner condenser unit (square box with a big round top fan grille and side fins) with small snowflake sparkles' &
gen thermostat  'a round wall thermostat dial showing the number "72°" in the middle in bold, with small tick marks around the ring' &
wait
gen hvac-tools  'a large adjustable wrench crossed with a refrigerant pressure gauge on a hose' &
gen snow-flame  'a big bold snowflake and a big flame side by side, touching, as one badge icon' &
# taam (video marketing)
gen film-camera 'a cinema video camera on a short tripod with a big lens and a round film reel on top' &
gen clapper     'a film clapperboard, slightly open, with black-and-white diagonal stripes on the clapper, no words' &
gen phone-play  'a smartphone standing upright with a big play-button triangle on the screen and two small hearts floating up from it' &
gen megaphone   'a megaphone / bullhorn pointing right with bold sound-wave lines coming out' &
wait
ls "$OUT"
