# Implementation Planning Document: "The Point Of No Return" Door Counter App

## 1. Project Overview & Objectives
- **Event:** *The Point Of No Return* @ Sonnenraum (Berlin)
- **Goal:** Real-time guest tallying with minimum attendance target of **300 people**.
- **Key Challenges:** 
  - Low-connectivity / underground venue basement conditions (must work 100% offline).
  - Multiple door staff operating counters simultaneously.
  - Quick count actions (+1, +10, -1, group entry) under low-light club conditions.
  - Zero-friction deployment via **GitHub Pages**.
  - Final report export via native `mailto:` link with attendee metrics and timestamps.

---

## 2. Architecture & Tech Stack

### Framework Choice: Astro + Zero-Dependency Static Build
Astro is optimal because it outputs zero-JavaScript hydration by default and generates a clean static directory ready for GitHub Pages hosting (`astro build` -> `dist/`).

For the immediate, portable runtime deployment:
- Single responsive static HTML5 application using embedded CSS and modern Vanilla JS.
- **Service Worker / Cache Storage**: Pre-caches assets for 100% offline functionality.
- **Web Storage API (`localStorage`)**: Real-time state persistence across app restarts, browser crashes, or device locks.
- **Web Audio API**: Tactical low-latency click/chime audio synthesized without external sound asset dependencies.
- **Navigator Haptic API**: Vibration feedback for physical confirmation without looking directly at the screen.

---

## 3. Visual & UX Design (Aligned with Flyer)
- **Poster Aesthetic Reference:**
  - **Color Palette:**
    - Deep Charcoal / Dark Brick Base: `#0a090a`, `#141113`
    - Signature Sonnenraum Orange / Crimson: `#ff4d15`, `#e03500`, `#ff6a3d`
    - Warm Incandescent Amber: `#ffaa33`, `#ffc870`
    - Headline Off-White: `#f5f3ef`
    - Cool Stage Blue Accent: `#2a4468`
  - **Typography:**
    - Primary Display: Bold condensed sans-serif (`Impact`, `Oswald`, `Arial Black`, `system-ui`) matching "No Return".
    - Data & Counts: High-visibility tabular monospace numerals.
  - **Layout:** Mobile-first layout with high-contrast, thumb-sized tap targets designed for one-handed operation in the dark.

---

## 4. Multi-Counter Strategy (Multiple Doormen)
When multiple staff members count guests:
1. **Station Identifier:** Each phone sets an identity (e.g., `Door 1 - Front`, `Door 2 - Courtyard`, `Staff Name`).
2. **Local Session Log:** Every tap records a local delta `[+1, +10, +N, -1]` with an ISO timestamp and counter ID.
3. **End-of-Night Mail Concatenation:** 
   - When tapping **"Send Report"**, the app generates a pre-formatted email:
     - Header summary: Total count, door ID, start time, end time.
     - Target milestone status (e.g., `342 / 300 guests - Goal reached: YES (114%)`).
     - Breakdown by hour or full event ledger.
   - The venue manager receives emails from all doormen and can quickly sum or review individual door throughput.

---

## 5. Storage Data Model

```json
{
  "totalCount": 184,
  "targetGoal": 300,
  "stationName": "Main Entrance",
  "history": [
    {
      "id": "evt_1729188000000",
      "timestamp": "2026-10-17T21:14:02.120Z",
      "delta": 1,
      "runningTotal": 1,
      "type": "quick_add"
    },
    {
      "id": "evt_1729188050000",
      "timestamp": "2026-10-17T21:15:20.450Z",
      "delta": 4,
      "runningTotal": 5,
      "type": "custom_group"
    }
  ]
}
```

---

## 6. GitHub Pages Deployment Guide

### Option A: Direct Static Repository
1. Push `index.html` to the root of a GitHub repository (e.g., `github.com/<user>/sonnenraum-counter`).
2. Go to **Settings > Pages**.
3. Under **Build and deployment > Source**, select `Deploy from a branch` -> `main` / `/ (root)`.
4. Your counter is live immediately at `https://<user>.github.io/sonnenraum-counter/`.

### Option B: Astro Project Structure
If scaffolding as a full Astro project:
```bash
npm create astro@latest sonnenraum-counter -- --template minimal
cd sonnenraum-counter
# Configure astro.config.mjs:
# export default defineConfig({
#   site: 'https://<username>.github.io',
#   base: '/sonnenraum-counter',
# });
npm run build
```
Add GitHub Actions workflow (`.github/workflows/deploy.yml`) using `withastro/action@v3`.

---

## 7. QA & Testing Checklist
- [x] Tested with mobile viewport (iPhone / Android) in portrait mode.
- [x] Offline test: Disconnect Wi-Fi/Cellular; app must remain fully interactive and save counts.
- [x] Session persistence: Refresh and browser kill-tests retain numbers and timestamped history.
- [x] Target goal progress bars scale smoothly from 0 to 300+ with celebration state once surpassed.
- [x] `mailto:` handler escapes multi-line summaries correctly across iOS Mail, Gmail, and Outlook.