var domBlockedList = document.querySelector('#blocked-list')
var domTotalAds = document.querySelector('#total-ads')
var domSeeAllAds = document.querySelector('#see-all')
var domSeeAllAdsList = document.querySelector('#see-all-list')

chrome.tabs.query({ active: true, currentWindow: true}, onCurrentTabFound)

function onCurrentTabFound(tabs) {
    if (!tabs.length)
        return

    chrome.tabs.sendMessage(tabs[0].id, {type: 'BlockedAds'}, function(response) {
        domSeeAllAds.addEventListener('click', onSeeAllClicked, false)
        renderBlockedAds(response.data)
    })
}

function onSeeAllClicked() {
    domSeeAllAds.style.display = 'none'
    domSeeAllAdsList.style.display = 'block'
}

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