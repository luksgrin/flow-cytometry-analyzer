#!/bin/bash

# Build script for Flow Cytometry Analyzer
# Builds for both aarch64-apple-darwin and x86_64-apple-darwin

set -e

echo "Building Flow Cytometry Analyzer for macOS..."

# Add targets if not already added
rustup target add aarch64-apple-darwin x86_64-apple-darwin

# Build for both architectures
echo "Building for aarch64-apple-darwin..."
cargo build --manifest-path src-tauri/Cargo.toml --release --target aarch64-apple-darwin

echo "Building for x86_64-apple-darwin..."
cargo build --manifest-path src-tauri/Cargo.toml --release --target x86_64-apple-darwin

# Create universal binary using lipo
echo "Creating universal binary..."
mkdir -p src-tauri/target/universal-apple-darwin/release
lipo -create \
  src-tauri/target/aarch64-apple-darwin/release/flow-cytometry-analyzer \
  src-tauri/target/x86_64-apple-darwin/release/flow-cytometry-analyzer \
  -output src-tauri/target/universal-apple-darwin/release/flow-cytometry-analyzer

echo "Build complete! Universal binary created at:"
echo "  src-tauri/target/universal-apple-darwin/release/flow-cytometry-analyzer"

