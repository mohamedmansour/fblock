// Simulate pageAction. This is messy since pageActions do not have badge text to add a number. When
// drawing the badge text manually through canvas, you have around 100px less causing the badge to
// look weird. So in this case, use the native badgeAction with badge text, and simulate active
// tabs.

// Catch tab switching
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, updateBrowserActionStatus)
})

// Catch page updates such as refreshes and url changes
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status !== 'complete')
    return

  updateBrowserActionStatus(tab)
})

// When the requested tab is active and facebook domain, start the tab disabling/enabling
function updateBrowserActionStatus(tab) {
  if (new URL(tab.url).hostname !== 'www.facebook.com' || !tab.active) {
    chrome.browserAction.disable(tab.id)
    return
  }

  chrome.browserAction.enable(tab.id)
}