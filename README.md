# Charles Andrei Galvan · Portfolio

A static, story-style portfolio (HTML, CSS, JavaScript, Three.js). No build step.

Scrolling reads like a story: Prologue → Chapter 1 *What I believe* → Chapter 2 *The proof* (four animated stats)
→ Chapter 3 *The journey* (vertical or horizontal timeline) → Chapter 4 *How I build* (the development cycle as a quest map)
→ Chapter 5 *Things I've built* → Chapter 6 *My toolkit* (animated skill cards) → *More stack* (opt-in technical deep dive)
→ Epilogue (contact). A 3D particle field behind the page reshapes for each chapter. Navigation is the floating dock at the bottom.

## Files

| File | What it is |
|---|---|
| `index.html` | All the text: edit wording here |
| `styles.css` | Colours (top of file, `:root`), layout, light/dark theme |
| `script.js` | Dock, chapter animations, timeline switch, card tilt, copy email, résumé download |
| `scene.js` | The 3D particle field and its chapter shapes |
| `vendor/three.module.min.js` | Three.js r160, served with the site (no CDN dependency) |
| `resume.pdf` | The résumé the "Download résumé" button gives out. Replace it with your own PDF any time (keep the name) |
| `favicon.svg` | Browser tab icon |
| `tools/resume.html` | Source of `resume.pdf` (not deployed). Regenerate: `chrome --headless --no-pdf-header-footer --print-to-pdf=resume.pdf tools/resume.html` |

Notes
- The leadership calendar counts months from January 2020 to today, so "6+ years" updates by itself.
- If `resume.pdf` is ever missing, the button shows a short "coming soon" message instead of a broken download.
- Visitors who turn off animations in their device settings get every animation in its finished state.

## Run it locally

Open it through a local server, not by double-clicking `index.html` (browsers block the 3D module on `file://`):
`npx serve .` or `python -m http.server 8000`.
If animations look frozen, turn on Windows **Settings → Accessibility → Visual effects → Animation effects**.

## Deploy to Vercel

**Option A: drag and drop**
1. Sign in at https://vercel.com, choose **Add New → Project**.
2. Drag this folder in. Framework preset: **Other**. Leave build and output settings empty.
3. Deploy. You get a link like `charles-galvan.vercel.app`.

**Option B: from GitHub (updates deploy automatically)**
1. Push this folder to a new GitHub repository.
2. In Vercel, **Add New → Project → Import** that repository, preset **Other**, and deploy.
3. Every push to the main branch updates the live site.
