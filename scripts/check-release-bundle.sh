#!/usr/bin/env bash
# Fails if demo data, the state gallery or the day values screen end up in
# the release bundle.
# expo export bundles for production (__DEV__ = false) by default.
set -euo pipefail

out="dist/release-check"
rm -rf "$out"
npx expo export --platform ios --output-dir "$out" > /dev/null

if grep -rlaE 'kcalwaage-demo-data|normal30|Zustandsgalerie|kcalwaage-day-values' "$out"; then
  echo "Demo code found in the release bundle (files above)." >&2
  exit 1
fi
echo "Release bundle contains no demo code."
