#!/bin/bash

# Clean script for Flow Cytometry Analyzer
# Removes all build artifacts and temporary files

set -e

echo "=========================================="
echo "Cleaning Flow Cytometry Analyzer"
echo "=========================================="

cd "$(dirname "$0")"

# Remove Rust build artifacts
echo ""
echo "Removing Rust build artifacts..."
if [ -d "target" ]; then
    rm -rf target
    echo "  ✓ Removed target/"
fi

if [ -d "src-tauri/target" ]; then
    rm -rf src-tauri/target
    echo "  ✓ Removed src-tauri/target/"
fi

# Remove frontend build artifacts
echo ""
echo "Removing frontend build artifacts..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "  ✓ Removed dist/"
fi

# Remove node_modules (optional - comment out if you want to keep dependencies)
echo ""
echo "Removing node_modules..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "  ✓ Removed node_modules/"
fi

# Remove Vite cache
echo ""
echo "Removing Vite cache..."
if [ -d ".vite" ]; then
    rm -rf .vite
    echo "  ✓ Removed .vite/"
fi

# Remove package-lock.json (optional - will be regenerated)
echo ""
echo "Removing package-lock.json..."
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    echo "  ✓ Removed package-lock.json"
fi

# Clean Cargo.lock (optional - will be regenerated)
echo ""
echo "Removing Cargo.lock files..."
if [ -f "Cargo.lock" ]; then
    rm -f Cargo.lock
    echo "  ✓ Removed Cargo.lock"
fi

if [ -f "src-tauri/Cargo.lock" ]; then
    rm -f src-tauri/Cargo.lock
    echo "  ✓ Removed src-tauri/Cargo.lock"
fi

# Remove any Python cache from old project (if exists in this directory)
echo ""
echo "Removing Python cache files..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true
echo "  ✓ Removed Python cache files"

# Remove any .DS_Store files
echo ""
echo "Removing .DS_Store files..."
find . -name ".DS_Store" -delete 2>/dev/null || true
echo "  ✓ Removed .DS_Store files"

echo ""
echo "=========================================="
echo "Cleanup complete!"
echo "=========================================="
echo ""
echo "To rebuild, run:"
echo "  ./build-universal.sh"
echo ""

