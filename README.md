# The Point Of No Return — Sonnenraum Door Counter App

> Offline-fähige Einlass-Zähler Web-App für das Event **"The Point Of No Return"** im **Sonnenraum** (Eichenstraße 4A, 12435 Berlin).

Built with **[Astro](https://astro.build)**, **Tailwind CSS**, and **[Oxc](https://oxc.rs)**, designed for mobile-first operation by door staff in low-light and low-connectivity environments.

---

## ✨ Features

- **Flyer-Aligned Club Aesthetic:** Glowing crimson, warm amber, and deep stage darks matching the event flyer typography and vibe.
- **Zero-Scroll Mobile Layout:** Strictly constrained to `100dvh` with hardware safe-area insets (`env(safe-area-inset-*)`), preventing accidental scrolling or elastic bouncing on iOS & Android.
- **Proactive PWA Installation Offer:**
  - Automatically offers to install to Home Screen when the page is opened.
  - Native `beforeinstallprompt` on Android Chrome & Desktop.
  - Guided Share Sheet tooltip on iOS Safari (`Teilen ⎋ -> Zum Home-Bildschirm`).
  - Persistent fallback shortcut in Settings Modal.
- **100% Offline-First:**
  - Service Worker (`sw.js`) pre-caches assets for zero-reception basement entry operations.
  - Web Storage API (`localStorage`) guarantees persistent tallies across device locks and reloads.
- **Tactile Feedback:**
  - **Offline Web Audio API Synthesizer:** Pure procedural click and celebration sound effects synthesized on-the-fly with zero external audio assets.
  - **Haptic Vibration API:** Haptic feedback on physical taps and goal milestones.
- **Fast Door Controls:**
  - `+1 Gast` (prominent primary thumb target)
  - `+10 Gruppe` (instant group tally)
  - `(+N)` Custom group input with quick submit
  - `-1 Korrektur` button
  - `Schritt rückgängig` (undo last recorded delta)
- **Target Progress & Goal Celebration:**
  - Real-time progress bar toward the 300-guest minimum target.
  - Dynamic status indicator & celebratory pulse animation upon reaching or exceeding the goal.
- **Multi-Door Station & Sender ID Tracking ("Woher gesendet"):**
  - Station name toggle (e.g. `Tür 1`, `Tür 2`, or staff name).
  - Unique persistent Device / Sender ID (e.g. `DEV-4A8F`), customizable and regenerable in Settings, embedded into all email subjects and shared reports.
- **Native iOS & Android Share Menu (`navigator.share`):**
  - Instant sharing via native OS share sheet (WhatsApp, Telegram, Signal, Mail, AirDrop, Messages).
- **Direct Mailto Link:**
  - Dedicated mail button and customizable `mailto:` recipient in Settings Modal.
- **Audit & History Log:**
  - Timestamped chronological ledger of all admissions and adjustments.

---

## 🛠 Code Quality & Linting (oxc)

The repository uses **[oxlint](https://oxc.rs/docs/guide/usage/linter)** (the Rust-based Oxidation Compiler suite) for lightning-fast linting and code quality validation:

```bash
# Run oxlint across the entire codebase
npm run lint
```

`oxlint` is integrated directly into the CI/CD pipeline, guaranteeing zero warnings and high code standards prior to deployment.

---

## 🚀 Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Start local Astro development server
npm run dev
```

Visit `http://localhost:4321/count/` in your browser.

### Building & Verification

```bash
# Check code quality with oxlint
npm run lint

# Build static production bundle into dist/
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 GitHub Pages Deployment

The repository is configured with an automated GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Automated Pipeline:
1. Every push to `main` executes:
   - Dependency installation (`npm ci`)
   - Rust linter check (`npm run lint` with `oxlint`)
   - Static Astro compilation (`npm run build`)
   - Automatic deployment to GitHub Pages via `actions/deploy-pages@v4`
2. App URL: **`https://el-j.github.io/count/`**
