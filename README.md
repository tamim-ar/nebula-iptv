# Nebula IPTV

Nebula IPTV is a lightweight browser-based IPTV player built for static hosting environments like GitHub Pages. It supports M3U/M3U8 and JSON playlists, displays channels in a searchable grid, and plays streams directly in the browser using HLS.js when needed.

## Features

- Responsive dark UI
- HLS playback support with HLS.js
- Search and category filtering
- Channel grid selection
- Built-in controls: play/pause, mute, fullscreen, progress/time display
- Playlist source settings modal
- Playlist URL persisted in browser local storage
- No build step required

## Demo

- Live demo: https://tamim-ar.github.io/nebula-iptv/
- Repository: https://github.com/tamim-ar/nebula-iptv

## Project Files

```text
nebula-iptv/
├── app.js      # Playlist parsing, channel rendering, and player logic
├── index.html  # App layout and UI structure
├── styles.css  # Styling and responsive layout
└── README.md   # Project documentation
```

## Quick Start

### Open in a browser

Open `index.html` directly in your browser.

### Run a local server

For the best experience, run a local server:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## How to Use

1. Open the app.
2. Open the settings modal.
3. Enter a playlist URL (M3U/M3U8 or JSON).
4. Click Save and load.
5. Browse, search, and select a channel to play.

Use the reload button to refresh the currently configured playlist.

## Supported Playlist Formats

### M3U Example

```m3u
#EXTM3U
#EXTINF:-1 tvg-name="Channel One" group-title="News",Channel One
https://example.com/stream/one.m3u8
```

### JSON Example

```json
[
  {
    "name": "Channel One",
    "url": "https://example.com/stream/one.m3u8",
    "group": "News",
    "logo": "https://example.com/logo.png"
  }
]
```

## Configuration

The selected playlist URL is saved in local storage under the key `nebula-static-playlist`.

To change the default playlist, edit the `DEFAULT_PLAYLIST` constant in `app.js`.

## Deployment

This project works well as a GitHub Pages site.

1. Push the repository to GitHub.
2. Go to repository Settings > Pages.
3. Choose the branch to deploy (usually `main`).
4. Save.

Your site will be available at:

```text
https://<your-username>.github.io/nebula-iptv/
```

## Notes

- Streams may require CORS support.
- Some stream providers may block playback in browser environments.
- Browser autoplay rules can require user interaction before playback starts.
- Provide a directly playable HLS-compatible stream URL for the best experience.

## Customize

- `index.html` for structure and UI layout
- `styles.css` for appearance
- `app.js` for playlist parsing, filtering, and player behavior

## License

This project is provided as-is for educational and personal use. Respect the usage terms of any playlist or stream provider.
