var browser = window.browser || chrome

var currentTabId = undefined

var domDonateList = document.querySelector('#donate-list')
var domAllowSwitch = document.querySelector('#allow-switch')
var domAllowSwitchControl = document.querySelector('#allow-switch-control')
var domBlockedList = document.querySelector('#blocked-list')
var domSeeAllAds = document.querySelector('#see-all')
var domSeeAllAdsList = document.querySelector('#see-all-list')
var domTotalAds = document.querySelector('#total-ads')
var domTotalAdsText = document.querySelector('#total-ads-text')
var domVersion = document.querySelector('#version')

var tplBlockedItem = document.querySelector('#tpl-blocked-item').innerHTML

domVersion.innerText = browser.runtime.getManifest().version
document.querySelector('#footer-github').addEventListener('click', onOpenHref, false)
document.querySelector('#footer-feedback').addEventListener('click', onOpenHref, false)
document.querySelector('#footer-donate').addEventListener('click', onDonate, false)
browser.tabs.query({ active: true, currentWindow: true}, onCurrentTabFound)

function onOpenHref() {
    window.open(this.href)
}

function onCurrentTabFound(tabs) {
    if (!tabs.length)
        return

    currentTabId = tabs[0].id

    browser.tabs.sendMessage(currentTabId, { type: 'List' }, function(response) {
        browser.storage.local.get('disabled', onStorage)
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
    browser.storage.local.set({'disabled': !domAllowSwitch.checked})
}

function onSeeAllClicked() {
    domSeeAllAds.style.display = 'none'
    domSeeAllAdsList.style.display = 'block'
}

function onDonate() {
    domDonateList.style.display = domDonateList.style.display === 'block' ? 'none' : 'block'
}

function renderBlockedAds(blockedAds) {
    var totalAds = blockedAds.length
    var pluralAds = ''

    if (totalAds > 0) {
        domSeeAllAds.style.display = 'inline'
        domTotalAds.innerText = totalAds
        
        if (totalAds > 1) 
            pluralAds = 's'

        domTotalAdsText.innerText = 'ad' + pluralAds + ' on this page'
    }

    blockedAds.forEach(function(blockedAd) {
        var blockedItem = tplBlockedItem
            .replace(/{author}/, blockedAd.author)
            .replace(/{url}/, blockedAd.url)
            .replace(/{thumbnail}/, blockedAd.thumbnail)

        var domListItem = document.createElement('li')
        domListItem.className = 'blocked-item'
        domListItem.innerHTML = blockedItem

        domListItem.querySelector('a').onclick = onOpenHref

        domBlockedList.appendChild(domListItem)
    })
}