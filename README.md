# Metals Tracker

Tracks gold, silver, platinum, palladium, and copper prices using the [metals.dev](https://metals.dev) API. A sibling of [token-tracker](https://github.com/akrapacs/token-tracker), deployed the same way to GitHub Pages at https://akrapacs.github.io/metals-tracker/.

- **Desktop:** current price, 1D / 7D / 30D change, low and high (with dates) over the selected history window, position within that range, distance from the high, and a trend sparkline. Click a row for details.
- **Mobile:** current price, 1D change with an up/down indicator, and a small trend sparkline. Tap a row for details.

Precious metals are priced per troy ounce; copper is priced per pound.

## API key

The app calls metals.dev directly from the browser (the API supports CORS), so there is no server. The key can be provided two ways:

1. **In the app (recommended):** on first visit, enter the key. It's saved in that browser's local storage only and never leaves the browser except in requests to metals.dev. You'll need to enter it once per device.
2. **At build time:** add a repository secret named `METALS_API_KEY` (Settings > Secrets and variables > Actions). The workflow passes it in as `NEXT_PUBLIC_METALS_API_KEY`. Note that this embeds the key in the public JavaScript bundle, so anyone visiting the site could find it and use your quota.

## Request quota

The free metals.dev plan allows 100 requests per month, so the app keeps API usage low:

- Current prices for all five metals come from a single `latest` request and are cached in local storage. Reloading the page doesn't make a request until the update interval (default 240 minutes) has passed.
- Auto-refresh only runs while the tab is visible and pauses while the market is closed on weekends.
- Daily history comes from the `timeseries` endpoint (30 days per request). Past days are cached permanently, so after the first load it costs about one request per day. The first load costs 1 request per 30 days of the selected window (3 for 90D, 13 for 1Y).
- The footer shows how many requests this browser has made this month.

If the `timeseries` endpoint doesn't return copper, copper's history is built from the `latest` snapshots the app records each day it's used.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000/metals-tracker.

`npm run build` produces the static site in `out/`.

## Deployment

Pushing to `main` runs `.github/workflows/nextjs.yml`, which builds the static export and deploys it to GitHub Pages. In the repository settings, set Pages > Build and deployment > Source to **GitHub Actions**.
