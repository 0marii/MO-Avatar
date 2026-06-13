# MO Avatar

**Owner:** [Mohammad Al Omari](https://github.com/0marii)<br>
**Live Demo:**[ Mo Avatar](https://mo-avatar.vercel.app/)<br><br>
A browser-based animated avatar generator. Customize text, glow, border effects, and modern color themes on a circular canvas, then export as PNG, SVG, GIF, or WebP.

## Features

- **Custom text** — Main name (up to 8 characters) plus two subtitle lines (up to 20 characters each)
- **13 modern themes** — Midnight Blue, Violet Dream, Electric Teal, Warm Sunset, Deep Ocean, Neon Pulse, Soft Rose, Golden Amber, Modern Slate, Aurora, Cyber Violet, Forest Glow, and Molten Lava
- **10 role presets** — Developer, Designer, Founder, PM, Creator, Hacker, Minimal, DevOps, Streamer, and Retro
- **Text styles** — Glow, gradient fill, or clean minimal
- **Text animation** — Pulse, shimmer, or gentle float on the name
- **Background styles** — Mesh, radial, aurora, or animated wave bands
- **Particle styles** — Float, orbit, sparkle, meteor trails, or rising embers
- **Overlay effects** — Scanlines, light sweep, film grain, or starfield
- **Glow controls** — Text glow, glow pulse, center glow, and effect intensity
- **Border styles** — Gradient ring, dual ring, halo, neon, pulse, rainbow chase, dashed spin, comet trail, or minimal
- **Export** — PNG, SVG, GIF, and WebP at 512–2048px with solid or transparent background

## Quick start

No build step required. Serve the project locally and open it in a browser:

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

You can also open `index.html` directly in Chrome, though a local server is recommended for GIF export.

## Usage

1. Pick a preset or choose from 13 color themes (hover to preview).
2. Edit the name and subtitle fields to personalize the avatar.
3. Adjust text style, background, particles, glow, and border settings.
4. Click **Download** for your chosen format, or **Copy Image** to clipboard.

### Export notes

| Format | Requirements |
|--------|--------------|
| PNG / WebP | Works offline in any modern browser |
| SVG | Static vector snapshot |
| GIF | Needs internet on first load (loads encoder from CDN) |

If GIF export fails, refresh the page while connected to the internet and try again.

## Project structure

```
mo-avatar/
├── LICENSE             # MIT license (Mohammad Al Omari)
├── index.html          # App shell, SEO meta, and controls
├── vercel.json         # Vercel headers and static hosting config
├── favicon.svg         # Site icon
├── og.svg              # Social preview image
├── site.webmanifest    # PWA manifest
├── robots.txt
├── 404.html
├── css/styles.css      # Layout and UI styles
└── js/
    ├── main.js         # Entry point and render loop
    ├── config.js       # Canvas size, themes, defaults
    ├── state.js        # Shared state and UI bindings
    ├── storage.js      # localStorage persistence
    ├── renderer.js     # Canvas drawing
    ├── ui.js           # Event handlers and animation loop
    ├── export.js       # PNG, SVG, GIF, and WebP export
    ├── gif-loader.js   # Optional gif.js fallback loader
    └── vercel-observability.js  # Vercel Analytics + Speed Insights
```

## Browser support

Best experience in **Chrome**. PNG export works in all modern browsers. GIF encoding uses Web APIs and may be slower on older devices.

## Deploy to Vercel

This is a static site with no build step. Vercel serves the repo root as-is.

1. Push the repo to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Leave **Framework Preset** as Other and **Build Command** empty.
4. Set **Output Directory** to `.` (project root).
5. Deploy.

### Enable Analytics & Speed Insights

After the first deploy, turn on observability in the Vercel dashboard:

1. Open your project → **Analytics** → **Enable**.
2. Open your project → **Speed Insights** → **Enable**.

The app loads both via `js/vercel-observability.js` on production hosts only (skipped on `localhost`). No npm packages or build step required.

- **Web Analytics** — page views and visitor counts
- **Speed Insights** — Core Web Vitals (LCP, FID, CLS, etc.)

Speed Insights data can take a day or two of traffic before charts populate.

### Post-deploy checklist

- Update `og:image` and `twitter:image` in `index.html` to your full production URL if social previews need absolute paths.
- Settings are saved automatically in the browser via localStorage.

`vercel.json` adds security headers, cache rules, and a custom 404 page.

## License

Copyright © 2026 **Mohammad Al Omari**. Released under the [MIT License](LICENSE).
