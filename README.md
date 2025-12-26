# Rodrigolab's Flow Cytometry Analyzer

An interactive filtering tool for Flow Cytometry Standard (FCS) files that allows you to manually select regions of interest using lasso selection on scatter plots. This is a free, open-source alternative to FlowJo for basic gating operations.

Built with Rust and Tauri for cross-platform desktop applications.

## Features

- Load and parse FCS files
- Interactive scatter plot visualization
- Lasso selection for filtering data points
- Multiple filter support with intersection
- Export filtered data to CSV, Excel, or Parquet formats
- Log and linear scale options for axes
- Zoom and pan functionality
- Dark, dim, and light theme support
- Clickable channel selection

## Installation

### Prerequisites

- Rust (latest stable version)
- Node.js (v20 or later) and npm
- System dependencies for Tauri (see [Tauri prerequisites](https://tauri.app/v2/guides/getting-started/prerequisites))

### Installation

#### Pre-built Binaries (Recommended)

Download pre-built binaries from the [GitHub Releases](https://github.com/luksgrin/flow-cytometry-analyzer/releases) page. Releases are automatically built for:
- macOS (ARM64 and Intel) - `.dmg` files
- Windows (x86_64) - `.msi` installer
- Linux (Ubuntu/Debian) - `.deb` packages and `.appimage` files

**Note for macOS users:** If you see an error that the app is "damaged and cannot be opened", this is due to macOS Gatekeeper. See the [Installation Guide](docs/installation.md#macos) for instructions on how to bypass this.

**Note for Windows users:** Windows SmartScreen may show a warning when installing. This is normal for unsigned applications. Click "More info" then "Run anyway" to proceed. See the [Installation Guide](docs/installation.md#windows) for details.

#### Building from Source

See [BUILD.md](BUILD.md) for detailed compilation instructions, or follow the quick start below.

**Quick Start:**

1. **Prerequisites:**
   - Rust (latest stable) - [Install Rust](https://rustup.rs/)
   - Node.js v20+ and npm - [Install Node.js](https://nodejs.org/)
   - Platform-specific build tools (see [BUILD.md](BUILD.md))

2. **Clone and build:**
   ```bash
   git clone https://github.com/luksgrin/flow-cytometry-analyzer.git
   cd flow-cytometry-analyzer
   npm install
   npm run build
   cd src-tauri
   cargo tauri build
   ```

3. **Find your build:**
   - macOS: `src-tauri/target/release/bundle/macos/`
   - Windows: `src-tauri/target/release/bundle/msi/`
   - Linux: `src-tauri/target/release/bundle/deb/` or `bundle/appimage/`

For detailed platform-specific instructions, see [BUILD.md](BUILD.md).

### Development

Run the development server:
```bash
npm run tauri dev
```

## Usage

1. Launch the application
2. Click "Load FCS File" to select an FCS file
3. Select two channels by clicking on them (default: first two channels)
4. Use left-click and drag to draw a lasso selection around points to keep
5. Click "Confirm Selection" to save the filter
6. Select different channels and create additional filters
7. Export the filtered data using "Export Filtered Data"

### Plot Controls

- **Left-click and drag**: Draw lasso selection (auto-closes on release)
- **Right-click and drag**: Pan the plot
- **Scroll wheel**: Zoom in/out
- **Checkboxes**: Toggle log scale for X or Y axis
- **Show excluded points**: Toggle to see points excluded by other filters

## Export Formats

- **CSV**: Comma-separated values
- **Excel**: XLSX format with metadata and data sheets
- **Parquet**: Compressed columnar format

## Platform Support

This application is built with Tauri and supports:
- **macOS**: 10.13+ (both Apple Silicon and Intel)
- **Windows**: Windows 10+
- **Linux**: Ubuntu 22.04+, Debian 11+ (x86_64)

## Building for Multiple Platforms

The project includes GitHub Actions workflows (`.github/workflows/build-simple.yml`) that automatically build for all supported platforms. To build locally for different platforms, you'll need to set up cross-compilation or use the appropriate build environment.

## License

MIT
