# Nebula IPTV

A fast, ultra-lightweight, dark-themed live TV streaming web application, designed as the modern web version of the **Nebula IPTV** Android app.

Built with a deep midnight dark interface, instant live stream playback via HLS.js, zero clutter, seamless cross-country favorites, and built-in parallel feed merging from open-source IPTV providers.

![Nebula IPTV](data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2032%2032'%3E%3Cpath%20d='M6%205.5c0-2.2%202.4-3.5%204.3-2.3l16.2%2010.5c1.8%201.1%201.8%203.7%200%204.8L10.3%2029C8.4%2030.2%206%2028.9%206%2026.7V5.5Z'%20fill='%237C4DFF'/%3E%3Cpath%20d='M14.1%2011.1%2021.2%2016l-7.1%204.9v-9.8Z'%20fill='%23ffffff'/%3E%3C/svg%3E)

---

## Highlights & Features

- **Midnight Dark Aesthetic**:
  - Root Background: `#0A0D14`
  - Primary Surface: `#101522`
  - Card Surface: `#141A28`
  - Elevated Surface: `#161D2D`
  - Hover Surface: `#1E263A`
  - Subtle Borders: `#1E2638` & `#2B364E`
  - Electric Nebula Purple Accents: `#7C4DFF` & `#9D75FF`
  - Live Indicator Red: `#FF3358`
  - Favorite Star Gold: `#F59E0B`
  - Text: `#F1F5F9` (Main), `#94A3B8` (Muted), `#64748B` (Subtle)

- **Responsive Three-Tab Navigation**:
  - **All**: Searchable channels list with instant country and category switching.
  - **Favorites**: Cross-country saved channels accessible anytime without switching countries.
  - **Settings**: Source management (built-in toggles & custom feeds) and developer credits.
  - **Desktop / Tablet**: Sleek left sidebar navigation rail alongside a dual-pane layout keeping the video player always visible while browsing channels.
  - **Mobile**: Sticky 16:9 top video player paired with a thumb-friendly bottom navigation bar.

- **Smart Ultra-Minimal Video Player**:
  - Powered by **HLS.js** with native HTML5 fallback for cross-browser M3U8 live stream playback.
  - **Zero UI overlays at the top** of the player for a clean, unobstructed view.
  - **Centered Playback Controls**: Previous Channel (`⏮`), Play/Pause (`▶ / ❚❚`), Next Channel (`⏭`), centered buffer spinner, and offline retry prompt.
  - **Secondary Bottom Bar**: Active channel title with a glowing red `LIVE` badge on the left, and Mute/Unmute + Fullscreen toggles on the right.
  - **Inactivity Auto-Hide**: Controls automatically fade out during playback and reappear on click, tap, or mouse movement.
  - **Desktop Keyboard Shortcuts**:
    - `Space` / `K`: Play / Pause
    - `M`: Mute / Unmute
    - `F`: Fullscreen
    - `ArrowLeft` / `ArrowUp` / `P`: Previous Channel
    - `ArrowRight` / `ArrowDown` / `N`: Next Channel

- **Unified IPTV Feed Providers**:
  - **LiveTVCollector** (JSON feeds from `bugsfreeweb/LiveTVCollector`)
  - **iptv-org** (M3U feeds from `iptv-org/iptv`)
  - **Custom Sources**: Add your own M3U, M3U8, or JSON stream playlists scoped to all countries or a specific region.
  - **Parallel Fetching & Deduplication**: Fetches feeds in parallel, normalizes categories (e.g. `News;General` → `News`, `Undefined` → `General`), merges channels seamlessly, deduplicates streams by URL, and caches results in memory for instant switching.

- **38 Supported Regions & Searchable Modal**:
  - **Bangladesh** (`🇧🇩`) pinned at the top.
  - 37 regions sorted alphabetically A–Z: Arabic, Argentina, Australia, Bahrain, Brazil, Canada, China, Collection, Egypt, France, Germany, India, Indonesia, Israel, Italy, Japan, Malaysia, Mexico, Mixed, Nepal, Pakistan, Peru, Portugal, Qatar, Russia, Saudi Arabia, South Korea, Spain, Special Excess, Thailand, Turkey, UAE, UK, USA, Venezuela, Vietnam, and Worldwide.

- **Channel Card UI**:
  - Square channel logo thumbnail with auto-generated colorful gradient monogram fallback using channel initials when logos fail to load.
  - Channel name with single-line ellipsis truncation.
  - Subtle electric purple border and live equalizer animation on the currently playing channel.
  - Gold star toggle button to favorite or unfavorite channels with full `localStorage` persistence.

---

## Quick Start

### 1. Open in Browser
Open `index.html` directly in any modern browser.

### 2. Run with Local Server (Recommended)
For the smoothest experience with CORS and module loading, run a local HTTP server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

Then visit:
```text
http://localhost:8000
```

---

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` or `K` | Toggle Play / Pause |
| `M` | Toggle Mute / Unmute |
| `F` | Toggle Fullscreen |
| `ArrowLeft`, `ArrowUp`, or `P` | Previous Channel |
| `ArrowRight`, `ArrowDown`, or `N` | Next Channel |
| `Esc` | Close Open Modals / Dropdowns |

---

## Project Structure

```text
nebula-iptv/
├── index.html   # Semantic HTML5 app structure, navigation rail, dual pane, modals
├── styles.css   # Midnight dark theme tokens, responsive dual-pane, player overlays
├── app.js       # Unified parser, parallel feed merger, HLS player, localStorage state
└── README.md    # Documentation and usage guide
```

---

## Credits & Acknowledgements

- **Live Stream Feeds**:
  - [iptv-org](https://github.com/iptv-org/iptv) - Global community live IPTV playlist repository.
  - [LiveTVCollector](https://github.com/bugsfreeweb/LiveTVCollector) - Curated multi-region live streaming collector.
- **Developer**:
  - Developed and maintained by **Tamim Ahasan Rijon** ([GitHub: @tamim-ar](https://github.com/tamim-ar)).

---

## License

This project is created for personal, educational, and open streaming use. Please adhere to the terms and policies of individual stream providers.
