// === Popup embedded player logic ===
const player = document.getElementById("player");
const videoInput = document.getElementById("videoFile");
const subtitleInput = document.getElementById("subtitleFile");
const toggleSubsBtn = document.getElementById("toggleSubs");
const clearSubsBtn = document.getElementById("clearSubs");

let currentTrackEl = null;
let subsVisible = true;

function revokeIfBlob(url) {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

videoInput?.addEventListener("change", () => {
  const file = videoInput.files?.[0];
  if (!file) return;
  // Swap source
  const url = URL.createObjectURL(file);
  // Revoke previous
  if (player.src) revokeIfBlob(player.src);
  player.src = url;
  player.play().catch(() => {});
});

subtitleInput?.addEventListener("change", async () => {
  const file = subtitleInput.files?.[0];
  if (!file) return;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const text = await file.text();
  let vttText = text;
  if (ext === "srt") {
    vttText = srtToVtt(text);
  } else if (!/^WEBVTT/m.test(text)) {
    // If missing WEBVTT header, add it
    vttText = forceVttHeader(text);
  }

  const blob = new Blob([vttText], { type: "text/vtt" });
  const url = URL.createObjectURL(blob);
  attachSubtitleTrack(url);
});

function attachSubtitleTrack(src) {
  // Remove existing track if any
  if (currentTrackEl) {
    revokeIfBlob(currentTrackEl.src);
    currentTrackEl.remove();
    currentTrackEl = null;
  }
  const track = document.createElement("track");
  track.kind = "subtitles";
  track.label = "Subtitles";
  track.srclang = "en";
  track.default = true;
  track.src = src;
  player.appendChild(track);
  currentTrackEl = track;

  track.addEventListener("load", () => {
    // Make sure the first track is showing
    const t = track.track; // TextTrack
    if (t) t.mode = subsVisible ? "showing" : "hidden";
  });
}

toggleSubsBtn?.addEventListener("click", () => {
  subsVisible = !subsVisible;
  const tracks = player.textTracks;
  for (let i = 0; i < tracks.length; i++) {
    tracks[i].mode = subsVisible ? "showing" : "hidden";
  }
  toggleSubsBtn.textContent = subsVisible ? "Hide Subtitles" : "Show Subtitles";
});

clearSubsBtn?.addEventListener("click", () => {
  const tracks = Array.from(player.querySelectorAll("track"));
  tracks.forEach((t) => {
    revokeIfBlob(t.src);
    t.remove();
  });
  currentTrackEl = null;
  subsVisible = true;
  toggleSubsBtn.textContent = "Toggle Subtitles";
});

function srtToVtt(data) {
  // Basic SRT -> WebVTT conversion
  // 1) Ensure WEBVTT header
  // 2) Replace commas in timestamps with dots
  // 3) Remove numeric indices
  const lines = data.replace(/\r/g, "").split("\n");
  const out = ["WEBVTT", ""]; // header + blank line
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (/^\d+$/.test(line) && /-->/.test(lines[i + 1] || "")) {
      // index line, skip
      i++;
      continue;
    }
    // Timestamp line
    if (/-->/.test(line)) {
      out.push(line.replace(/,/g, "."));
      i++;
      // cue text lines
      while (i < lines.length && lines[i].trim() !== "") {
        out.push(lines[i]);
        i++;
      }
      out.push(""); // blank line between cues
    } else {
      // If empty or unrelated, just skip or add blank to keep spacing sane
      i++;
    }
  }
  return out.join("\n");
}

function forceVttHeader(text) {
  const body = text.replace(/^WEBVTT.*$/m, "").trimStart();
  return `WEBVTT\n\n${body}`;
}

// === Controls for enhancing the current page video ===
document
  .getElementById("enableFullscreen")
  ?.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: enableEnhancedFullscreen,
    });
  });

document.getElementById("togglePip")?.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: togglePictureInPicture,
  });
});

document
  .getElementById("subtitleSize")
  ?.addEventListener("input", async (e) => {
    const value = e.target.value;
    document.getElementById("sizeValue").textContent = value + "%";
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: adjustSubtitleSize,
      args: [value],
    });
  });

document.getElementById("subtitlePos")?.addEventListener("input", async (e) => {
  const value = e.target.value;
  document.getElementById("posValue").textContent = value + "%";
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: adjustSubtitlePosition,
    args: [value],
  });
});

function enableEnhancedFullscreen() {
  const video = document.querySelector("video");
  if (video) {
    if (video.requestFullscreen) video.requestFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    else if (video.mozRequestFullScreen) video.mozRequestFullScreen();
  }
}

function togglePictureInPicture() {
  const video = document.querySelector("video");
  if (video) {
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else video.requestPictureInPicture();
  }
}

function adjustSubtitleSize(size) {
  document.documentElement.style.setProperty("--subtitle-size", size + "%");
}

function adjustSubtitlePosition(pos) {
  document.documentElement.style.setProperty("--subtitle-bottom", pos + "%");
}
