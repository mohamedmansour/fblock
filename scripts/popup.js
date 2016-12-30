chrome.tabs.query({ active: true, currentWindow: true}, function(tabs) {
    if (!tabs.length)
        return

    chrome.tabs.sendMessage(tabs[0].id, {type: 'BlockedAds'}, function(response) {
        renderBlockedAds(response.data)
    })
})

function renderBlockedAds(blockedAds) {
    var blockedList = document.querySelector('#blocked-list')

    blockedAds.forEach(function(blockedAd) {
        var listItem = document.createElement('li')
        listItem.innerText = blockedAd.debugText
        blockedList.appendChild(listItem)
    })
}