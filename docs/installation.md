# Installation Guide

This guide explains how to install Rodrigolab's Flow Cytometry Analyzer on your system.

## Pre-built Binaries (Recommended)

The easiest way to get started is to download pre-built binaries from the [GitHub Releases](https://github.com/luksgrin/flow-cytometry-analyzer/releases) page.

### macOS

1. Download the `.dmg` file for your architecture:
   - **Apple Silicon (M1/M2/M3)**: `Rodrigolab's Flow Cytometry Analyzer_*_aarch64.dmg`
   - **Intel**: `Rodrigolab's Flow Cytometry Analyzer_*_x86_64.dmg`

2. Open the downloaded DMG file

3. Drag the application to your Applications folder

4. Open the application from Applications (you may need to allow it in System Preferences > Security & Privacy on first launch)

### Windows

1. Download the `.msi` installer from the releases page

2. Double-click the MSI file to run the installer

3. Follow the installation wizard

4. Launch the application from the Start menu

### Linux (Ubuntu/Debian)

#### Option 1: DEB Package (Recommended)

1. Download the `.deb` package from the releases page

2. Install using your package manager:
   ```bash
   sudo dpkg -i flow-cytometry-analyzer_*.deb
   ```

3. If there are dependency issues, fix them with:
   ```bash
   sudo apt-get install -f
   ```

4. Launch from your application menu

#### Option 2: AppImage

1. Download the `.AppImage` file from the releases page

2. Make it executable:
   ```bash
   chmod +x Rodrigolab\'s\ Flow\ Cytometry\ Analyzer_*.AppImage
   ```

3. Run it:
   ```bash
   ./Rodrigolab\'s\ Flow\ Cytometry\ Analyzer_*.AppImage
   ```

## Building from Source

If you prefer to build from source or need a custom build, see the [Building from Source](building.md) guide.

### Quick Build

```bash
# Clone the repository
git clone https://github.com/luksgrin/flow-cytometry-analyzer.git
cd flow-cytometry-analyzer

# Install dependencies
npm install

# Build frontend
npm run build

# Build application
cd src-tauri
cargo tauri build
```

For detailed platform-specific instructions, see [Building from Source](building.md).

## Verification

After installation, verify the application works:

1. Launch the application
2. You should see the main interface with "Load FCS File" button
3. Try loading a sample FCS file to confirm everything works

## Updating

To update to a newer version:

1. Download the latest release from GitHub
2. Follow the installation steps above
3. On macOS and Windows, you can typically just install over the existing version
4. On Linux, uninstall the old version first if using DEB package

## Uninstallation

### macOS

1. Open Applications folder
2. Drag "Rodrigolab's Flow Cytometry Analyzer" to Trash
3. Empty Trash

### Windows

1. Open Settings > Apps
2. Find "Rodrigolab's Flow Cytometry Analyzer"
3. Click Uninstall

### Linux (DEB)

```bash
sudo apt-get remove flow-cytometry-analyzer
```

For AppImage, simply delete the file.

