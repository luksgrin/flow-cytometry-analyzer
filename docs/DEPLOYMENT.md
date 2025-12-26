# Deploying Documentation to GitHub Pages

The documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` or `master` branch.

## Automatic Deployment

The workflow (`.github/workflows/docs.yml`) automatically:
1. Builds the documentation using MkDocs
2. Deploys it to GitHub Pages
3. Makes it available at: `https://luksgrin.github.io/flow-cytometry-analyzer`

## Manual Deployment

To manually trigger a deployment:

1. Go to the Actions tab in GitHub
2. Select "Deploy Documentation" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## Enabling GitHub Pages

If GitHub Pages is not already enabled:

1. Go to repository Settings
2. Navigate to Pages
3. Under "Source", select "GitHub Actions"
4. The workflow will handle the rest

## Local Preview

To preview documentation locally before deploying:

```bash
# Install dependencies
pip install -r docs/requirements.txt

# Serve locally
mkdocs serve

# Build static site
mkdocs build
```

The documentation will be available at `http://127.0.0.1:8000`

## Custom Domain

To use a custom domain:

1. Add a `CNAME` file in the `docs/` directory with your domain
2. Update `site_url` in `mkdocs.yml`
3. Configure DNS settings for your domain

