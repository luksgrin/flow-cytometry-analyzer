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
- Node.js and npm
- System dependencies for Tauri (see [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))

### Building

1. Clone the repository:
```bash
git clone <repository-url>
cd flow-cytometry-analyzer
```

2. Install frontend dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

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

## License

MIT
