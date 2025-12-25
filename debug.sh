#!/bin/bash

# Debug script for Flow Cytometry Analyzer
# Helps diagnose issues when the app won't launch

echo "=========================================="
echo "Flow Cytometry Analyzer - Debug Helper"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# Find the app bundle
APP_PATH="target/aarch64-apple-darwin/release/bundle/macos/Flow Cytometry Analyzer.app"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ App bundle not found at: $APP_PATH"
    echo ""
    echo "Please build the app first:"
    echo "  ./build-universal.sh"
    exit 1
fi

echo "✓ App bundle found"
echo ""

# Check app structure
echo "Checking app structure..."
BINARY="$APP_PATH/Contents/MacOS/flow-cytometry-analyzer"
if [ -f "$BINARY" ]; then
    echo "✓ Binary found"
    file "$BINARY"
else
    echo "❌ Binary not found at: $BINARY"
    exit 1
fi
echo ""

# Check if frontend files are bundled
echo "Checking frontend files..."
if [ -d "$APP_PATH/Contents/Resources" ]; then
    echo "✓ Resources directory exists"
    ls -la "$APP_PATH/Contents/Resources" | head -5
else
    echo "❌ Resources directory not found"
fi
echo ""

# Try to run the app and capture output
echo "Attempting to launch app..."
echo "----------------------------------------"
"$BINARY" 2>&1 &
APP_PID=$!

# Wait a moment to see if it crashes immediately
sleep 2

if ps -p $APP_PID > /dev/null 2>&1; then
    echo "✓ App is running (PID: $APP_PID)"
    echo ""
    echo "The app window should be visible. If not, check:"
    echo "  1. macOS Security settings (System Preferences > Security & Privacy)"
    echo "  2. Console.app for error messages"
    echo ""
    echo "To stop the app, run: kill $APP_PID"
else
    echo "❌ App crashed or failed to start"
    echo ""
    echo "Check the error messages above for details."
    echo ""
    echo "Common issues:"
    echo "  - Missing dependencies"
    echo "  - Code signing issues"
    echo "  - macOS security restrictions"
    echo ""
    echo "Try running with RUST_BACKTRACE=1 for more details:"
    echo "  RUST_BACKTRACE=1 \"$BINARY\""
fi

