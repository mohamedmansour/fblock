// Simulate pageAction. This is messy since pageActions do not have badge text to add a number. When
// drawing the badge text manually through canvas, you have around 100px less causing the badge to
// look weird. So in this case, use the native badgeAction with badge text, and simulate active
// tabs
var tabLoadingMap = {}

// Catch tab switching
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, updateBrowserActionStatus)
})

// Catch page updates such as refreshes and url changes
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  switch (changeInfo.status) {
    case 'loading':
      // A page loads multiple times then completes. For the very first load that we keep track
      // we reset the badge and re-render it
      if (!tabLoadingMap[tab.id]) {
        tabLoadingMap[tab.id] = true
        chrome.tabs.sendMessage(tabId, {type: 'Reset'})
        updateBadgeNumber(tabId, -1)
      }
      return
    case 'complete':
      // Cleanup the tab cache once the page fully loaded, this emulates single load event
      delete tabLoadingMap[tab.id]
      break
    default:
      return
  }

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

// Communication with the Content Script for messaging
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.type) {
    case 'SetBadgeNumber':
    console.log('BADGE', request.data)
      sendResponse(updateBadgeNumber(sender.tab.id, request.data))
      break
    default:
      sendResponse({})
      break
  }
})

// Updates the badge on that tab
function updateBadgeNumber(tabId, count) {
  var ctx = document.createElement('canvas').getContext('2d'),
      image = new Image(32, 32),
      hasAds = count !== -1,
      title = hasAds ? (count + ' sponsored ad' + (count > 1 ? 's' : '') + ' hidden.') : 'No ads.'

  image.onload = function() {
    ctx.drawImage(image, 0, 0, 32, 32)
    chrome.browserAction.setTitle({tabId: tabId, title: title});
    chrome.browserAction.setIcon({tabId: tabId, imageData: ctx.getImageData(0,0,32,32)})
    chrome.browserAction.setBadgeText({tabId: tabId, text: hasAds ? count.toString() : ''})
    chrome.browserAction.setBadgeBackgroundColor({tabId: tabId, color: '#3D5A98' })
  }

  image.src = chrome.runtime.getURL('images/icon32.png')
}
