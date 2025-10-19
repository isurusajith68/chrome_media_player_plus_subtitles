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

## Alternative: Use the standalone player (player.html)

You can also use the bundled player outside of the content script, which is handy for playing local media and sharing it in calls:

- Open it via the extension: click the extension icon, which opens `player.html` in a new tab.
- Or open the file directly: drag `player.html` from this folder into a Chrome window (or press Ctrl+O in Chrome and select the file).

In the player tab:

- Load a local video file with the "Video file" picker.
- Load subtitles via file or URL; .srt files are auto-converted to WebVTT.
- Use the built-in controls (Fullscreen, PiP) and the sidebar in page videos as needed.

## Share local video with audio in Google Meet

To present your local video with sound to participants:

1. Open `player.html` in a Chrome tab and load your video (see above).
2. Join your Google Meet.
3. Click "Present now" → "A tab".
4. Select the Chrome tab running `player.html`.
5. Ensure "Share tab audio" is enabled in the share dialog.
6. Click Share. Start playback in the `player.html` tab; participants will hear the audio.

Tips (Windows):

- Prefer "A tab" sharing for reliable audio; system/desktop audio sharing is limited and varies by browser.
- Mute your microphone or reduce mic volume to avoid echo/feedback while sharing tab audio.
- Make sure the site/tab isn’t muted (right-click the tab → Unmute site).
- Keep the `player.html` tab focused for the best performance when sharing a tab.

Privacy note: When using `player.html`, your media stays local; only the rendered audio/video from that tab is streamed through Google Meet.

## Development

- All source files are in the root directory.
- Main logic: `content.js`, styles: `styles.css`, popup: `popup.html`/`popup.js`, manifest: `manifest.json`.
- To test changes, reload the extension in `chrome://extensions`.

## License

MIT
