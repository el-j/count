# The Point Of No Return — Sonnenraum Door Counter App

> Offline-fähige Einlass-Zähler Web-App für das Event **"The Point Of No Return"** im **Sonnenraum** (Eichenstraße 4A, 12435 Berlin).

Built with **[Astro](https://astro.build)** & **Tailwind CSS**, designed for mobile-first operation by door staff in low-light and low-connectivity environments.

---

## ✨ Features

- **Flyer-Aligned Club Aesthetic:** Glowing crimson, warm amber, and deep stage darks matching the event flyer typography and vibe.
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
- **Multi-Door Station Identifier:**
  - Station name toggle (e.g. `Tür 1`, `Tür 2`, or staff name) for multi-entrance venues.
- **Audit & History Log:**
  - Timestamped chronological ledger of all admissions and adjustments.
- **Automated Mail Export (`mailto:`):**
  - Instant one-tap report generation with door ID, timestamps, total count, target milestone %, estimated door intake (10 € ticket price), and hourly admission breakdown.
- **Settings Modal:**
  - Adjust door name, default recipient email, target count (default: 300), and protected two-step zero reset.

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

### Building for Production

```bash
# Build static files into dist/
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 GitHub Pages Deployment

The repository is configured with an automated GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Setup in GitHub:
1. Push your commits to `main`:
   ```bash
   git add .
   git commit -m "feat: complete Sonnenraum door counter app with Astro"
   git push origin main
   ```
2. In your GitHub repository settings:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Every push to `main` will automatically build the Astro app and deploy it to:
   **`https://el-j.github.io/count/`**
