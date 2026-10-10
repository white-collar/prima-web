#!/bin/sh
# Renders the PNG icons from the SVG sources in icons/. Needs rsvg-convert
# (brew install librsvg). Run from the repository root: sh tools/make_icons.sh
set -e
cd "$(dirname "$0")/../icons"
rsvg-convert -w 32  -h 32  favicon.svg       -o favicon-32.png
rsvg-convert -w 180 -h 180 icon-maskable.svg -o apple-touch-icon.png   # iOS rounds the corners itself
rsvg-convert -w 192 -h 192 icon.svg          -o icon-192.png
rsvg-convert -w 512 -h 512 icon.svg          -o icon-512.png
rsvg-convert -w 512 -h 512 icon-maskable.svg -o icon-maskable-512.png
# Desktop app (Tauri): one 1024 px source, all platform formats generated from it
rsvg-convert -w 1024 -h 1024 icon-desktop.svg -o ../src-tauri/icon-source.png
(cd .. && npx tauri icon src-tauri/icon-source.png -o src-tauri/icons >/dev/null 2>&1)
rm -rf ../src-tauri/icon-source.png ../src-tauri/icons/ios ../src-tauri/icons/android   # mobile sets are not used
echo "icons written to $(pwd) and ../src-tauri/icons"
