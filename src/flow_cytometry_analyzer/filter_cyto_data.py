"""Filter cytometry data using a lasso selector.
"""

# Global imports
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.path import Path
from matplotlib.widgets import LassoSelector
from .cyto_data import cyto_data
import argparse
import json
import sys
import os
from functools import reduce
from pathlib import Path as PathLib


# Class definition
class cyto_lasso_filter():

    def __init__(self, data, channels=None):
        """Initializes the lasso filter.
        """

        if channels is None:
            if set(data.columns).issubset(set(["FSC-A", "SSC-A"])):
                self.channels = ["FSC-A", "SSC-A"]
            else:
                raise ValueError(
                    "No channels specified and no default channels found."
                )

        elif len(channels) == 2:
            self.channels = channels

        else:
            raise ValueError(
                "Only two channels can be specified."
            )
            

        self.data = data

        self.ax = None
        self.fig = None
        self.idx = None

    def onselect(self, verts):
        """Callback function called when a selection is made with the lasso.
        """
        idx = np.nonzero(
            cyto_lasso_filter.points_inside_poly(
                self.data[self.channels[0]],
                self.data[self.channels[1]],
                verts
            )
        )[0]

        # Highlight selected points
        self.ax.scatter(
            self.data.loc[idx, self.channels[0]],
            self.data.loc[idx, self.channels[1]],
            s=0.5,
            c="g"
        )

        self.fig.canvas.draw()

        self.idx = idx

    @staticmethod
    def points_inside_poly(x, y, poly_verts):
        """Check which points are inside the polygon defined by poly_verts.
        """
        path = Path(poly_verts)
        return path.contains_points(np.column_stack((x, y)))

    @staticmethod
    def cyto_scatter(x, y, c="k", title=None, fig=None, ax=None):
        """Create a scatter plot with log scales and labels.

        Args:
            x (pd.Series): x-axis data
            y (pd.Series): y-axis data
            c (str): color of the points
            title (str): title of the plot
            fig (matplotlib.figure.Figure): figure to plot on
            ax (matplotlib.axes.Axes): axes to plot on

        Returns:
            fig (matplotlib.figure.Figure): figure
            ax (matplotlib.axes.Axes): axes
        """

        if fig is None or ax is None:
            fig, ax = plt.subplots()

            if title is not None:
                ax.set_title(title)
    
        ax.set_xscale("log")
        ax.set_yscale("log")

        ax.set_xlabel(x.name)
        ax.set_ylabel(y.name)

        ax.scatter(x, y, s=0.5, c=c )

        return fig, ax

    def run(self):
        """Run the lasso filter.

        Returns:
            idx (np.array): indexes of the selected points
        """
        # Create a plot
        self.fig, self.ax = cyto_lasso_filter.cyto_scatter(
            self.data[self.channels[0]],
            self.data[self.channels[1]],
            title=f"{self.data.filepath}\nSelect points to keep"
        )

        # Create the LassoSelector
        lasso = LassoSelector(
            self.ax,
            lambda vert: self.onselect(vert)
        )

        plt.show()

        return self.idx

