# Flow Cytometry Analyzer

This package includes a minimal implementation on filtering your `.fcs` files depending on the channels of your choice, similar as one would do with [Flowjo](https://www.flowjo.com/solutions/flowjo) software.
The filtered data is exported as a `.parquet.gzip` file, and the metadata can optionally be exported as a `.json` file.
The default channels are `SSC-A` and `FSC-A`, which are the standard channels for gating. These channels are always used, even when not specified.
The specified channels through the `--channels` argument are plotted with the `FSC-A` channels, and the user can select the region of interest.


## Installation

```bash
pip install flow-cytometry-analyzer
```

## Usage

```bash
usage: flow_cytometry_analyzer.py [-h] --input INPUT --output OUTPUT [--metadata] [--channels CHANNELS [CHANNELS ...]]

Filter your flow cytometry files by manual selection on some channels.

options:
  -h, --help            show this help message and exit
  --input INPUT         Input file path
  --output OUTPUT       Output file path
  --metadata            Export metadata as json
  --channels CHANNELS [CHANNELS ...]
                        Channels to use
```

## Example

```bash
flow_cytometry_analyzer --input ./data/flow_cytometry.fcs --output ./data/flow_cytometry_filtered.fcs --channels FITC-A SSC-W
```
