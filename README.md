# Map tracker

- `dm/mapmakerdnd.html` — the DM tool (single file, open it locally; not deployed).
- `site/` — what goes on the web host: `api.php`, `play.html`, `index.html`, `admin.html`, `.htaccess`.
- Pushing to `main` with changes under `site/` uploads it automatically (`.github/workflows/deploy.yml`).

## One-time setup
1. On the host, create `config.php` next to `api.php` (copy `site/config.example.php`, set a long random `dm_key`). It is never in git and the deploy never overwrites it.
2. In the repo: Settings → Secrets and variables → Actions → add `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`, `FTP_DIR` (`/public/` on IONOS).
3. Push. In the DM tool: Publish → site address `https://yourdomain`, DM key = the one in config.php.

## Hosting other DMs
The key in `config.php` is the owner key. Open `https://yourdomain/admin.html`, sign in with it, and create a key per DM. Send them the key privately; they paste your site address and their key into Publish in the DM tool. Each DM only sees and changes their own campaigns, and is limited by campaigns, maps per campaign and MB (defaults in `config.php` under `dm_defaults`, adjustable per DM in admin.html). Keys can be disabled, or deleted together with all of that DM's data. Only a hash of each key is stored on the server. Campaigns made before DM keys existed belong to the owner key.

## Licence
MIT, see [LICENSE](LICENSE). Copyright (c) 2026 Rodrigo Díaz Morales. Developed with the help of Claude (Anthropic).
