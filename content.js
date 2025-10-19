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
