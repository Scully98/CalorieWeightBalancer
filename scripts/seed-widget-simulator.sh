#!/bin/sh
# Writes the golden test case into the widget file of the booted Simulator, so
# the widget shows the numbers of the design without Health data. Opening the
# app afterwards overwrites the file with the real (empty) balance.
set -e
cd "$(dirname "$0")/.."
group=$(xcrun simctl get_app_container booted com.scully98.unrestart groups |
  awk '/group.com.scully98.unrestart/ { print $2 }')
if [ -z "$group" ]; then
  echo "App with App Group not installed in the booted Simulator." >&2
  exit 1
fi
mkdir -p "$group/widget"
fixture=src/features/widget/__fixtures__/snapshot-golden.json
# Default: single value as in .claude/design/widget/small-1b.png, not stale.
# --range: with tolerance. --stale: with „Stand 24. Okt, 08:14“.
single='s/"range": "[^"]*"/"range": null/; s/"fat": "ca. +0,3 bis +2,5 kg Körperfett"/"fat": "ca. +0,9 kg Körperfett"/'
fresh='s/"staleAfter": "[^"]*"/"staleAfter": null/'
case "$1" in
  --range) sed -e "$fresh" "$fixture" ;;
  --stale) sed -e "$single" "$fixture" ;;
  *) sed -e "$single" -e "$fresh" "$fixture" ;;
esac >"$group/widget/snapshot.v1.json"
echo "Wrote $group/widget/snapshot.v1.json"
