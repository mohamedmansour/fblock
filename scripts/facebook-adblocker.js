(function () {
  var blockingEnabled = true
  var debugMode = true
  var blockedAds = []
  var classNameForAd = generateRandomClassName()
  var classNameForHiding = generateRandomClassName()

  // When developing, makes it easier to locate the ads by drawing an area on top.
  // That allows us to see what we extracted and act upon it.
  function injectCss() {
    document
        .styleSheets[0]
          .insertRule('.' + classNameForHiding +' { display: none }', 0)

    if (debugMode) {
      document
        .styleSheets[0]
          .insertRule('.' + classNameForAd +':before { content: attr(data-content) }', 0)
    }
  }

  function generateRandomClassName() {
    var text = '_',
        allowed = '0123456789abcdefghijklmnopqrstuvwxyz',
        i = 0,
        len = Math.floor(Math.random() * 5) + 2

    for (i=0; i < len; i++)
        text += allowed.charAt(Math.floor(Math.random() * allowed.length))
    
    return text
  }

  // For new posts being added to the DOM, remove the sponsored posts.
  function hideDynamicSponsoredPosts() {
    var addedNodeIndex = 0,
      observer = undefined,
      node = undefined

    observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutationNode) {
        if (mutationNode.addedNodes) {
          for (addedNodeIndex = 0; 
               addedNodeIndex < mutationNode.addedNodes.length; 
               addedNodeIndex++) {
            node = mutationNode.addedNodes[addedNodeIndex]
            if (node.querySelector) {
              // Since Facebook is using react, they are just batching each post dom while 
              // inserting, so we can just remove the mutated dom which resembles the post.
              removeSponsoredPostFeed(
                findAttributeAncestor(node.querySelector('.uiStreamAdditionalLogging'),
                                      'data-testid', 
                                      'fbfeed_story'))

              removeSponsoredPostSidebar(node.querySelector('.ego_column'))

              // Sidebar Ads are a react component
              if (node.classList.contains('ego_column'))
                removeSponsoredPostSidebar(node)
            }
          }
        }
      })
    })

    // Just observe on the root of the body, that is where the widget will be rendered when it is
    // discovered.
    observer.observe(document.body, { childList: true, subtree: true })
  }

  function removeSponsoredPostFeed(element) {
    if (!element)
      return

    var domPostId = element.querySelector('[name="ft_ent_identifier"]')
    var domThumbnail = element.querySelector('img')
    var domAuthor = element.querySelector('h6 a')

    if (!domAuthor)
      domAuthor = element.querySelector('h5 a')
    
    var post = {
      url: '//www.facebook.com' + domAuthor.pathname + 'posts/' + domPostId.value,
      author: domAuthor.innerText,
      thumbnail: domThumbnail.src
    }
    post.debugText = post.url + ':' + post.author + ':' + post.thumbnail

    removeSponsoredPost(element, post)
  }

  function removeSponsoredPostSidebar(element) {
    if (!element)
      return

    var  domAdUnits = element.querySelectorAll('.ego_unit')
    domAdUnits.forEach(function(domAdUnit) {
      // TODO: Extract proper data safely.
      var post = {
        url: '//facebook.com',
        author: 'facebook',
        thumbnail: 'https://www.facebook.com/rsrc.php/v3/y9/r/lvqssrhcBZ0.png',
        debugText: 'SIDE AD'
      }
      removeSponsoredPost(domAdUnit, post)
    })

    removeSponsoredPost(element, {debugText: 'SIDEBAR CONTAINER ADS'}, true)
  }

  function removeSponsoredPost(element, post, supressReporting) {
    element.classList.add(classNameForAd)

    if (debugMode) {
      element.style.outline = '2px solid red'
      element.setAttribute('data-content', post.debugText)
    }

    if (blockingEnabled)
      element.classList.add(classNameForHiding)

    if (!supressReporting) {
      blockedAds.push(post)
      chrome.runtime.sendMessage({type: 'SetBadgeNumber', data: blockedAds.length})
    }
  }

  function hideStaticSponsoredPosts() {
    var sponsoredIndex = 0,
      sponsoredLinks = document.querySelectorAll('.uiStreamAdditionalLogging')

    for (sponsoredIndex = 0; sponsoredIndex < sponsoredLinks.length; sponsoredIndex++) {
      removeSponsoredPostFeed(
        findAttributeAncestor(sponsoredLinks[sponsoredIndex], 'data-testid', 'fbfeed_story'))
    }
  }

  function hideStaticSponsoredBar() {
    removeSponsoredPostSidebar(document.querySelector('.ego_column'))
  }

  function findAttributeAncestor(element, attributeName, attributeValue) {
    if (!element)
      return null

    while (element != null) {
      if (element.getAttribute(attributeName) == attributeValue)
        return element

      element = element.parentNode
    }

    return null
  }

  function setAdVisibility(enabled) {
    var renderedAds = document.querySelectorAll('.' + classNameForAd)
    renderedAds.forEach(function(renderedAd) {
      if (enabled) 
        renderedAd.classList.add(classNameForHiding)
      else
        renderedAd.classList.remove(classNameForHiding)
    })
    blockingEnabled = enabled
  }

  function setupMessaging(ready) {
    chrome.storage.sync.get('disabled', function (items) {
      if (items.disabled !== undefined)
        blockingEnabled = !items.disabled

      ready()
    })

    chrome.storage.onChanged.addListener(function(changes, namespace) {
      for (key in changes) {
        if (key === 'disabled')
          setAdVisibility(!changes[key].newValue)
      }
    })
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      switch (message.type) {
        case 'Reset':
          blockedAds = []
          sendResponse({})
          break
        case 'List':
          sendResponse({ data: blockedAds })
          break
        default:
          sendResponse({})
          break
      }
    })
  }

  // Main
  injectCss()
  setupMessaging(function() {
    console.log('AdBlocker for Facebook (fBlock) Activated! Currently ' + 
      (blockingEnabled ? 'enabled' : 'disabled'))
    hideDynamicSponsoredPosts()
    hideStaticSponsoredPosts()
    hideStaticSponsoredBar()
  })
})()
