# Deployment rules

This repository publishes the D8D Tech pre-launch website through **GitHub Pages** using GitHub Actions.

## Production policy

| Area | Rule |
| --- | --- |
| Production source | Only the `main` branch is eligible to publish. |
| Pull requests | Every pull request targeting `main` runs type-checking and a GitHub Pages production build. It does **not** deploy. |
| Production deploy | A push to `main` builds and deploys the site after type-checking. |
| Manual deployment | Manual runs are permitted, but the workflow refuses to publish any ref other than `main`. |
| Concurrent releases | Deployments run one at a time; an active production deployment is never cancelled by a later one. |
| Pages permissions | Only the deployment workflow receives `pages: write` and `id-token: write`; validation receives read-only repository access. |
| Site URL | GitHub project Pages serves the build from `https://gvalero.github.io/d8d-tech-website/`. |

## Change workflow

1. Create a feature branch from `main`.
2. Open a pull request into `main`.
3. Wait for **Typecheck and build** to pass.
4. Merge to `main`; the production workflow deploys the validated commit.
5. Use **Actions → Deploy GitHub Pages → Run workflow** only for a controlled redeploy of `main`.

## Configuration boundaries

- The Pages build uses `GITHUB_PAGES=true`, which gives Vite the repository base path. Do not remove this from the workflow.
- Keep `robots.txt` deliberately conservative until launch-search strategy is approved.
- Add a `CNAME` file only when a production custom domain and DNS ownership are confirmed.
- Secrets are not required for the current static site. Add external integrations only through GitHub Secrets or environment secrets—never in source files.
