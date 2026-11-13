#!/usr/bin/env bash
# usage: gen.sh <name> "<subject description>"
name="$1"; subj="$2"
cat > "p-$name.txt" <<P
Use your image generation tool. The attached images are the TAAM brand illustration style: flat black-and-white cartoon, thick bold black outlines, white fills, 1930s rubber-hose cartoon feel, solid black only for small accents, no shading, no grey, no gradients, no text or letters. The third image is a finished prop in this style; match its line weight exactly. Generate ONE new image in exactly that style: $subj. Only the object, centred, generous white space around it, pure white background, square. no people, no hands, no faces, no silhouettes. Save the result as props/$name.png in the current directory (copy it there from wherever the tool writes it), then reply with the saved path.
P
timeout 900 codex exec --skip-git-repo-check -s workspace-write -i phone.png -i famous.png -i props/phone-ringing.png - < "p-$name.txt" > "log-$name.txt" 2>&1
echo "$name exit $?"
