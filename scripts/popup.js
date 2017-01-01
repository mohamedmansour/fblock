var currentTabId = undefined

var domAllowSwitch = document.querySelector('#allow-switch')
var domAllowSwitchControl = document.querySelector('#allow-switch-control')
var domBlockedList = document.querySelector('#blocked-list')
var domSeeAllAds = document.querySelector('#see-all')
var domSeeAllAdsList = document.querySelector('#see-all-list')
var domTotalAds = document.querySelector('#total-ads')

document.querySelector('#footer-github').addEventListener('click', onFooterButtonClicked, false)
document.querySelector('#footer-feedback').addEventListener('click', onFooterButtonClicked, false)
chrome.tabs.query({ active: true, currentWindow: true}, onCurrentTabFound)

function onFooterButtonClicked() {
    window.open(this.href)
}

function onCurrentTabFound(tabs) {
    if (!tabs.length)
        return

    currentTabId = tabs[0].id

    chrome.tabs.sendMessage(currentTabId, { type: 'List' }, function(response) {
        chrome.storage.sync.get('disabled', onStorage)
        domAllowSwitch.addEventListener('click', onSwitchToggled, false)
        domSeeAllAds.addEventListener('click', onSeeAllClicked, false)
        renderBlockedAds(response.data)
    })
}

function onStorage(items) {
    if (items.disabled !== undefined && items.disabled === true)
        domAllowSwitch.checked = false
    domAllowSwitchControl.style.display = 'block'
}

function onSwitchToggled() {
    chrome.storage.sync.set({'disabled': !domAllowSwitch.checked})
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