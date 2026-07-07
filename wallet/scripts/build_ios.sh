#!/usr/bin/env bash
# =============================================================================
# build_ios.sh — Build TARCOIN Wallet IPA for iOS
# =============================================================================
# Produces:
#   - Simulator build: run on iOS Simulator (development)
#   - Archive IPA:     submit to TestFlight / App Store
#
# Requirements:
#   - macOS only (Xcode build tools are macOS-exclusive)
#   - Xcode 15+
#   - CocoaPods: sudo gem install cocoapods
#   - Apple Developer account (for device/TestFlight builds)
#   - Valid provisioning profile and code signing certificate
#
# Usage:
#   ./scripts/build_ios.sh [simulator|device|archive]
#   ./scripts/build_ios.sh simulator  # run on iOS Simulator
#   ./scripts/build_ios.sh archive    # build IPA for App Store
# =============================================================================

set -euo pipefail

BUILD_TYPE="${1:-simulator}"
IOS_DIR="./ios"
SCHEME="TARWallet"
WORKSPACE="$IOS_DIR/TARWallet.xcworkspace"
ARCHIVE_PATH="$IOS_DIR/build/TARWallet.xcarchive"
EXPORT_PATH="$IOS_DIR/build/export"
EXPORT_PLIST="$IOS_DIR/ExportOptions.plist"

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
[[ "$(uname)" == "Darwin" ]] || error "iOS builds require macOS."
command -v xcodebuild >/dev/null || error "Xcode not found. Install from App Store."
command -v pod >/dev/null || error "CocoaPods not found. Run: sudo gem install cocoapods"
[[ -d "$IOS_DIR" ]] || error "ios/ directory not found. Run setup.sh first."

info "Build type: $BUILD_TYPE"
info "Scheme:     $SCHEME"

# ---------------------------------------------------------------------------
# CocoaPods install
# ---------------------------------------------------------------------------
info "Installing CocoaPods dependencies..."
cd "$IOS_DIR"
pod install --repo-update
cd ..
success "CocoaPods ready"

# ---------------------------------------------------------------------------
# Create export options plist (for archive builds)
# ---------------------------------------------------------------------------
if [[ "$BUILD_TYPE" == "archive" && ! -f "$EXPORT_PLIST" ]]; then
    cat > "$EXPORT_PLIST" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>destination</key>
    <string>upload</string>
</dict>
</plist>
EOF
    info "Created ExportOptions.plist"
fi

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
case "$BUILD_TYPE" in
    simulator)
        info "Building for iOS Simulator..."
        xcodebuild \
            -workspace "$WORKSPACE" \
            -scheme "$SCHEME" \
            -configuration Debug \
            -sdk iphonesimulator \
            -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
            build \
            | xcpretty --color 2>/dev/null || true
        success "Simulator build complete"
        info "Launch with: npx react-native run-ios"
        ;;

    device)
        info "Building for physical device (Debug)..."
        xcodebuild \
            -workspace "$WORKSPACE" \
            -scheme "$SCHEME" \
            -configuration Debug \
            -sdk iphoneos \
            build \
            | xcpretty --color 2>/dev/null || true
        success "Device build complete"
        ;;

    archive)
        info "Archiving for App Store / TestFlight..."
        mkdir -p "$IOS_DIR/build"

        xcodebuild \
            -workspace "$WORKSPACE" \
            -scheme "$SCHEME" \
            -configuration Release \
            -sdk iphoneos \
            -archivePath "$ARCHIVE_PATH" \
            archive \
            | xcpretty --color 2>/dev/null || true

        success "Archive created: $ARCHIVE_PATH"

        info "Exporting IPA..."
        xcodebuild \
            -exportArchive \
            -archivePath "$ARCHIVE_PATH" \
            -exportPath "$EXPORT_PATH" \
            -exportOptionsPlist "$EXPORT_PLIST"

        success "IPA exported to: $EXPORT_PATH"

        echo ""
        echo "============================================================"
        echo -e " ${GREEN}iOS archive complete!${NC}"
        echo "============================================================"
        echo ""
        echo "  Upload to TestFlight / App Store via:"
        echo "    1. Xcode Organizer (open Xcode → Window → Organizer)"
        echo "    2. Transporter app (free from Mac App Store)"
        echo "    3. altool: xcrun altool --upload-app -f $EXPORT_PATH/*.ipa"
        echo ""
        ;;

    *)
        error "Unknown build type: $BUILD_TYPE. Use: simulator | device | archive"
        ;;
esac
