#!/usr/bin/env bash
# =============================================================================
# build_android.sh — Build TARCOIN Wallet APK / AAB for Android
# =============================================================================
# Produces:
#   - Debug APK:   android/app/build/outputs/apk/debug/app-debug.apk
#   - Release APK: android/app/build/outputs/apk/release/app-release.apk
#   - Release AAB: android/app/build/outputs/bundle/release/app-release.aab
#     (AAB is required for Google Play Store submission)
#
# Requirements:
#   - JDK 17 (export JAVA_HOME=/path/to/jdk17)
#   - Android SDK (export ANDROID_HOME=/path/to/sdk)
#   - For signed release: keystore file + credentials in android/keystore.properties
#
# Usage:
#   ./scripts/build_android.sh [debug|release]
#   ./scripts/build_android.sh release   # builds signed AAB for Play Store
# =============================================================================

set -euo pipefail

BUILD_TYPE="${1:-debug}"
ANDROID_DIR="./android"
OUTPUT_APK="$ANDROID_DIR/app/build/outputs/apk/$BUILD_TYPE/app-${BUILD_TYPE}.apk"
OUTPUT_AAB="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
[[ -d "$ANDROID_DIR" ]] || error "android/ directory not found. Run setup.sh first."
command -v java >/dev/null || error "Java not found. Install JDK 17."

JAVA_VER=$(java -version 2>&1 | head -1 | awk -F '"' '{print $2}' | cut -d. -f1)
[[ "$JAVA_VER" -lt 17 ]] && error "JDK 17+ required. Found: Java $JAVA_VER"

info "Build type:   $BUILD_TYPE"
info "Java version: $(java -version 2>&1 | head -1)"

# ---------------------------------------------------------------------------
# Metro bundler (JS bundle)
# ---------------------------------------------------------------------------
info "Starting Metro bundler in background..."
npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res/ \
    2>/dev/null &
METRO_PID=$!
sleep 3
kill $METRO_PID 2>/dev/null || true

# ---------------------------------------------------------------------------
# Gradle build
# ---------------------------------------------------------------------------
cd "$ANDROID_DIR"

if [[ "$BUILD_TYPE" == "release" ]]; then
    # Check keystore exists
    [[ -f "keystore.properties" ]] || {
        echo ""
        echo "  keystore.properties not found."
        echo "  Create it with:"
        echo ""
        echo "  storeFile=../tarcoin-release.jks"
        echo "  storePassword=YOUR_STORE_PASSWORD"
        echo "  keyAlias=tarcoin"
        echo "  keyPassword=YOUR_KEY_PASSWORD"
        echo ""
        error "Cannot build release without keystore. See above."
    }

    info "Building release AAB (for Google Play)..."
    ./gradlew bundleRelease --no-daemon

    info "Building release APK..."
    ./gradlew assembleRelease --no-daemon

    success "Release AAB: $OUTPUT_AAB"
    success "Release APK: $OUTPUT_APK"
else
    info "Building debug APK..."
    ./gradlew assembleDebug --no-daemon
    success "Debug APK: $OUTPUT_APK"
fi

cd ..

# ---------------------------------------------------------------------------
# Output file sizes
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo -e " ${GREEN}Android build complete!${NC}"
echo "============================================================"

if [[ -f "$OUTPUT_APK" ]]; then
    SIZE=$(du -sh "$OUTPUT_APK" | cut -f1)
    echo "  APK: $OUTPUT_APK ($SIZE)"
fi

if [[ -f "$OUTPUT_AAB" && "$BUILD_TYPE" == "release" ]]; then
    SIZE=$(du -sh "$OUTPUT_AAB" | cut -f1)
    echo "  AAB: $OUTPUT_AAB ($SIZE)"
fi

echo ""
echo "  Install on device:"
echo "    adb install $OUTPUT_APK"
echo ""
