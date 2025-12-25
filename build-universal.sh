#!/bin/bash

# Build script for Flow Cytometry Analyzer
# Builds universal macOS app bundle (.app) and DMG for both architectures

set -e

echo "=========================================="
echo "Building Flow Cytometry Analyzer"
echo "Target: Universal macOS (aarch64 + x86_64)"
echo "=========================================="

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Error: This script must be run on macOS"
    exit 1
fi

# Add targets if not already added
echo "Adding Rust targets..."
rustup target add aarch64-apple-darwin x86_64-apple-darwin

# Check if Tauri CLI is installed
echo ""
echo "Checking for Tauri CLI..."
if ! command -v cargo-tauri &> /dev/null && ! cargo tauri --version &> /dev/null 2>&1; then
    echo "Tauri CLI not found. Installing..."
    cargo install tauri-cli --locked
else
    echo "Tauri CLI found."
fi

# Use cargo-tauri if available, otherwise fall back to cargo tauri
if command -v cargo-tauri &> /dev/null; then
    TAURI_CMD="cargo-tauri"
else
    TAURI_CMD="cargo tauri"
fi

# Build frontend
echo ""
echo "Building frontend..."
cd "$(dirname "$0")"
npm install
npm run build

# Build app bundles for both architectures
echo ""
echo "Building app bundle for aarch64-apple-darwin..."
if ! $TAURI_CMD build --manifest-path src-tauri/Cargo.toml --target aarch64-apple-darwin; then
    echo "Error: Failed to build app bundle for aarch64-apple-darwin"
    exit 1
fi

echo ""
echo "Building app bundle for x86_64-apple-darwin..."
if ! $TAURI_CMD build --manifest-path src-tauri/Cargo.toml --target x86_64-apple-darwin; then
    echo "Error: Failed to build app bundle for x86_64-apple-darwin"
    exit 1
fi

# Extract binaries from app bundles
echo ""
echo "Extracting binaries from app bundles..."
# Tauri creates bundles in src-tauri/target/
BINARY_AARCH64="src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Flow Cytometry Analyzer.app/Contents/MacOS/flow-cytometry-analyzer"
BINARY_X86_64="src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Flow Cytometry Analyzer.app/Contents/MacOS/flow-cytometry-analyzer"

if [ ! -f "$BINARY_AARCH64" ]; then
    echo "Error: Binary not found at $BINARY_AARCH64"
    exit 1
fi

if [ ! -f "$BINARY_X86_64" ]; then
    echo "Error: Binary not found at $BINARY_X86_64"
    exit 1
fi

# Create universal binary
echo ""
echo "Creating universal binary..."
mkdir -p src-tauri/target/universal-apple-darwin/release

if ! lipo -create \
  "$BINARY_AARCH64" \
  "$BINARY_X86_64" \
  -output src-tauri/target/universal-apple-darwin/release/flow-cytometry-analyzer; then
    echo "Error: Failed to create universal binary"
    exit 1
fi

echo "Universal binary created successfully!"

# Copy universal binary back into the aarch64 app bundle
echo ""
echo "Installing universal binary into app bundle..."
cp src-tauri/target/universal-apple-darwin/release/flow-cytometry-analyzer \
   "$BINARY_AARCH64"

# The final app bundle is in the aarch64 target directory
APP_BUNDLE="src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Flow Cytometry Analyzer.app"

echo ""
echo "=========================================="
echo "Build complete!"
echo "=========================================="
echo ""
echo "Universal app bundle location:"
echo "  $APP_BUNDLE"
echo ""
echo "To launch the app:"
echo "  open \"$APP_BUNDLE\""
echo ""
echo "DMG location (if created):"
echo "  src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/"
echo ""

