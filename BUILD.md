# Building Flow Cytometry Analyzer

## Quick Start

### Development
```bash
cd flow-cytometry-analyzer
npm install
npm run dev  # In one terminal
cd src-tauri
cargo tauri dev  # In another terminal
```

### Production Build (Universal macOS)

To build a universal macOS app bundle (.app) and DMG supporting both Apple Silicon and Intel:

```bash
cd flow-cytometry-analyzer
./build-universal.sh
```

This script will:
1. Build the frontend (npm run build)
2. Compile Rust backend for both architectures
3. Create a universal binary using `lipo`
4. Build the macOS app bundle and DMG

## Manual Build Steps

If you prefer to build manually:

1. **Install Rust targets:**
   ```bash
   rustup target add aarch64-apple-darwin x86_64-apple-darwin
   ```

2. **Build frontend:**
   ```bash
   npm install
   npm run build
   ```

3. **Build Rust for both architectures:**
   ```bash
   cargo build --manifest-path src-tauri/Cargo.toml --release --target aarch64-apple-darwin
   cargo build --manifest-path src-tauri/Cargo.toml --release --target x86_64-apple-darwin
   ```

4. **Create universal binary:**
   ```bash
   mkdir -p src-tauri/target/universal-apple-darwin/release
   lipo -create \
     src-tauri/target/aarch64-apple-darwin/release/flow-cytometry-analyzer \
     src-tauri/target/x86_64-apple-darwin/release/flow-cytometry-analyzer \
     -output src-tauri/target/universal-apple-darwin/release/flow-cytometry-analyzer
   ```

5. **Build app bundle:**
   ```bash
   # Copy universal binary to aarch64 target for Tauri bundling
   cp src-tauri/target/universal-apple-darwin/release/flow-cytometry-analyzer \
      src-tauri/target/aarch64-apple-darwin/release/flow-cytometry-analyzer
   
   cd src-tauri
   cargo tauri build --target aarch64-apple-darwin
   ```

## Output Locations

After building, you'll find:
- **App Bundle**: `src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Flow Cytometry Analyzer.app`
- **DMG**: `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/`

## Code Signing (Optional)

To sign your app for distribution:

```bash
codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name (Team ID)" \
  "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Flow Cytometry Analyzer.app"
```

## Troubleshooting

- **Icon errors**: Make sure `src-tauri/icons/icon.png` exists. The build script should handle this.
- **Build failures**: Ensure you have both Rust targets installed: `rustup target add aarch64-apple-darwin x86_64-apple-darwin`
- **Tauri errors**: Make sure Tauri CLI is installed: `cargo install tauri-cli --locked`

