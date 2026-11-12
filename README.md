# Metals Tracker

Tracks gold, silver, platinum, palladium, and copper prices using the [metals.dev](https://metals.dev) API. A sibling of [token-tracker](https://github.com/akrapacs/token-tracker), deployed the same way to GitHub Pages at https://akrapacs.github.io/metals-tracker/.

- **Desktop:** current price, 1D / 7D / 30D change, low and high (with dates) over the selected history window, position within that range, distance from the high, and a trend sparkline. Click a row for details.
- **Mobile:** current price, 1D change with an up/down indicator, and a small trend sparkline. Tap a row for details.

All metals, including copper, are priced per troy ounce.

## How prices get to the page

The browser never talks to metals.dev and never sees the API key. Instead:

1. `.github/workflows/nextjs.yml` runs hourly. `scripts/update-prices.mjs` uses the `METALS_API_KEY` repository secret to fetch the latest prices, and merges them into a year of daily history.
2. The result is saved as `prices.json` on the `data` branch. The branch is replaced with a single commit each run, since the file itself holds the history.
3. The site is rebuilt with that file at `data/prices.json` and deployed to GitHub Pages. The page loads it and checks for a newer copy every 5 minutes while it's open.

### Request usage

- Each run makes 1 `latest` request. Scheduled runs are skipped while the market is closed (Friday ~22:00 to Sunday ~22:00 UTC), so that's roughly 520 requests a month. With history, about 550-600 in total, well within the Copper plan's 2,000.
- Daily history comes from the `timeseries` endpoint (30 days per request). The first run backfills a year (13 requests); after that it's about 1 request a day.
- Usage doesn't depend on how many people or devices open the site.

To change how often it updates, edit the `cron` schedule in the workflow. GitHub may start scheduled runs late, and it pauses scheduled workflows in public repos after 60 days without repository activity (it emails a warning first; re-enable it from the Actions tab).

The `timeseries` endpoint doesn't return copper, so copper's history is built from the prices recorded on each run.

## Setup

1. Add a repository secret named `METALS_API_KEY` (Settings > Secrets and variables > Actions).
2. Set Settings > Pages > Build and deployment > Source to **GitHub Actions**.
3. Push to `main`, or run the workflow from the Actions tab.

## Development

```bash
npm install
METALS_API_KEY=your-key npm run update-prices   # writes public/data/prices.json (gitignored)
npm run dev
```

Open http://localhost:3000/metals-tracker. Each `update-prices` run uses 1 request, plus 13 the first time to backfill history.

`npm run build` produces the static site in `out/`. Don't run it while `npm run dev` is running; they share the `.next` folder.
