# DNR Purchasing Catalogue

One place that says what we order, exactly how it is specified, and who we order
it from.

Live page: https://alejandromtay06.github.io/dnr-purchasing-catalogue/

## Files

| File | What it is |
|---|---|
| `index.html` | The catalogue. Self contained, fonts embedded, no build step |
| `catalog.json` | The data. Every save from the page becomes a commit to this file |
| `netlify/functions/catalog.mjs` | The shared save. Reads and commits `catalog.json` through the GitHub API |
| `netlify.toml` | Tells Netlify where the page and the function live |
| `README.md` | This |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are, with no build |

## How it is hosted

Two hosts, one repository.

- **GitHub Pages** serves the page at the live URL above. It redeploys on every
  commit, including the commits the save function makes.
- **Netlify** runs the save function at
  `https://dnr-purchasing-catalogue.netlify.app/api/catalog` and also serves a
  copy of the page. The page on either host calls that same function.

The function needs two environment variables on the Netlify project
(Project configuration, Environment variables, scope: Functions):

| Variable | What it is |
|---|---|
| `GITHUB_TOKEN` | A fine-grained personal access token with **Contents: Read and write** on this repository only, nothing else |
| `EDIT_PASSWORD` | The one password the team uses to unlock editing |

Without `GITHUB_TOKEN` the page shows "Shared save is offline" and falls back
to the download-and-commit workflow below. Without `EDIT_PASSWORD` nobody can
unlock.

Changing `index.html` or the function: commit to `main`, then redeploy the
Netlify project (Deploys, Trigger deploy) or push through the Netlify CLI.
GitHub Pages picks the commit up on its own.

## How to change the catalogue

1. Open the live page. The black dock at the bottom holds the actions: add
   item, unlock, zoom, back to top. Click the padlock, **Unlock to edit**
2. Enter your first name and the team password. The name is remembered on
   that device; the password until the tab is closed
3. Add or edit items and vendors the normal way

Every change saves itself about a second later. The status line under the
filters says "Saved 14:32 by Ana" when it has landed, and everyone else sees
the new version within a minute, or straight away when they reload.

Each save is a commit on `catalog.json` signed with the editor's name, so the
repository history is the audit trail: who changed which price, and when.

If two people save the same second, the second one is told the catalogue
changed underneath them and gets the fresh version to re-apply their edit.

### If the shared save is offline

The page falls back to the old workflow: **Download catalog.json**, then in
GitHub open `catalog.json`, click the pencil, paste, commit.

You can also edit `catalog.json` directly in GitHub at any time. The shape is:

```json
{
  "updated": "2026-09-15",
  "items": [
    {
      "id": "cards",
      "name": "Business cards",
      "category": "Print",
      "spec": "16pt uncoated matte, 3.5 x 2 in",
      "note": "Artwork in the brand folder"
    }
  ],
  "vendors": [
    {
      "id": "cards-vendor-a",
      "itemId": "cards",
      "vendor": "Vendor name",
      "channel": "outside",
      "unitCost": 0.14,
      "minQty": 250,
      "deliveryDays": 10,
      "link": "https://",
      "note": "Price confirmed 15 Sept 2026"
    }
  ]
}
```

- `id` must be unique. `vendors[].itemId` must match an `items[].id`
- `category` is one of: Print, Signage, Apparel, Promotional, Office, Property
- `channel` is `appfolio` or `outside`
- `unitCost`, `minQty` and `deliveryDays` are numbers or `null`

## Rules of the catalogue

1. **The specification is not a preference.** If the card says 16pt uncoated
   matte, order 16pt uncoated matte. A resident should meet the same company at
   every property.
2. **Cheapest is not always right.** Lowest price and shortest lead time are
   rarely the same vendor. If the order is needed this week, pay for the days.
3. **Put the date on the price.** Write the date you confirmed a cost in the
   vendor note. A price with no date is a guess.
4. **One vendor is a risk, not a relationship.** Single-vendor items are flagged
   at the top of the page.
5. **Say where it is bought.** Through AppFolio means it lands on the property's
   books. Outside AppFolio means somebody is carrying it on a card. Both are
   fine. Not knowing which is not.

## Note on fonts

`index.html` embeds Aeonik Pro as base64. Those are trial files. Before this
repository is made public, either license the fonts or swap them for the
fallback stack.