# Parser
def create_parser():
    """Create and configure the argument parser."""
    parser = argparse.ArgumentParser(
        description="""Rodrigolab presents:
 _____       _                                                 _
|  __ \     | |                      /\                       (_)
| |__) |   _| |__   ___ _ __  ___   /  \   _ __ ___   __ _ _____ _ __   __ _
|  _  / | | | '_ \ / _ \ '_ \/ __| / /\ \ | '_ ` _ \ / _` |_  / | '_ \ / _` |
| | \ \ |_| | |_) |  __/ | | \__ \/ ____ \| | | | | | (_| |/ /| | | | | (_| |
|_|  \_\__,_|_.__/ \___|_| |_|___/_/    \_\_| |_| |_|\__,_/___|_|_| |_|\__, |
 ______ _                                         _                     __/ |
|  ____| |                      /\               | |                   |___/
| |__  | | _____      ________ /  \   _ __   __ _| |_   _ _______   ___   ___  _ __ 
|  __| | |/ _ \ \ /\ / /______/ /\ \ | '_ \ / _` | | | | |_  / _ \ / _ \ / _ \| '__|
| |    | | (_) \ V  V /      / ____ \| | | | (_| | | |_| |/ / (_) | (_) | (_) | |   
|_|    |_|\___/ \_/\_/      /_/    \_\_| |_|\__,_|_|\__, /___\___/ \___/ \___/|_|   
                                                     __/ |                          
                                                    |___/
Flow Cytometry Analyzer - Interactive filtering tool for FCS files
(BECAUSE I AM NOT GIVING 1 MISERABLE CENT TO USE FLOWJO)
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
EXAMPLES:
  List available channels in a file:
    %(prog)s --input data.fcs --list-channels
  
  Basic usage with required parameters (exports as Excel by default):
    %(prog)s --input data.fcs --output filtered_data
  
  Export as CSV format:
    %(prog)s --input data.fcs --output filtered_data --format csv
  
  Export as Parquet format:
    %(prog)s --input data.fcs --output filtered_data --format parquet
  
  Format detected from file extension:
    %(prog)s --input data.fcs --output filtered_data.csv
    %(prog)s --input data.fcs --output filtered_data.xlsx
    %(prog)s --input data.fcs --output filtered_data.parquet.gzip
  
  With additional channels for filtering:
    %(prog)s --input data.fcs --output filtered_data --channels FITC-A PE-A
  
  Export metadata as well:
    %(prog)s --input data.fcs --output filtered_data --metadata

HOW IT WORKS:
  1. The program always filters on FSC-A vs SSC-A (standard gating channels)
  2. For each additional channel you specify, it will create a plot of that channel vs FSC-A
  3. You can use the mouse to draw a lasso selection around the region of interest
  4. Selected points are highlighted in green
  5. The final result is the intersection of all your selections
  6. Filtered data is saved in the specified format (default: Excel .xlsx)

INTERACTIVE SELECTION:
  - Click and drag with your mouse to draw a polygon around the region you want to keep
  - Selected points will be highlighted in green
  - Close the plot window to proceed to the next selection or finalize
        """
    )

    # Add arguments with detailed help
    parser.add_argument(
        "--input",
        type=str,
        help="""Path to the input FCS (Flow Cytometry Standard) file.
        
This is the raw flow cytometry data file you want to filter. The file must be in 
FCS format (typically .fcs extension). The program will read all channels and 
events from this file.""",
        metavar="FILE"
    )
    
    parser.add_argument(
        "--output",
        type=str,
        help="""Base path for the output file.
        
The filtered data will be saved with the appropriate extension based on the 
export format (see --format). If you include a file extension (.xlsx, .csv, 
or .parquet.gzip), the format will be automatically detected from the extension.
        
Examples:
  --output results/filtered (will use default format, typically .xlsx)
  --output results/filtered.xlsx (will export as Excel)
  --output results/filtered.csv (will export as CSV)
  --output results/filtered.parquet.gzip (will export as Parquet)""",
        metavar="PATH"
    )
    
    parser.add_argument(
        "--channels",
        nargs="+",
        help="""Additional channels to use for filtering (space-separated).
        
Specify one or more channel names that exist in your FCS file. For each channel 
you specify, the program will create an interactive plot showing that channel vs 
FSC-A, allowing you to select regions of interest.
        
Common channel names include: FITC-A, PE-A, APC-A, PerCP-A, SSC-W, FSC-W, etc.
The exact names depend on your flow cytometer configuration.
        
Note: FSC-A and SSC-A are always used for the initial gating step, even if not 
explicitly specified here.""",
        metavar="CHANNEL"
    )
    
    parser.add_argument(
        "--format",
        type=str,
        choices=["xlsx", "csv", "parquet"],
        default="xlsx",
        help="""Export file format (default: xlsx).
        
Choose the format for the exported filtered data:
  xlsx    - Excel format (.xlsx), default and recommended for easy viewing
  csv     - Comma-separated values (.csv), universal text format
  parquet - Parquet format (.parquet.gzip), efficient binary format for data analysis
        
Note: If you specify a file extension in --output, that extension takes 
precedence over this option."""
    )
    
    parser.add_argument(
        "--list-channels",
        action="store_true",
        help="""List all available channels in the FCS file and exit.
        
When this flag is used, the program will load the specified FCS file and display 
all available channel names in a user-friendly format. This is useful for 
discovering which channels are available before running the filtering process.
        
You only need to specify --input when using this option. The program will exit 
after displaying the channels without performing any filtering.
        
Example:
  %(prog)s --input data.fcs --list-channels"""
    )
    
    parser.add_argument(
        "--metadata",
        action="store_true",
        help="""Export the FCS file metadata as a JSON file.
        
When this flag is used, the metadata from the original FCS file (including 
instrument settings, acquisition parameters, etc.) will be saved as a JSON file 
alongside the filtered data. The metadata file will be named <output>_metadata.json.
        
This is useful for keeping track of experimental conditions and instrument 
settings associated with your filtered data."""
    )

    return parser

def parser():
    """Parse command-line arguments."""
    arg_parser = create_parser()
    args = arg_parser.parse_args()
    return args

