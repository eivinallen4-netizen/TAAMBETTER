#!/usr/bin/env bash
# Assemble pages from the working folder's parts (run inside the working folder).
#   bash build.sh --storyboard           -> storyboard.html (artifact) + sb_preview.html (local check)
#   bash build.sh <name> "<Title>" W H   -> <name>.html (artifact: no doctype, the publisher wraps it) + <name>.local.html (render)
set -e
if [ "$1" = "--storyboard" ]; then
  cat harness.js mascots.js brands.js style.js sb.js > _all.js
  node --check _all.js
  { cat sb_page.html; echo "<script>"; cat _all.js; echo "</script>"; } > storyboard.html
  { echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">'; cat storyboard.html; echo '</html>'; } > sb_preview.html
  ls -la storyboard.html sb_preview.html
  exit 0
fi
NAME=${1:?name}; TITLE=${2:?title}; W=${3:-720}; H=${4:-1280}
cat harness.js sound.js mascots.js brands.js style.js score.js player.js > _p.js
node --check _p.js
{ sed -e "s#{{TITLE}}#$TITLE#g" -e "s#{{W}}#$W#g" -e "s#{{H}}#$H#g" player_page.html; echo "<script>"; cat _p.js; echo "</script>"; } > "$NAME.html"
{ echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'; cat "$NAME.html"; echo '</html>'; } > "$NAME.local.html"
ls -la "$NAME.html" "$NAME.local.html"
