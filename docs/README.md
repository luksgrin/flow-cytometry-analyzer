# Documentation

This directory contains the documentation for Rodrigolab's Flow Cytometry Analyzer.

## Structure

- `index.md` - Main documentation index
- `installation.md` - Installation guide
- `usage.md` - User guide
- `building.md` - Building from source
- `troubleshooting.md` - Troubleshooting guide

## Building Documentation

These Markdown files can be used with various documentation generators:

### MkDocs

1. Install MkDocs:
   ```bash
   pip install mkdocs mkdocs-material
   ```

2. Create `mkdocs.yml`:
   ```yaml
   site_name: Rodrigolab's Flow Cytometry Analyzer
   theme:
     name: material
   nav:
     - Home: index.md
     - Installation: installation.md
     - Usage: usage.md
     - Building: building.md
     - Troubleshooting: troubleshooting.md
   ```

3. Build and serve:
   ```bash
   mkdocs serve
   ```

### ReadTheDocs

1. Create `.readthedocs.yml`:
   ```yaml
   version: 2
   build:
     os: ubuntu-22.04
     tools:
       python: "3.11"
   mkdocs:
     configuration: mkdocs.yml
   ```

2. Connect repository to ReadTheDocs
3. Documentation will build automatically

### GitHub Pages

1. Use GitHub Actions to build and deploy
2. Or use MkDocs GitHub Pages plugin

## Contributing

To update documentation:
1. Edit the relevant Markdown file
2. Test locally with MkDocs
3. Submit a pull request