# Main
def main():

    # Check if no arguments were provided
    if len(sys.argv) == 1:
        arg_parser = create_parser()
        arg_parser.print_help()
        sys.exit(0)
    
    # Parse the command-line arguments
    args = parser()
    
    # Handle --list-channels option
    if args.list_channels:
        if args.input is None:
            print("\nERROR: --input is required when using --list-channels.\n", file=sys.stderr)
            arg_parser = create_parser()
            arg_parser.print_help()
            sys.exit(1)
        
        # Check if input file exists
        if not os.path.isfile(args.input):
            print(f"\nERROR: Input file not found: {args.input}\n", file=sys.stderr)
            print("Please check that the file path is correct and the file exists.\n", file=sys.stderr)
            sys.exit(1)
        
        # Load the data and display channels
        try:
            data = cyto_data(args.input)
            channels = data.channels
            
            print(f"\n{'='*60}")
            print(f"Available channels in: {args.input}")
            print(f"{'='*60}\n")
            
            if not channels:
                print("No channels found in the file.")
            else:
                print(f"Total channels: {len(channels)}\n")
                print("Channel names:")
                print("-" * 60)
                
                # Display channels in columns for better readability
                cols = 3
                for i in range(0, len(channels), cols):
                    row_channels = channels[i:i+cols]
                    # Format each channel with consistent width
                    formatted = [f"{ch:20s}" for ch in row_channels]
                    print("  " + "  ".join(formatted))
                
                print("-" * 60)
                print(f"\nNote: FSC-A and SSC-A are standard gating channels.")
                print("You can use any of these channel names with the --channels option.\n")
            
            sys.exit(0)
        except Exception as e:
            print(f"\nERROR: Could not read FCS file: {e}\n", file=sys.stderr)
            sys.exit(1)
    
    # Check if required arguments are provided
    if args.input is None or args.output is None:
        print("\nERROR: --input and --output are required arguments.\n", file=sys.stderr)
        arg_parser = create_parser()
        arg_parser.print_help()
        sys.exit(1)
    
    # Check if input file exists
    if not os.path.isfile(args.input):
        print(f"\nERROR: Input file not found: {args.input}\n", file=sys.stderr)
        print("Please check that the file path is correct and the file exists.\n", file=sys.stderr)
        sys.exit(1)
    
    # Determine export format from extension or use provided format
    export_format = args.format  # Default format
    original_output = args.output
    
    # Check if extension is provided in the filename
    if original_output.endswith(".parquet.gzip"):
        export_format = "parquet"
        args.output = original_output[:-14]  # Remove .parquet.gzip
    else:
        output_path = PathLib(original_output)
        if output_path.suffix:
            ext = output_path.suffix.lower()
            if ext == ".xlsx":
                export_format = "xlsx"
                args.output = str(output_path.with_suffix(""))
            elif ext == ".csv":
                export_format = "csv"
                args.output = str(output_path.with_suffix(""))
            elif ext == ".parquet":
                export_format = "parquet"
                args.output = str(output_path.with_suffix(""))

    # Default channels that have to be always checked
    channels = [("FSC-A", "SSC-A")]

    # Add the channels specified by the user
    if not args.channels is None:
        channels += [
            (channel, "FSC-A")
            for channel in args.channels
        ]

    # Load the data
    data = cyto_data(args.input)

    filters = []

    # Run the filter for each combination of channels
    for combination in channels:
        
        # Check if the channel is present in the data
        if combination[0] not in data.columns:
            print(f"Channel {combination[0]} not found in data. Skipping.")
            continue

        # Run the filter
        filtered = (
            cyto_lasso_filter(
                data,
                channels=combination
            ).run()
        )

        if len(filtered) == 0:
            print(f"No points selected for channel combinations {combination}. Skipping.")
            continue

        filters.append(filtered)

    # Check if any points were selected
    if len(filters) == 0:
        print("No points selected. Exiting.")
        sys.exit()

    # Intersect the filters to get the final selection
    final_indexes = reduce(np.intersect1d, filters)
    
    # Plot all the points
    fig, ax = cyto_lasso_filter.cyto_scatter(
        data["FSC-A"],
        data["SSC-A"],
        title=f"{data.filepath}\nFinal selection"
    )

    # Plot the final selection on top
    fig, ax = cyto_lasso_filter.cyto_scatter(
        data.loc[final_indexes, "FSC-A"],
        data.loc[final_indexes, "SSC-A"],
        c="r",
        fig=fig,
        ax=ax
    )

    # Get the final selection and show it
    out = data.loc[final_indexes, :]

    print("Selected data:\n", out)

    # Show the plots
    plt.show()

    # Save the data in the specified format
    if export_format == "xlsx":
        output_file = f"{args.output}.xlsx"
        out.to_excel(output_file, index=False, engine="openpyxl")
        print(f"Saved to {output_file}")
    elif export_format == "csv":
        output_file = f"{args.output}.csv"
        out.to_csv(output_file, index=False)
        print(f"Saved to {output_file}")
    elif export_format == "parquet":
        output_file = f"{args.output}.parquet.gzip"
        out.to_parquet(output_file, compression="gzip")
        print(f"Saved to {output_file}")
    else:
        # Fallback to xlsx if format is somehow invalid
        output_file = f"{args.output}.xlsx"
        out.to_excel(output_file, index=False, engine="openpyxl")
        print(f"Saved to {output_file} (default format)")

    # Save the metadata
    if args.metadata:
        metadata_file = f"{args.output}_metadata.json"
        with open(metadata_file, "w") as f:
            json.dump(data.metadata, f, indent=4)

        print(f"Saved metadata to {metadata_file}")