# Map tracker

- `dm/mapmakerdnd.html` — the DM tool (single file, open it locally; not deployed).
- `site/` — what goes on the web host: `api.php`, `play.html`, `index.html`, `.htaccess`.
- Pushing to `main` with changes under `site/` uploads it automatically (`.github/workflows/deploy.yml`).

## One-time setup
1. On the host, create `config.php` next to `api.php` (copy `site/config.example.php`, set a long random `dm_key`). It is never in git and the deploy never overwrites it.
2. In the repo: Settings → Secrets and variables → Actions → add `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`, `FTP_DIR` (`/public/` on IONOS).
3. Push. In the DM tool: Publish → site address `https://yourdomain`, DM key = the one in config.php.
