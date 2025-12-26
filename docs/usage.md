# User Guide

This guide explains how to use Rodrigolab's Flow Cytometry Analyzer to filter and analyze your FCS files.

## Getting Started

### Loading an FCS File

1. Launch the application
2. Click the **"Load FCS File"** button
3. Select your FCS file from the file dialog
4. The file will be loaded and channels will be displayed

### Understanding the Interface

The main interface consists of:
- **Header**: Application title and theme selector
- **Controls Panel**: File operations and export options
- **Channel List**: Available channels from your FCS file
- **Plot Area**: Interactive scatter plot visualization
- **Controls**: Zoom, pan, and scale options

## Basic Workflow

### Step 1: Load Your Data

Click "Load FCS File" and select your FCS file. Once loaded, you'll see:
- A list of available channels
- The first two channels automatically selected for plotting
- A scatter plot showing the data

### Step 2: Select Channels

- Click on channel names to select them for plotting
- The first selected channel becomes the X-axis
- The second selected channel becomes the Y-axis
- The plot updates automatically when you change selections

### Step 3: Create a Filter

1. **Draw a Selection**: 
   - Left-click and drag on the plot to draw a lasso selection
   - The selection automatically closes when you release the mouse
   - Points inside the selection will be highlighted in green

2. **Confirm Selection**:
   - Click "Confirm Selection" to save the filter
   - The filter is saved and you can see how many points were selected
   - You can now create additional filters on different channel combinations

### Step 4: Create Additional Filters (Optional)

1. Select different channels
2. Draw a new selection on the new plot
3. Click "Confirm Selection" to save another filter
4. All filters are automatically combined (intersection)

### Step 5: Export Filtered Data

1. Click "Export Filtered Data"
2. Choose your export format:
   - **CSV**: Comma-separated values
   - **Excel**: XLSX with metadata and data sheets
   - **Parquet**: Compressed columnar format
3. Select the output location
4. The filtered data (points passing all filters) will be exported

## Plot Controls

### Navigation

- **Pan**: Right-click and drag to move around the plot
- **Zoom**: Use the mouse wheel to zoom in/out
- **Reset Zoom**: Click the "Reset" button to return to default view
- **Zoom Buttons**: Use "+" and "−" buttons for precise zoom control

### Scale Options

- **Log Scale**: Check "X-axis: Log scale" or "Y-axis: Log scale" to use logarithmic scaling
- **Linear Scale**: Uncheck to use linear scaling
- Useful for channels with wide value ranges

### Selection Tools

- **Lasso Selection**: Left-click and drag to draw a freehand selection
- **Clear Selection**: Click "Clear Selection" to remove the current selection
- **Reset Filter**: If you return to a channel pair with an existing filter, you can reset it

## Advanced Features

### Multiple Filters

- Create filters on different channel combinations
- All filters are automatically combined (only points passing ALL filters are kept)
- View filter summary showing total events, passing events, and excluded events

### Showing Excluded Points

- Check "Show excluded points from past filters" to visualize points excluded by other filters
- Excluded points appear in orange/brown color
- Helps you understand how filters interact

### Themes

- Select from Light, Dim, or Dark themes
- "System" option follows your system preference
- Theme preference is saved between sessions

### Filter Management

- **Filter Summary**: Shows statistics about your filters
- **Reset Filter**: Allows you to reset a filter for a specific channel pair
- **Existing Filter Warning**: Alerts you when you return to a channel pair with a saved filter

## Export Formats

### CSV

- Simple comma-separated values
- Can be opened in Excel, Google Sheets, or any text editor
- Contains only the filtered data

### Excel (XLSX)

- Two sheets: "metadata" and "data"
- Metadata sheet contains FCS file header and text segment information
- Data sheet contains the filtered data
- Preserves data types and formatting

### Parquet

- Compressed columnar format
- Efficient for large datasets
- Can be read by Python (pandas), R, and other data analysis tools

## Tips and Best Practices

1. **Start with Common Channels**: Begin with FSC-A vs SSC-A or other standard channel pairs
2. **Use Log Scale**: Enable log scale for channels with wide ranges (fluorescence channels)
3. **Zoom for Precision**: Zoom in when making precise selections
4. **Check Filter Summary**: Monitor how many events pass your filters
5. **Save Your Work**: Export frequently to avoid losing your filtering work
6. **Multiple Filters**: Use multiple filters to progressively refine your population

## Keyboard Shortcuts

Currently, the application is primarily mouse-driven. Keyboard shortcuts may be added in future versions.

## Troubleshooting

If you encounter issues, see the [Troubleshooting Guide](troubleshooting.md).

