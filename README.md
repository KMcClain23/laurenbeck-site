# Lauren Beck | Narrator — website

A fast, self-contained static site (plain HTML/CSS/JS — no build step, no framework, no monthly fee) to replace the Squarespace site. Deploys to Vercel in a couple of clicks.

## What's here

```
index.html          → the whole site (single page, anchor navigation)
styles.css          → all styling
script.js           → mobile nav, scroll reveals, custom audio players
vercel.json         → clean URLs + caching/security headers
assets/img/         → photos & audiobook covers  (PLACEHOLDERS — see below)
assets/audio/       → narration demo reels        (PLACEHOLDERS — see below)
```

## ⚠️ Swap in Lauren's real files

Everything in `assets/` right now is a **placeholder** so the site previews correctly. Replace each file with Lauren's original, keeping the **exact same filename**, and the site updates automatically — no code changes needed.

**Audio demos** (`assets/audio/`) — drop in the real reels as MP3:

| File | Sample |
|------|--------|
| `romcom.mp3` | RomCom — 1st POV / Dual / Banter / Explicit |
| `paranormal-romance.mp3` | Paranormal Romance — 3rd POV / MF / Intense |
| `romance-kiwi.mp3` | Romance — Kiwi Accent / 1st POV / Female |
| `thriller.mp3` | Thriller — 3rd POV / Female |
| `fantasy-mmc.mp3` | Fantasy — 1st POV / MMC Narration |
| `fantasy-fmc.mp3` | Fantasy — 1st POV / FMC Narration |

**Images** (`assets/img/`):

| File | Used for |
|------|----------|
| `lauren-hero.png` | Large hero portrait |
| `lauren-round.png` | Round "About" photo |
| `lb-round.png` | Favicon / small logo mark |

**Cover art** (`assets/img/covers/`):

| File | Used for |
|------|----------|
| `a-little-crush.jpg`, `fall-to-me.jpg`, `never-stop.jpg`, `chokehold.jpg`, `fated-to-the-phantom.jpg`, `fairy-wings.jpg`, `seal-the-deal.jpg`, `the-rebound-plan.jpg`, `to-find-a-king.jpg`, `santa-promised.jpg`, `babalon.jpg`, `claimed-by-the-creature.jpg` | Selected Work grid — square (1:1) audiobook covers, 600px |
| `over-the-line.jpg`, `house-of-byrne.jpg`, `moniker.jpg` | Releases grid — portrait (2:3) covers |

> The two grids use different aspect ratios on purpose: Selected Work is square
> audiobook art, Releases is 2:3 book art. Match the ratio when swapping a file in,
> or the cover will be cropped.

The older `cover-babalon.png`, `cover-seal-the-deal.png`, and `cover-2.png` are no
longer referenced and can be deleted.

> The original full-resolution images currently live on the Squarespace CDN under
> `https://images.squarespace-cdn.com/content/v1/68605d1d67b18167731b5935/…`
> If you'd rather pull those exact files instead of using new originals, download them from the live site and rename them to match the table above.

## Deploy to Vercel

**Option A — drag & drop (fastest):**
1. Go to <https://vercel.com/new>.
2. Drag this whole folder in, or connect it as a Git repo.
3. Framework preset: **Other** (it's static — no build command, output is the folder root).
4. Deploy. Done.

**Option B — CLI:**
```bash
npm i -g vercel
cd laurenbeck
vercel          # preview
vercel --prod   # production
```

## Custom domain
In the Vercel project → **Settings → Domains**, add `laurenbeckvoice.com` and point the domain's DNS to Vercel (Vercel shows the exact records). Once the audio and photos are swapped in, it's ready to go live.

## Editing content
All copy lives in `index.html` and is clearly sectioned with comments (`<!-- SAMPLES -->`, `<!-- ABOUT -->`, etc.). Colors and fonts are CSS variables at the top of `styles.css` — change them in one place to restyle the whole site.
