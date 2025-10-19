// Enhanced video player with subtitle support
(function () {
  "use strict";

  // Find all videos on the page
  function findVideos() {
    return document.querySelectorAll("video");
  }

  // Add keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    const video = document.querySelector("video");
    if (!video) return;

    // Don't trigger if user is typing in an input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    switch (e.key.toLowerCase()) {
      case "f":
        // Toggle fullscreen
        if (!document.fullscreenElement) {
          if (video.requestFullscreen) {
            video.requestFullscreen();
          } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
        e.preventDefault();
        break;

      case "p":
        // Toggle Picture-in-Picture
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture();
        } else {
          video.requestPictureInPicture().catch((err) => {
            console.log("PiP error:", err);
          });
        }
        e.preventDefault();
        break;

      case "+":
      case "=":
        // Increase subtitle size
        adjustSubtitleSizeBy(10);
        e.preventDefault();
        break;

      case "-":
        // Decrease subtitle size
        adjustSubtitleSizeBy(-10);
        e.preventDefault();
        break;
      case "ArrowUp":
        if (e.altKey) {
          adjustSubtitleBottomBy(-1);
          e.preventDefault();
        }
        break;
      case "ArrowDown":
        if (e.altKey) {
          adjustSubtitleBottomBy(1);
          e.preventDefault();
        }
        break;
      case "s":
        if (e.altKey) {
          // Alt+S: toggle sidebar
          const sidebar = document.getElementById("subtitle-sidebar");
          if (!sidebar) {
            ensureSidebar();
            document
              .getElementById("subtitle-sidebar")
              ?.classList.remove("hidden");
          } else {
            sidebar.classList.toggle("hidden");
          }
          e.preventDefault();
        }
        break;
    }
  });

  // Adjust subtitle size helper
  function adjustSubtitleSizeBy(delta) {
    const currentSize =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--subtitle-size"
        )
      ) || 100;
    const newSize = Math.max(50, Math.min(200, currentSize + delta));
    document.documentElement.style.setProperty(
      "--subtitle-size",
      newSize + "%"
    );
    showNotification(`Subtitle size: ${newSize}%`);

    try {
      chrome.storage?.sync?.get(
        { subtitleSettings: { size: 100, bottom: 10, align: "center" } },
        ({ subtitleSettings }) => {
          chrome.storage.sync.set({
            subtitleSettings: { ...subtitleSettings, size: newSize },
          });
        }
      );
    } catch {}
  }

  function adjustSubtitleBottomBy(delta) {
    const current =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--subtitle-bottom"
        )
      ) || 10;
    const next = Math.max(0, Math.min(30, current + delta));
    document.documentElement.style.setProperty("--subtitle-bottom", next + "%");
    showNotification(`Subtitle position: ${next}% from bottom`);

    try {
      chrome.storage?.sync?.get(
        { subtitleSettings: { size: 100, bottom: 10, align: "center" } },
        ({ subtitleSettings }) => {
          chrome.storage.sync.set({
            subtitleSettings: { ...subtitleSettings, bottom: next },
          });
        }
      );
    } catch {}
  }

  // Apply subtitle settings (size, bottom offset, alignment)
  function applySubtitleSettings(settings) {
    if (settings.size != null) {
      document.documentElement.style.setProperty(
        "--subtitle-size",
        `${settings.size}%`
      );
    }
    if (settings.bottom != null) {
      document.documentElement.style.setProperty(
        "--subtitle-bottom",
        `${settings.bottom}%`
      );
    }
    if (settings.align) {
      document.documentElement.style.setProperty(
        "--subtitle-align",
        settings.align
      );
    }
    if (settings.color) {
      document.documentElement.style.setProperty(
        "--subtitle-color",
        settings.color
      );
    }
    if (settings.bgColor != null || settings.bgOpacity != null) {
      const hex = settings.bgColor ?? "#000000";
      const opacity = settings.bgOpacity ?? 0.8;
      const { r, g, b } = hexToRgb(hex);
      const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      document.documentElement.style.setProperty("--subtitle-bg", rgba);
    }
    if (settings.outline != null) {
      document.documentElement.style.setProperty(
        "--subtitle-shadow",
        computeShadow(settings.outline)
      );
    }
  }

  // Sidebar UI injection
  function ensureSidebar() {
    if (document.getElementById("subtitle-sidebar")) return;

    const sidebar = document.createElement("div");
    sidebar.id = "subtitle-sidebar";
    sidebar.innerHTML = `
      <div class="ss-header">
        <span>Subtitle settings</span>
        <button type="button" id="ss-close" title="Close">✕</button>
      </div>
      <div class="ss-row">
        <label for="ss-size">Size <span id="ss-size-val">100%</span></label>
        <input id="ss-size" type="range" min="50" max="200" value="100" />
      </div>
      <div class="ss-row">
        <label for="ss-bottom">Bottom offset <span id="ss-bottom-val">10%</span></label>
        <input id="ss-bottom" type="range" min="0" max="30" value="10" />
      </div>
      <div class="ss-row">
        <label for="ss-align">Alignment</label>
        <div class="ss-align">
          <button type="button" data-align="left" title="Left">⟸</button>
          <button type="button" data-align="center" title="Center" class="active">⟺</button>
          <button type="button" data-align="right" title="Right">⟹</button>
        </div>
      </div>
      <div class="ss-row">
        <label for="ss-color">Text color</label>
        <input id="ss-color" type="color" value="#ffffff" />
      </div>
      <div class="ss-row">
        <label for="ss-bg-color">Background color</label>
        <input id="ss-bg-color" type="color" value="#000000" />
      </div>
      <div class="ss-row">
        <label for="ss-bg-opacity">Background opacity <span id="ss-bg-opacity-val">0.80</span></label>
        <input id="ss-bg-opacity" type="range" min="0" max="1" value="0.8" step="0.05" />
      </div>
      <div class="ss-row">
        <label for="ss-outline">Outline strength <span id="ss-outline-val">1.0</span></label>
        <input id="ss-outline" type="range" min="0" max="2.5" value="1" step="0.1" />
      </div>
    `;

    document.body.appendChild(sidebar);

    // Load stored settings
    chrome.storage?.sync?.get(
      {
        subtitleSettings: {
          size: 100,
          bottom: 10,
          align: "center",
          color: "#ffffff",
          bgColor: "#000000",
          bgOpacity: 0.8,
          outline: 1,
        },
      },
      ({ subtitleSettings }) => {
        const sizeInput = sidebar.querySelector("#ss-size");
        const sizeVal = sidebar.querySelector("#ss-size-val");
        const bottomInput = sidebar.querySelector("#ss-bottom");
        const bottomVal = sidebar.querySelector("#ss-bottom-val");
        const alignBtns = sidebar.querySelectorAll(".ss-align button");
        const colorInput = sidebar.querySelector("#ss-color");
        const bgColorInput = sidebar.querySelector("#ss-bg-color");
        const bgOpacityInput = sidebar.querySelector("#ss-bg-opacity");
        const bgOpacityVal = sidebar.querySelector("#ss-bg-opacity-val");
        const outlineInput = sidebar.querySelector("#ss-outline");
        const outlineVal = sidebar.querySelector("#ss-outline-val");

        sizeInput.value = subtitleSettings.size;
        sizeVal.textContent = `${subtitleSettings.size}%`;
        bottomInput.value = subtitleSettings.bottom;
        bottomVal.textContent = `${subtitleSettings.bottom}%`;
        alignBtns.forEach((b) =>
          b.classList.toggle(
            "active",
            b.dataset.align === subtitleSettings.align
          )
        );

        // Initialize additional inputs
        colorInput.value = subtitleSettings.color;
        bgColorInput.value = subtitleSettings.bgColor;
        bgOpacityInput.value = String(subtitleSettings.bgOpacity);
        bgOpacityVal.textContent = Number(subtitleSettings.bgOpacity).toFixed(
          2
        );
        outlineInput.value = String(subtitleSettings.outline);
        outlineVal.textContent = Number(subtitleSettings.outline).toFixed(1);

        applySubtitleSettings(subtitleSettings);

        sizeInput.addEventListener("input", () => {
          const size = parseInt(sizeInput.value, 10);
          sizeVal.textContent = `${size}%`;
          applySubtitleSettings({ size });
          chrome.storage.sync.set({
            subtitleSettings: { ...subtitleSettings, size },
          });
        });

        bottomInput.addEventListener("input", () => {
          const bottom = parseInt(bottomInput.value, 10);
          bottomVal.textContent = `${bottom}%`;
          applySubtitleSettings({ bottom });
          chrome.storage.sync.set({
            subtitleSettings: { ...subtitleSettings, bottom },
          });
        });

        alignBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            const align = btn.dataset.align;
            alignBtns.forEach((b) => b.classList.toggle("active", b === btn));
            applySubtitleSettings({ align });
            chrome.storage.sync.set({
              subtitleSettings: { ...subtitleSettings, align },
            });
          });
        });

        // Text color
        colorInput.addEventListener("input", () => {
          const color = colorInput.value;
          applySubtitleSettings({ color });
          chrome.storage.sync.set({
            subtitleSettings: { ...subtitleSettings, color },
          });
        });

        // Background color + opacity -> rgba
        function setBg() {
          const opacity = Math.max(
            0,
            Math.min(1, parseFloat(bgOpacityInput.value || "0.8"))
          );
          const hex = bgColorInput.value || "#000000";
          applySubtitleSettings({ bgColor: hex, bgOpacity: opacity });
          chrome.storage.sync.set({
            subtitleSettings: {
              ...subtitleSettings,
              bgColor: hex,
              bgOpacity: opacity,
            },
          });
          bgOpacityVal.textContent = opacity.toFixed(2);
        }
        bgColorInput.addEventListener("input", setBg);
        bgOpacityInput.addEventListener("input", setBg);

        // Outline strength
        outlineInput.addEventListener("input", () => {
          const outline = Math.max(
            0,
            Math.min(2.5, parseFloat(outlineInput.value || "1"))
          );
          applySubtitleSettings({ outline });
          outlineVal.textContent = outline.toFixed(1);
          chrome.storage.sync.set({
            subtitleSettings: { ...subtitleSettings, outline },
          });
        });
      }
    );

    sidebar.querySelector("#ss-close").addEventListener("click", () => {
      sidebar.classList.toggle("hidden");
    });
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const bigint = parseInt(full, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  }

  function computeShadow(strength) {
    const s = Number(strength) || 0;
    const x = (s * 2).toFixed(1);
    const y = (s * 2).toFixed(1);
    const blur = (s * 4).toFixed(1);
    return `${x}px ${y}px ${blur}px rgba(0,0,0,0.9)`;
  }

  // Floating toggle button
  function ensureToggleButton() {
    if (document.getElementById("subtitle-sidebar-toggle")) return;
    const btn = document.createElement("button");
    btn.id = "subtitle-sidebar-toggle";
    btn.title = "Subtitle settings";
    btn.textContent = "CC";
    btn.addEventListener("click", () => {
      ensureSidebar();
      document.getElementById("subtitle-sidebar")?.classList.remove("hidden");
    });
    document.body.appendChild(btn);
  }

  // Show temporary notification
  function showNotification(message) {
    const existing = document.getElementById("subtitle-notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.id = "subtitle-notification";
    notification.className = "subtitle-notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 2000);
  }

  // Enhance subtitles in fullscreen
  document.addEventListener("fullscreenchange", () => {
    const video = document.querySelector("video");
    if (!video) return;

    if (document.fullscreenElement) {
      // Entered fullscreen
      document.body.classList.add("video-fullscreen-mode");
      showNotification("Enhanced fullscreen mode");
      ensureToggleButton();
    } else {
      // Exited fullscreen
      document.body.classList.remove("video-fullscreen-mode");
    }
  });

  // Initialize on page load
  setTimeout(() => {
    const videos = findVideos();
    if (videos.length > 0) {
      console.log(`Video Subtitle Extension: Found ${videos.length} video(s)`);
      ensureToggleButton();
      // Apply stored settings early
      chrome.storage?.sync?.get(
        {
          subtitleSettings: {
            size: 100,
            bottom: 10,
            align: "center",
            color: "#ffffff",
            bgColor: "#000000",
            bgOpacity: 0.8,
            outline: 1,
          },
        },
        ({ subtitleSettings }) => applySubtitleSettings(subtitleSettings)
      );
    }
  }, 1000);

  // Watch for dynamically added videos
  const observer = new MutationObserver(() => {
    findVideos();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
