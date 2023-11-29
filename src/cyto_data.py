"""Class for storing cytometry data.
"""

# Global imports
import readfcs
import pandas as pd

# Class definition
class cyto_data(pd.DataFrame):
    """A class for storing cytometry data. Inherits from pandas DataFrame.

    Attributes:
        metadata (dict): A dictionary containing the metadata of the cytometry data.
        channels (list): A list of the channels in the cytometry data.
    """

    def __init__(self, filepath):
        """Initializes the cytometry data.
        """
        
        # Read the cytometry data
        (metadata, data) = readfcs.view(filepath)

        # Initialize the DataFrame
        super().__init__(dict(data))

        # Store the metadata
        self._metadata = metadata
        # Store the filepath
        self._filepath = filepath

    @property
    def metadata(self):
        """Returns the metadata of the cytometry data.
        """
        return self._metadata
    
    @property
    def filepath(self):
        """Returns the filepath of the cytometry data.
        """
        return self._filepath

    @property
    def channels(self):
        """Returns a list of the channels in the cytometry data.
        """
        return list(self.columns[:-1])