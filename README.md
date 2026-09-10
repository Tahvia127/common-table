# Common Table — Chicago Food Security

A nonprofit site where the donation ask and the impact dashboard are driven by the same file.

**Status:** unpublished demo. Not on GitHub Pages, not linked from the studio site.
**Built by:** Framework Studio.

---

## What this one proves

Most freelance web designers can build a donate button. Very few can build the chart that justifies pressing it.

- **A live impact dashboard** — four headline figures, meals by year, a spend breakdown, meals by neighborhood, and revenue by source. All generated from `data/impact.json`. Update the file, and the annual report updates itself.
- **A giving calculator tied to the same data.** Cost per meal lives in `data/give.json`; the tier cards and the custom-amount box both derive from it. Change the cost per meal in one place and every "$50 = 119 meals" on the page follows.
- **Donation handoff** to Zeffy, which charges nonprofits nothing, so 100% of a gift arrives.

The pitch to a nonprofit board is short: your annual report is a PDF nobody opens, and this replaces it with a page a donor can check in ten seconds.

## The charts

Hand-rolled SVG. No Chart.js, no D3, no runtime dependency at all — the page has zero JavaScript libraries and the charts are in the HTML when it arrives.

Each chart carries a `<title>` and `<desc>` for screen readers, per-segment `<title>` tooltips, and the year-by-year figures also exist as a visually hidden `<table>` so the data is reachable without seeing the graphic.

```
data/impact.json ─┐
data/give.json   ─┤─> build.mjs ─> index.html  (charts rendered as inline SVG)
data/site.json   ─┤
src/index.template ┘
```

## Repository layout

```
data/impact.json   Every figure on the dashboard.
data/give.json     Cost per meal and the giving tiers.
data/site.json     Mission, contact, demo notice.
build.mjs          Renders the template and draws the SVG charts. No dependencies.
src/               Page template with {{TOKEN}} placeholders.
index.html         Generated. Do not edit by hand.
```

## Running it

```bash
node build.mjs
python3 -m http.server 8000
```

## Design notes

- **Type:** Newsreader for display, Inter for body and chart labels.
- **Color:** cream `#FBF7EF`, teal `#0F4C5C`, amber `#9C5D0D`. Every text pairing clears WCAG AA. Two values were darkened during the build: amber was 4.30:1 on cream and the light amber was 3.93:1 on teal, both failing at the sizes they are used.
- **Chart palette** is defined once and shared between the CSS tokens and the SVG literals, so a colour change cannot leave the legend disagreeing with the donut.

## Before this goes to a real client

1. Replace the figures in `data/impact.json` with the organisation's real numbers, and the photography in `assets/img/`.
2. Connect the give button to Zeffy, Donorbox or Givebutter.
3. Set `demo.show` to `false` in `data/site.json`.

## A note on the numbers and the imagery

Common Table is fictional and **every figure is invented**, including the EIN placeholder. The demo banner says so on every screen, because a nonprofit page carrying plausible-looking financials is exactly the kind of thing that should not be mistaken for real.

Photography is Unsplash, under the Unsplash License. Images that read as international-aid photography were deliberately excluded, since using them to illustrate Chicago food-security work would misrepresent it.
