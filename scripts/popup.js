var domBlockedList = document.querySelector('#blocked-list')
var domTotalAds = document.querySelector('#total-ads')
var domSeeAllAds = document.querySelector('#see-all')

chrome.tabs.query({ active: true, currentWindow: true}, function(tabs) {
    if (!tabs.length)
        return

    chrome.tabs.sendMessage(tabs[0].id, {type: 'BlockedAds'}, function(response) {
        renderBlockedAds(response.data)
    })
})

function renderBlockedAds(blockedAds) {
    domTotalAds.innerText = blockedAds.length

    if (blockedAds.length > 0)
        domSeeAllAds.style.display = 'inline'

    blockedAds.forEach(function(blockedAd) {
        var domListItem = document.createElement('li')
        domListItem.innerText = blockedAd.debugText
        domBlockedList.appendChild(domListItem)
    })
}