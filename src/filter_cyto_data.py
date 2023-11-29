"""Filter cytometry data using a lasso selector.
"""

# Global imports
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.path import Path
from matplotlib.widgets import LassoSelector
from cyto_data import cyto_data

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

if __name__ == "__main__":

    data = cyto_data("sample_data/10-11-2023_AUTOF_001.fcs")

    filters = []

    filters.append(
        cyto_lasso_filter(
            data,
            channels=["FSC-A", "SSC-A"]
        ).run()
    )

    filters.append(
        cyto_lasso_filter(
            data,
            channels=["FITC-A", "FSC-A"]
        ).run()
    )

    final_indexes = np.intersect1d(*filters)
    
    fig, ax = cyto_lasso_filter.cyto_scatter(
        data["FSC-A"],
        data["SSC-A"],
        title=f"{data.filepath}\nFinal selection"
    )

    fig, ax = cyto_lasso_filter.cyto_scatter(
        data.loc[final_indexes, "FSC-A"],
        data.loc[final_indexes, "SSC-A"],
        c="r",
        fig=fig,
        ax=ax
    )

    print(data.loc[final_indexes, :])

    plt.show()