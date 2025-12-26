# Troubleshooting Guide

Common issues and solutions when using or building Rodrigolab's Flow Cytometry Analyzer.

## Installation Issues

### macOS: "App is damaged and can't be opened"

**Solution:**
1. Open System Preferences > Security & Privacy
2. Click "Open Anyway" next to the blocked app
3. Or run: `xattr -cr /Applications/Rodrigolab\'s\ Flow\ Cytometry\ Analyzer.app`

### Windows: Installation blocked by Windows Defender

**Solution:**
1. Click "More info" on the warning
2. Click "Run anyway"
3. Or add an exception in Windows Security settings

### Linux: Dependency errors when installing DEB

**Solution:**
```bash
sudo apt-get install -f
```

This will install missing dependencies.

## Runtime Issues

### Application won't start

**Check:**
1. System requirements are met
2. No other instance is running
3. Check system logs for errors

**macOS:**
```bash
# Check Console.app for errors
# Or from terminal:
log show --predicate 'process == "Rodrigolab'" --last 5m
```

**Linux:**
```bash
# Run from terminal to see errors
./Rodrigolab\'s\ Flow\ Cytometry\ Analyzer_*.AppImage
```

### FCS file won't load

**Possible causes:**
1. File is corrupted
2. Unsupported FCS format version
3. File is locked by another application

**Solutions:**
- Try a different FCS file
- Check file permissions
- Ensure file isn't open in another program

### Plot is blank or shows no data

**Check:**
1. Data loaded successfully (check file info)
2. Channels are selected
3. Data range is visible (try resetting zoom)
4. Log scale settings (try switching to linear)

**Solution:**
- Click "Reset" button to reset zoom
- Try different channel combinations
- Check if data values are valid (not all zeros)

### Selection not working

**Check:**
1. You're using left-click to draw (not right-click)
2. Selection has at least 3 points
3. Plot is not in pan mode

**Solution:**
- Make sure you're left-clicking and dragging
- Release mouse to close selection
- Right-click is for panning, not selection

### Export fails

**Check:**
1. You have write permissions to the output directory
2. Disk space is available
3. File path is valid

**Solutions:**
- Try a different output location
- Check disk space: `df -h` (Linux/macOS) or check in File Explorer (Windows)
- Ensure output directory exists

## Build Issues

### "Tauri CLI not found"

**Solution:**
```bash
cargo install tauri-cli --locked
```

### "Target not installed"

**Solution:**
```bash
rustup target add <target-triple>
```

Common targets:
- `aarch64-apple-darwin` (macOS ARM64)
- `x86_64-apple-darwin` (macOS Intel)
- `x86_64-pc-windows-msvc` (Windows)
- `x86_64-unknown-linux-gnu` (Linux)

### Build fails with icon errors

**Solution:**
1. Check that all icon files exist in `src-tauri/icons/`:
   - `icon.png`
   - `icon.icns` (macOS)
   - `icon.ico` (Windows)
   - Size variants (32x32.png, 128x128.png, etc.)

2. Verify `tauri.conf.json` has correct icon paths

### Linux: Missing system dependencies

**Solution:**
Install all required packages:
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

### Windows: Linker errors

**Solution:**
1. Install Visual C++ Build Tools
2. Restart terminal/IDE after installation
3. Ensure Windows SDK is installed

### macOS: Code signing warnings

**Note:** These are normal for local builds and don't prevent the app from running.

**For distribution:**
1. Set up Apple Developer account
2. Configure signing in `tauri.conf.json`
3. See [Tauri code signing guide](https://tauri.app/v2/guides/distribution/code-signing)

### Build is very slow

**Optimizations:**
1. Use release build: `cargo tauri build --release`
2. Disable debug symbols (if not needed)
3. Use `cargo build` instead of `cargo tauri build` for Rust-only changes

### Out of memory during build

**Solution:**
1. Close other applications
2. Increase swap space (Linux)
3. Build on a machine with more RAM
4. Use GitHub Actions for builds

## Performance Issues

### Application is slow

**Check:**
1. File size (very large FCS files may be slow)
2. Number of points displayed
3. System resources

**Solutions:**
- Close other applications
- Try with a smaller dataset first
- Check system memory usage

### Plot rendering is slow

**Solutions:**
- Reduce zoom level (fewer points to render)
- Disable "Show excluded points" if enabled
- Close and reopen the application

## Getting Help

If you're still experiencing issues:

1. **Check the logs:**
   - macOS: Console.app
   - Linux: Run from terminal
   - Windows: Event Viewer

2. **Search existing issues:**
   - [GitHub Issues](https://github.com/luksgrin/flow-cytometry-analyzer/issues)

3. **Create a new issue:**
   - Include your OS and version
   - Describe the problem clearly
   - Include error messages
   - Attach relevant files (if possible)

4. **Check documentation:**
   - [Tauri documentation](https://tauri.app/v2/)
   - [FCS file format specification](https://isac-net.org/Standards-and-Publications/ISAC-Data-Standards-Project/FCS-Data-Standards/)

## Reporting Bugs

When reporting a bug, please include:

1. **System information:**
   - OS and version
   - Application version
   - Architecture (ARM64, x86_64, etc.)

2. **Steps to reproduce:**
   - Clear, numbered steps
   - Sample data (if possible)

3. **Expected vs. actual behavior:**
   - What should happen
   - What actually happens

4. **Error messages:**
   - Full error text
   - Screenshots if helpful

5. **Additional context:**
   - FCS file format/version
   - File size
   - Any custom configurations

