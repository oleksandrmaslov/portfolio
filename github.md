# GitHub deployment

- Repository: `oleksandrmaslov/portfolio`
- Default/deploy branch: `master`
- Pages URL: `https://oleksandrmaslov.github.io/portfolio/`
- Pages source: GitHub Actions
- Workflow: `.github/workflows/deploy-pages.yml`
- Entry source: `Landing Final 5.html` (staged as `index.html` in the Pages artifact)

The workflow publishes only runtime files. Backups, uploads, screenshots,
references, tools, Markdown notes and agent metadata are excluded.
