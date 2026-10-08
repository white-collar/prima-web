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
echo "icons written to $(pwd)"
