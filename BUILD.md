# Building Rodrigolab's Flow Cytometry Analyzer

## Overview

This project uses Tauri 2.0 to build cross-platform desktop applications. The build process compiles a Rust backend and bundles it with a web frontend.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Platform-Specific Build Instructions](#platform-specific-build-instructions)
- [Output Locations](#output-locations)
- [GitHub Actions](#github-actions)
- [Troubleshooting](#troubleshooting)

## Supported Platforms

- **macOS**: ARM64 (aarch64-apple-darwin) and Intel (x86_64-apple-darwin)
- **Windows**: x86_64 (x86_64-pc-windows-msvc)
- **Linux**: x86_64 (x86_64-unknown-linux-gnu) - Ubuntu 22.04+, Debian 11+

## Prerequisites

### Required for All Platforms

1. **Rust** (latest stable version)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

2. **Node.js** (v20 or later) and npm
   - Download from [nodejs.org](https://nodejs.org/)
   - Or use a version manager like `nvm`

3. **Tauri CLI** (installed automatically during build, or manually):
   ```bash
   cargo install tauri-cli --locked
   ```

### Platform-Specific Requirements

#### macOS
- Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```

#### Windows
- Microsoft Visual C++ Build Tools
- Windows SDK
- Install via [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)

#### Linux (Ubuntu/Debian)
- System dependencies (see Linux build section below)

## Quick Start

### Development Mode

```bash
# Clone the repository
git clone https://github.com/luksgrin/flow-cytometry-analyzer.git
cd flow-cytometry-analyzer

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Production Build (Current Platform)

```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Build application
cd src-tauri
cargo tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Building for Specific Platforms

### macOS

#### ARM64 (Apple Silicon)
```bash
npm run build
cd src-tauri
cargo tauri build --target aarch64-apple-darwin --bundles app,dmg
```

#### Intel
```bash
npm run build
cd src-tauri
cargo tauri build --target x86_64-apple-darwin --bundles app,dmg
```

### Windows

```bash
npm run build
cd src-tauri
cargo tauri build --target x86_64-pc-windows-msvc --bundles msi
```

### Linux (Ubuntu/Debian)

First, install system dependencies:
```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf
```

Then build:
```bash
npm run build
cd src-tauri
# For Debian package
cargo tauri build --target x86_64-unknown-linux-gnu --bundles deb
# For AppImage
cargo tauri build --target x86_64-unknown-linux-gnu --bundles appimage
```

## Output Locations

After building, artifacts will be in:
- **macOS**: `src-tauri/target/<target>/release/bundle/macos/` and `bundle/dmg/`
- **Windows**: `src-tauri/target/<target>/release/bundle/msi/`
- **Linux**: `src-tauri/target/<target>/release/bundle/deb/` or `bundle/appimage/`

## GitHub Actions

The project includes automated builds via GitHub Actions (`.github/workflows/build-simple.yml`) that build for all platforms on push to main/master or manual trigger.

## Prerequisites

- **Rust**: Latest stable version
- **Node.js**: v20 or later
- **npm**: Comes with Node.js
- **Tauri CLI**: Installed automatically via `cargo install tauri-cli --locked`

### Platform-Specific Requirements

#### macOS
- Xcode Command Line Tools
- No additional dependencies needed

#### Windows
- Microsoft Visual C++ Build Tools
- Windows SDK

#### Linux
- See system dependencies listed above
- GTK+ 3 development libraries

## Troubleshooting

- **Icon errors**: Ensure all icon files exist in `src-tauri/icons/`
- **Build failures**: Check that all Rust targets are installed: `rustup target add <target>`
- **Tauri errors**: Verify Tauri CLI is installed: `cargo install tauri-cli --locked`
- **Linux dependencies**: Install all required system packages listed above
