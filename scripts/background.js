// Used to hide and show the badge on Facebook property.
chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostEquals: 'www.facebook.com' },
        })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }])
  })
})

// Communication with the Content Script for messaging.
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.type) {
    case 'SetBadgeNumber':
      sendResponse(updateBadgeNumber(sender.tab.id, request.data))
      break;
    default:
      sendResponse({})
      break;
  }
})

// Updates the badge on that tab.
function updateBadgeNumber(tabId, count) {
  var ctx = document.createElement('canvas').getContext('2d'),
      image = new Image(128, 128)

  image.onload = function() {
    var pageActionText = count + ' sponsored ads hidden.',
        fillText = undefined;

    ctx.drawImage(image, 0, 0, 19, 19)
    ctx.font = '9px arial, sans-serif'

    if (count > 99) {
      fillText = '99+'
    }
    else if (count > 9 || count > 0) {
      fillText = count + ''
    }

    if (fillText) {
      ctx.fillStyle = '#333'
      ctx.fillRect(7, 9, 12, 10)
      ctx.fillStyle = '#fff'
      ctx.fillText(fillText, 12 - (fillText.length * 2), 17, 14)
    }

    chrome.pageAction.setTitle({tabId: tabId, title: pageActionText});
    chrome.pageAction.setIcon({tabId: tabId, imageData: ctx.getImageData(0,0,19,19)});
  }
  image.src = chrome.runtime.getURL('images/facebook.png')
}
