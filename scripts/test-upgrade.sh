#!/usr/bin/env bash
set -euo pipefail
package=com.qiangzi0303.growing
test_apk=app/build/outputs/apk/androidTest/release/app-release-androidTest.apk
adb install -r "dist/growing-${GROWING_VERSION_NAME}.apk"
adb install -r -t "$test_apk"
mkdir -p test-results
adb shell am instrument -w -r -e class "$package.UpgradeTest#seed" "$package.test/androidx.test.runner.AndroidJUnitRunner" > test-results/before-upgrade.txt
cat test-results/before-upgrade.txt
grep -q 'OK (1 test)' test-results/before-upgrade.txt
GROWING_VERSION_CODE=$((GROWING_VERSION_CODE+1)) gradle --no-daemon assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell am instrument -w -r -e class "$package.UpgradeTest#verify" "$package.test/androidx.test.runner.AndroidJUnitRunner" > test-results/after-upgrade.txt
cat test-results/after-upgrade.txt
grep -q 'OK (1 test)' test-results/after-upgrade.txt
adb shell am instrument -w -r -e class "$package.SpeechTest" "$package.test/androidx.test.runner.AndroidJUnitRunner" > test-results/speech.txt
cat test-results/speech.txt
grep -q 'OK (1 test)' test-results/speech.txt
echo 'Verified: fixed-signature overwrite update preserved login, password hashes, both subjects and account isolation.'
