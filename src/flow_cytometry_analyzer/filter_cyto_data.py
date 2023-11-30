"""Filter cytometry data using a lasso selector.
"""

# Global imports
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.path import Path
from matplotlib.widgets import LassoSelector
from cyto_data import cyto_data
import argparse
import json
import sys
from functools import reduce


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
def parser():
    # Create the parser
    parser = argparse.ArgumentParser(
        description="Filter your flow cytometry files by manual selection on some channels."
    )

    # Add arguments
    parser.add_argument(
        "--input",
        help="Input file path",
        required=True
    )
    parser.add_argument(
        "--output",
        help="Output file path",
        required=True
    )
    parser.add_argument(
        "--metadata",
        help="Export metadata as json",
        action="store_true"
    )
    parser.add_argument(
        "--channels",
        help="Channels to use",
        nargs="+"
    )

    # Parse the command-line arguments
    args = parser.parse_args()

    # Return the parsed arguments
    return args

# Main
def main():

    # Parse the command-line arguments
    args = parser()

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

    # Save the data
    out.to_parquet(
        f"{args.output}.parquet.gzip",
        compression="gzip"
    )

    print(f"Saved to {args.output}.parquet.gzip")

    # Save the metadata
    if args.metadata:
        with open(f"{args.input}_metadata.json", "w") as f:
            json.dump(data.metadata, f, indent=4)

        print(f"Saved metadata to {args.output}.json")