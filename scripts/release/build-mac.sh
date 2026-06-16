#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

TAG=""
SKIP_INSTALL=0
INIT_IOS=0
SKIP_IOS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag) TAG="${2:-}"; shift 2 ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    --init-ios) INIT_IOS=1; shift ;;
    --skip-ios) SKIP_IOS=1; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

[[ -n "$TAG" ]] || { echo "Usage: $0 --tag v1.2.0 [--skip-install] [--init-ios] [--skip-ios]" >&2; exit 1; }
[[ "$(uname -s)" == "Darwin" ]] || { echo "This script must run on macOS." >&2; exit 1; }

for command in git node npm xcodebuild; do
  command -v "$command" >/dev/null || { echo "Required command not found: $command" >&2; exit 1; }
done

HEAD_COMMIT="$(git rev-parse HEAD)"
TAG_COMMIT="$(git rev-list -n 1 "$TAG" 2>/dev/null || true)"
[[ -n "$TAG_COMMIT" ]] || { echo "Tag '$TAG' does not exist locally. Fetch tags before building." >&2; exit 1; }
[[ "$HEAD_COMMIT" == "$TAG_COMMIT" ]] || { echo "HEAD is not the commit referenced by $TAG." >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo "The worktree is dirty. Commit or stash changes before producing a release." >&2; exit 1; }

export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:7897}"
export HTTP_PROXY="${HTTP_PROXY:-$HTTPS_PROXY}"

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  npm ci
fi

OUTPUT_DIR="$ROOT/release-artifacts/$TAG/apple-mobile"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

npm run desktop:make:proxy

DMG="$(find "$ROOT/out/make" -type f -name '*.dmg' -print -quit)"
MAC_ZIP="$(find "$ROOT/out/make" -type f -name '*.zip' -path '*zip*' -print -quit)"
[[ -n "$DMG" ]] || { echo "The macOS DMG was not generated." >&2; exit 1; }
[[ -n "$MAC_ZIP" ]] || { echo "The macOS ZIP was not generated." >&2; exit 1; }
cp "$DMG" "$OUTPUT_DIR/todo-matrix-$TAG-macos.dmg"
cp "$MAC_ZIP" "$OUTPUT_DIR/todo-matrix-$TAG-macos.zip"

for variable in ANDROID_KEYSTORE_PATH ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS ANDROID_KEY_PASSWORD; do
  [[ -n "${!variable:-}" ]] || { echo "$variable is required for a signed Android release." >&2; exit 1; }
done

npm run build:android
(
  cd android
  ./gradlew clean assembleRelease bundleRelease
)

APK="$(find "$ROOT/android/app/build/outputs/apk/release" -type f -name '*.apk' -print -quit)"
AAB="$(find "$ROOT/android/app/build/outputs/bundle/release" -type f -name '*.aab' -print -quit)"
[[ -n "$APK" ]] || { echo "The signed Android APK was not generated." >&2; exit 1; }
[[ -n "$AAB" ]] || { echo "The signed Android AAB was not generated." >&2; exit 1; }
cp "$APK" "$OUTPUT_DIR/todo-matrix-$TAG-android.apk"
cp "$AAB" "$OUTPUT_DIR/todo-matrix-$TAG-android.aab"

if [[ "$SKIP_IOS" -eq 0 ]]; then
  [[ -n "${IOS_TEAM_ID:-}" ]] || { echo "IOS_TEAM_ID is required. Use --skip-ios to omit iOS." >&2; exit 1; }
  if [[ ! -d "$ROOT/ios" ]]; then
    [[ "$INIT_IOS" -eq 1 ]] || {
      echo "The ios directory is missing. Run once with --init-ios, review it, and commit the generated project." >&2
      exit 1
    }
    npm exec cap add ios
    echo "The ios project was initialized. Review and commit ios/ on a branch, create a new release tag, then run this script again."
    exit 0
  fi

  npm run build -- --mode android
  npm exec cap sync ios

  ARCHIVE_PATH="$ROOT/release-artifacts/$TAG/TodoMatrix.xcarchive"
  EXPORT_DIR="$ROOT/release-artifacts/$TAG/ios-export"
  EXPORT_OPTIONS="$ROOT/release-artifacts/$TAG/ExportOptions.plist"
  IOS_EXPORT_METHOD="${IOS_EXPORT_METHOD:-app-store-connect}"

  cat >"$EXPORT_OPTIONS" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>$IOS_EXPORT_METHOD</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>teamID</key>
  <string>$IOS_TEAM_ID</string>
</dict>
</plist>
EOF

  rm -rf "$ARCHIVE_PATH" "$EXPORT_DIR"
  xcodebuild \
    -workspace ios/App/App.xcworkspace \
    -scheme App \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    DEVELOPMENT_TEAM="$IOS_TEAM_ID" \
    -allowProvisioningUpdates \
    archive
  xcodebuild \
    -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$EXPORT_DIR" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -allowProvisioningUpdates

  IPA="$(find "$EXPORT_DIR" -type f -name '*.ipa' -print -quit)"
  [[ -n "$IPA" ]] || { echo "The signed iOS IPA was not generated." >&2; exit 1; }
  cp "$IPA" "$OUTPUT_DIR/todo-matrix-$TAG-ios.ipa"
fi

(
  cd "$OUTPUT_DIR"
  shasum -a 256 ./* > SHA256SUMS-apple-mobile.txt
)

echo "macOS, Android, and iOS release artifacts are ready: $OUTPUT_DIR"
