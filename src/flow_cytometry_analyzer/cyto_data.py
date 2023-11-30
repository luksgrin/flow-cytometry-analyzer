"""Class for storing cytometry data.
"""

# Global imports
import fcsparser
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
        (metadata, data) = fcsparser.parse(filepath)

        # Fix the binary data
        metadata["__header__"]["FCS format"] = (
            metadata["__header__"]["FCS format"]
            .decode("utf-8")
        )

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