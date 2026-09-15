# DNR Purchasing Catalogue

One place that says what we order, exactly how it is specified, and who we order
it from.

Live page: https://alejandromtay06.github.io/dnr-purchasing-catalogue/

## Files

| File | What it is |
|---|---|
| `index.html` | The catalogue. Self contained, fonts embedded, no build step |
| `catalog.json` | The data. This is the only file you edit to change the catalogue |
| `README.md` | This |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are, with no build |

## Publishing it

1. Create the repository and push these three files to the default branch
2. Settings, Pages, Source: Deploy from a branch
3. Branch: your default branch, folder: `/ (root)`
4. Save. The URL appears within a minute

Nothing else. No build, no dependencies, no account needed to read it.

## How to change the catalogue

The page has working forms, but there is no server behind it, so changes live
in your browser until you write them back to the repository.

1. Open the live page
2. Add or edit items and vendors the normal way
3. Click **Download catalog.json**
4. In GitHub, open `catalog.json`, click the pencil, paste the new contents,
   commit

The page updates within a minute of the commit.

If two people edit at the same time, the second commit wins. For a catalogue
that changes a few times a month that is fine. If it starts changing daily,
move it to a spreadsheet.

You can also edit `catalog.json` directly in GitHub without opening the page.
The shape is:

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
