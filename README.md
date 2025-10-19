# Chrome Media Player Plus Subtitles

A Chrome extension that enhances video players with customizable subtitle support, including a floating sidebar for live adjustments.

## Features

- Subtitle size, position, alignment, color, background, and outline controls
- Sidebar UI injected on any page with a video (toggle with CC button or Alt+S)
- Settings persist across sites via Chrome sync storage
- Keyboard shortcuts:
  - F: Fullscreen
  - P: Picture-in-Picture
  - - / =: Increase subtitle size
  - -: Decrease subtitle size
  - Alt+ArrowUp / Alt+ArrowDown: Move subtitles up/down
  - Alt+S: Toggle sidebar
- Popup for loading local video/subtitle files
- Works with native cues and common site captions (YouTube, etc.)

## How to Use

1. **Install the extension** in Chrome (load as unpacked extension in developer mode).
2. **Reload any page with a video.**
3. Click the floating **CC button** or press **Alt+S** to open the subtitle settings sidebar.
4. Adjust subtitle appearance live. Settings are saved and applied everywhere.
5. Use keyboard shortcuts for quick control.

## Development

- All source files are in the root directory.
- Main logic: `content.js`, styles: `styles.css`, popup: `popup.html`/`popup.js`, manifest: `manifest.json`.
- To test changes, reload the extension in `chrome://extensions`.

## License

MIT
