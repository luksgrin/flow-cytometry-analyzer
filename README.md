# Flow Cytometry Analyzer

An interactive filtering tool for Flow Cytometry Standard (FCS) files that allows you to manually select regions of interest using lasso selection on scatter plots. This is a free, open-source alternative to FlowJo for basic gating operations.

## What This Software Does

The Flow Cytometry Analyzer helps you filter flow cytometry data by:

1. **Loading FCS files**: Reads standard flow cytometry data files (.fcs format)
2. **Interactive gating**: Creates scatter plots where you can draw lasso selections around regions of interest
3. **Multi-channel filtering**: 
   - Always performs initial gating on **FSC-A vs SSC-A** (standard forward and side scatter channels)
   - Allows additional filtering on any other channels you specify (e.g., FITC-A, PE-A, APC-A)
   - Each additional channel is plotted against FSC-A for selection
4. **Data export**: Saves filtered data in multiple formats:
   - Excel (.xlsx) - default format, easy to view
   - CSV (.csv) - universal text format
   - Parquet (.parquet.gzip) - efficient binary format for data analysis
5. **Metadata export**: Optionally exports FCS file metadata (instrument settings, acquisition parameters) as JSON

The final filtered dataset contains only the events (cells) that fall within **all** of your selected regions (intersection of all gates).

## Installation

### Prerequisites

- **Python 3.10 or higher** must be installed on your system
- **Git** (optional, for automatic updates)

### Setup

The installation is automated through the `run.sh` script. Simply ensure you have Python 3.10+ installed, and the script will handle everything else:

1. Creates a Python virtual environment (if it doesn't exist)
2. Installs all required dependencies automatically
3. Checks for updates from the repository (if it's a git repository)

**No manual installation steps required!** The `run.sh` script takes care of everything.

## Running the Software

### Quick Start

1. **Navigate to the project directory**:
   ```bash
   cd flow-cytometry-analyzer
   ```

2. **Run the script**:
   ```bash
   ./run.sh
   ```

That's it! The script will:
- Set up the environment (if needed)
- Install/update dependencies
- Launch the Flow Cytometry Analyzer

### Command Line Usage

After running `./run.sh`, you can pass command-line arguments directly:

```bash
./run.sh --input data.fcs --output filtered_data
```

Or with additional options:

```bash
./run.sh --input data.fcs --output filtered_data --channels FITC-A PE-A --format csv --metadata
```

### Command Line Options

- `--input FILE`: Path to your input FCS file (required)
- `--output PATH`: Base path for the output file (required). The format will be detected from the extension if you include one (.xlsx, .csv, or .parquet.gzip)
- `--channels CHANNEL [CHANNEL ...]`: Additional channels to use for filtering (space-separated). Common examples: FITC-A, PE-A, APC-A, PerCP-A, SSC-W, FSC-W
- `--format {xlsx,csv,parquet}`: Export format (default: xlsx)
- `--list-channels`: List all available channels in the FCS file and exit
- `--metadata`: Export FCS file metadata as JSON
- `--help`: Show detailed help message with examples

### Examples

**List available channels in a file:**
```bash
./run.sh --input data.fcs --list-channels
```

**Basic usage (exports as Excel by default):**
```bash
./run.sh --input data.fcs --output filtered_data
```

**Export as CSV format:**
```bash
./run.sh --input data.fcs --output filtered_data --format csv
```

**With additional channels for filtering:**
```bash
./run.sh --input data.fcs --output filtered_data --channels FITC-A PE-A
```

**Export metadata as well:**
```bash
./run.sh --input data.fcs --output filtered_data --metadata
```

**Format detected from file extension:**
```bash
./run.sh --input data.fcs --output filtered_data.csv
./run.sh --input data.fcs --output filtered_data.parquet.gzip
```

## How It Works

1. **Initial gating**: The program always starts with FSC-A vs SSC-A scatter plot. Use your mouse to draw a lasso selection around the region of interest.

2. **Additional channels**: For each channel you specify with `--channels`, the program creates a plot of that channel vs FSC-A. Draw lasso selections on each plot.

3. **Selection process**: 
   - Click and drag with your mouse to draw a polygon around the region you want to keep
   - Selected points will be highlighted in green
   - Close the plot window to proceed to the next selection or finalize

4. **Final result**: The filtered data contains only events that fall within **all** selected regions (intersection of all gates).

5. **Export**: The filtered data is saved in your specified format.

## Interactive Selection Tips

- **Draw polygons**: Click and drag to create a lasso selection around your region of interest
- **Visual feedback**: Selected points are highlighted in green immediately
- **Multiple gates**: Close each plot window to proceed to the next gate
- **Final filtering**: Only events passing all gates are included in the output

---

**Note**: This tool is designed for local use. Always run it from within the `flow-cytometry-analyzer` directory using `./run.sh`.
