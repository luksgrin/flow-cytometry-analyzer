# Building from Source

This guide provides detailed instructions for building Rodrigolab's Flow Cytometry Analyzer from source code.

## Prerequisites

### Required for All Platforms

1. **Rust** (latest stable version)
   ```bash
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   
   # Verify installation
   rustc --version
   cargo --version
   ```

2. **Node.js** (v20 or later) and npm
   - Download from [nodejs.org](https://nodejs.org/)
   - Or use a version manager:
     ```bash
     # Using nvm (Node Version Manager)
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
     nvm install 20
     nvm use 20
     ```
   - Verify installation:
     ```bash
     node --version  # Should be v20 or later
     npm --version
     ```

3. **Git**
   - Usually pre-installed on macOS and Linux
   - Windows: Download from [git-scm.com](https://git-scm.com/)

### Platform-Specific Requirements

#### macOS

1. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

2. **Verify installation**
   ```bash
   xcode-select -p
   ```

#### Windows

1. **Microsoft Visual C++ Build Tools**
   - Download from [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
   - Install "Desktop development with C++" workload

2. **Windows SDK**
   - Included with Visual Studio Build Tools

#### Linux (Ubuntu/Debian)

Install system dependencies:
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
  patchelf \
  libgtk-3-dev
```

## Getting the Source Code

```bash
# Clone the repository
git clone https://github.com/luksgrin/flow-cytometry-analyzer.git
cd flow-cytometry-analyzer
```

## Development Build

For development and testing:

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

This will:
- Start the Vite development server
- Launch the Tauri application
- Enable hot-reload for frontend changes

## Production Build

### Build for Current Platform

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

### Build for Specific Platforms

#### macOS ARM64 (Apple Silicon)

```bash
npm install
npm run build

# Add target if not already added
rustup target add aarch64-apple-darwin

# Build
cd src-tauri
cargo tauri build --target aarch64-apple-darwin --bundles app,dmg
```

Output: `src-tauri/target/aarch64-apple-darwin/release/bundle/`

#### macOS Intel

```bash
npm install
npm run build

# Add target if not already added
rustup target add x86_64-apple-darwin

# Build
cd src-tauri
cargo tauri build --target x86_64-apple-darwin --bundles app,dmg
```

Output: `src-tauri/target/x86_64-apple-darwin/release/bundle/`

#### Windows

```bash
npm install
npm run build

# Add target if not already added
rustup target add x86_64-pc-windows-msvc

# Build
cd src-tauri
cargo tauri build --target x86_64-pc-windows-msvc --bundles msi
```

Output: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/`

#### Linux (Ubuntu/Debian)

```bash
# Install system dependencies (see Prerequisites section)
sudo apt-get update
sudo apt-get install -y [dependencies listed above]

# Install Node.js and Rust dependencies
npm install
npm run build

# Add target if not already added
rustup target add x86_64-unknown-linux-gnu

# Build DEB package
cd src-tauri
cargo tauri build --target x86_64-unknown-linux-gnu --bundles deb

# Or build AppImage
cargo tauri build --target x86_64-unknown-linux-gnu --bundles appimage
```

Output: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/deb/` or `bundle/appimage/`

## Cross-Compilation

### Building for Different Platforms

Cross-compilation requires additional setup:

#### Building Windows from Linux/macOS

1. Install MinGW toolchain
2. Add target: `rustup target add x86_64-pc-windows-gnu`
3. Configure Cargo for cross-compilation

#### Building Linux from macOS/Windows

Requires Docker or a Linux VM. Recommended: Use GitHub Actions (see below).

## Using GitHub Actions

The easiest way to build for all platforms is using GitHub Actions:

1. Push your code to GitHub
2. The workflow (`.github/workflows/build-simple.yml`) will automatically build for all platforms
3. Download artifacts from the Actions tab

### Creating a Release

To create a release with all platform builds:

```bash
# Tag your release
git tag v1.0.0
git push origin v1.0.0
```

This triggers the release workflow which:
- Builds for all platforms
- Creates a GitHub Release
- Attaches all platform artifacts

## Build Output Locations

After building, find your artifacts:

- **macOS**: 
  - App: `src-tauri/target/<target>/release/bundle/macos/Rodrigolab's Flow Cytometry Analyzer.app`
  - DMG: `src-tauri/target/<target>/release/bundle/dmg/`
- **Windows**: 
  - MSI: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/`
- **Linux**: 
  - DEB: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/deb/`
  - AppImage: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/`

## Troubleshooting Build Issues

### Common Issues

1. **"Tauri CLI not found"**
   ```bash
   cargo install tauri-cli --locked
   ```

2. **"Target not found"**
   ```bash
   rustup target add <target-triple>
   ```

3. **"Icon files missing"**
   - Ensure all icon files exist in `src-tauri/icons/`
   - Check `tauri.conf.json` has correct icon paths

4. **Linux: Missing dependencies**
   - Install all system dependencies listed in Prerequisites
   - Use `apt-cache search <package>` to find package names on your distribution

5. **Windows: Linker errors**
   - Ensure Visual C++ Build Tools are installed
   - Restart terminal after installation

6. **macOS: Code signing warnings**
   - These are normal for local builds
   - For distribution, set up code signing in `tauri.conf.json`

### Getting Help

- Check the [Troubleshooting Guide](troubleshooting.md)
- Open an issue on [GitHub](https://github.com/luksgrin/flow-cytometry-analyzer/issues)
- Review [Tauri documentation](https://tauri.app/v2/)

## Development Tips

- Use `cargo tauri dev` for faster iteration
- Check `src-tauri/target/debug/` for debug builds
- Use `RUST_LOG=debug cargo tauri build` for verbose output
- Clean build: `cargo clean` then rebuild

