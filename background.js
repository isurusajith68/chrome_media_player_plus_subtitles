chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Open player.html in a new tab. Pass the active tab id so we can send scripts there if needed.
    const url = chrome.runtime.getURL(
      "player.html?sourceTab=" + (tab?.id ?? "")
    );
    await chrome.tabs.create({ url });
  } catch (e) {
    console.error("Failed to open player tab:", e);
  }
});
