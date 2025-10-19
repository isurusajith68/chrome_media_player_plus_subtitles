(function () {
  const player = document.getElementById("player");
  const videoFile = document.getElementById("videoFile");
  const videoUrl = document.getElementById("videoUrl");
  const loadVideoUrl = document.getElementById("loadVideoUrl");
  const clearVideo = document.getElementById("clearVideo");
  const subtitleFile = document.getElementById("subtitleFile");
  const subtitleUrl = document.getElementById("subtitleUrl");
  const loadSubtitleUrl = document.getElementById("loadSubtitleUrl");
  const clearSubs = document.getElementById("clearSubs");
  const toggleSubs = document.getElementById("toggleSubs");
  const downloadVtt = document.getElementById("downloadVtt");
  const openFullscreen = document.getElementById("openFullscreen");
  const openPiP = document.getElementById("openPiP");

  let currentTrackEl = null;
  let subsVisible = true;
  let lastVttText = "";

  function revokeIfBlob(u) {
    if (u && u.startsWith("blob:")) URL.revokeObjectURL(u);
  }

  function attachSubtitleTrack(src) {
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
      const t = track.track;
      if (t) t.mode = subsVisible ? "showing" : "hidden";
    });
  }

  function srtToVtt(data) {
    const lines = data.replace(/\r/g, "").split("\n");
    const out = ["WEBVTT", ""];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (/^\d+$/.test(line) && /-->/.test(lines[i + 1] || "")) {
        i++;
        continue;
      }
      if (/-->/.test(line)) {
        out.push(line.replace(/,/g, "."));
        i++;
        while (i < lines.length && lines[i].trim() !== "") {
          out.push(lines[i]);
          i++;
        }
        out.push("");
      } else {
        i++;
      }
    }
    return out.join("\n");
  }

  function forceVttHeader(text) {
    const body = text.replace(/^WEBVTT.*$/m, "").trimStart();
    return `WEBVTT\n\n${body}`;
  }

  videoFile.addEventListener("change", () => {
    const file = videoFile.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (player.src) revokeIfBlob(player.src);
    player.src = url;
    player.play().catch(() => {});
  });

  loadVideoUrl.addEventListener("click", () => {
    const url = (videoUrl.value || "").trim();
    if (!url) return;
    if (player.src) revokeIfBlob(player.src);
    player.src = url;
    player.play().catch(() => {});
  });

  clearVideo.addEventListener("click", () => {
    revokeIfBlob(player.src);
    player.removeAttribute("src");
    player.load();
  });

  subtitleFile.addEventListener("change", async () => {
    const file = subtitleFile.files?.[0];
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const text = await file.text();
    let vttText = text;
    if (ext === "srt") {
      vttText = srtToVtt(text);
    } else if (!/^WEBVTT/m.test(text)) {
      vttText = forceVttHeader(text);
    }
    lastVttText = vttText;
    const blob = new Blob([vttText], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    attachSubtitleTrack(url);
  });

  loadSubtitleUrl.addEventListener("click", async () => {
    const url = (subtitleUrl.value || "").trim();
    if (!url) return;
    try {
      const res = await fetch(url);
      const text = await res.text();
      let vttText = text;
      if (/\.srt($|\?)/i.test(url) || /\d\d:\d\d:\d\d,\d\d\d/.test(text)) {
        vttText = srtToVtt(text);
      } else if (!/^WEBVTT/m.test(text)) {
        vttText = forceVttHeader(text);
      }
      lastVttText = vttText;
      const blob = new Blob([vttText], { type: "text/vtt" });
      const blobUrl = URL.createObjectURL(blob);
      attachSubtitleTrack(blobUrl);
    } catch (e) {
      console.error("Failed to load subtitle URL", e);
    }
  });

  clearSubs.addEventListener("click", () => {
    const tracks = Array.from(player.querySelectorAll("track"));
    tracks.forEach((t) => {
      revokeIfBlob(t.src);
      t.remove();
    });
    currentTrackEl = null;
    subsVisible = true;
    toggleSubs.textContent = "Toggle Subtitles";
  });

  toggleSubs.addEventListener("click", () => {
    subsVisible = !subsVisible;
    const tracks = player.textTracks;
    for (let i = 0; i < tracks.length; i++)
      tracks[i].mode = subsVisible ? "showing" : "hidden";
    toggleSubs.textContent = subsVisible ? "Hide Subtitles" : "Show Subtitles";
  });

  downloadVtt.addEventListener("click", () => {
    if (!lastVttText) return;
    const blob = new Blob([lastVttText], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subtitles.vtt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  openFullscreen.addEventListener("click", () => {
    if (player.requestFullscreen) player.requestFullscreen();
  });

  openPiP.addEventListener("click", async () => {
    try {
      if (document.pictureInPictureElement)
        await document.exitPictureInPicture();
      else await player.requestPictureInPicture();
    } catch (e) {
      console.error("PiP error", e);
    }
  });
})();
