#!/usr/bin/env bash
# usage: gen.sh <name> "<subject>" <ref images...>
name="$1"; subj="$2"; shift 2
args=(); for r in "$@"; do args+=(-i "$r"); done
cat > "p-$name.txt" <<P
Use your image generation tool. You are designing a die-cut vinyl STICKER for TAAM, a marketing agency, in a streetwear sticker-sheet vibe (bold, punchy, like skate / streetwear brand stickers). The attached images are the TAAM brand illustration style: flat cartoon, thick bold black outlines, white fills, 1930s rubber-hose cartoon feel, no shading, no gradients. Match that line weight exactly. The only brand colours allowed are black #111111, white, and TAAM orange #F46325 (flat, no gradients, no other colours).

Design: $subj

Sticker rules: ONE single compact, chunky shape with an irregular organic outline that will be die-cut around (not a rectangle, not a box, no frame, no border, no background panel). Everything must touch or overlap so it forms one connected silhouette, no floating loose bits far from the main shape. Bold enough to read from 2 metres away. Centred, generous pure white space all around, pure white background, square 1024x1024. Do not draw a white sticker border or cut line, I add that later. The only figure allowed is the TAAM mascot ball character from the reference images (if the design calls for it). no people, no hands, no faces, no silhouettes.

Save the result as out/$name.png in the current directory (copy it there from wherever the tool writes it), then reply with the saved path.
P
timeout 1200 codex exec --skip-git-repo-check -s workspace-write "${args[@]}" - < "p-$name.txt" > "log-$name.txt" 2>&1
echo "$name exit $?"
