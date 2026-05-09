# LSRTA Portal Rebuild

Clean rebuild package for Legacy Signature Rental Trend Analyzer.

## Files
- `worker.js` - Cloudflare Worker replacement
- `styles.css` - shared visual system
- `app.js` - shared Firebase/auth/API helpers
- `index.html` - login/signup
- `dashboard.html` - KPI dashboard + AppFolio sync
- `reports.html` - single report analysis
- `bulk.html` - multi-file analysis
- `compare.html` - compare saved reports
- `rentroll.html` - CSV/TXT rent roll analysis
- `chat.html` - team chat
- `admin.html` - admin/team management

## Cloudflare Worker secrets required
- `ANTHROPIC_API_KEY`
- `APPFOLIO_CLIENT_ID`
- `APPFOLIO_CLIENT_SECRET`
- `FIREBASE_API_KEY`

## Deploy
1. Upload all static files except `worker.js` to GitHub/static host.
2. Replace Cloudflare Worker code with `worker.js`.
3. Confirm `/health` returns success.
4. Confirm `/appfolio-test` returns rows.
5. Login and test Dashboard > Sync AppFolio.
