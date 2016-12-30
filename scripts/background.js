// Communication with the Content Script for messaging
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.type) {
    case 'SetBadgeNumber':
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
