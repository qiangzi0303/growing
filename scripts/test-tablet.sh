#!/usr/bin/env bash
set -euo pipefail
mkdir -p test-results
trap 'adb shell wm size reset; adb shell wm density reset' EXIT
# 800 x 1280 dp tablet and 600 x 800 dp narrow tablet window.
for display in 1600x2560 1200x1600; do
  adb shell wm size "$display"
  adb shell wm density 320
  adb shell am instrument -w -r -e class com.qiangzi0303.growing.TabletTest \
    com.qiangzi0303.growing.test/androidx.test.runner.AndroidJUnitRunner > "test-results/tablet-${display}.txt"
  cat "test-results/tablet-${display}.txt"
  grep -q 'OK (2 tests)' "test-results/tablet-${display}.txt"
done
echo 'Verified: tablet portrait, landscape and narrow-window forms and live lesson drafts.'
