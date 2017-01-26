(function () {
  var browser = window.browser || chrome

  var blockingEnabled = true
  var debugMode = false
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
      node = undefined,
      mutationIndex = 0,
      mutationNode = undefined

    observer = new MutationObserver(function (mutations) {
      for (mutationIndex = 0; mutationIndex < mutations.length; mutationIndex++) {
        mutationNode = mutations[mutationIndex]
        if (mutationNode.addedNodes) {
          for (addedNodeIndex = 0; 
               addedNodeIndex < mutationNode.addedNodes.length; 
               addedNodeIndex++) {
            node = mutationNode.addedNodes[addedNodeIndex]
            if (node.querySelector) {
              // Since Facebook is using react, they are just batching each post dom while 
              // inserting, so we can just remove the mutated dom which resembles the post.
              removeSponsoredPostFeed(
                findAttributeAncestor(findSponsoredPost(node), 'data-testid', 'fbfeed_story'))

              removeSponsoredPostSidebar(node.querySelector('.ego_column'))

              // Sidebar Ads are a react component
              if (node.classList.contains('ego_column'))
                removeSponsoredPostSidebar(node)
            }
          }
        }
      }
    })

    // Just observe on the root of the body, that is where the widget will be rendered when it is
    // discovered.
    observer.observe(document.body, { childList: true, subtree: true })
  }

  function findSponsoredPost(node) {
    var discoverArticle = undefined,
        discoverText = undefined,
        traversalAttempts = 5,
        foundLink = false
  
    discoverArticle = node.querySelector('[role="article"]')

    if (!discoverArticle)
      return null

    discoverArticle = node.querySelector('img')

    if (!discoverArticle)
      return null

    while (traversalAttempts > 0) {
       if (discoverArticle.nodeName === 'A')
         foundLink = true

      if (foundLink && discoverArticle.nodeName === 'DIV')
        break

       discoverArticle = discoverArticle.parentNode
       traversalAttempts--
    }

    discoverText = discoverArticle.querySelector('div > span')
    if (discoverText)
      return discoverText.innerText.toLowerCase() === 'sponsored' ? discoverArticle : null

    return null
  }

  function removeSponsoredPostFeed(element) {
    if (!element)
      return

    var domPostId = element.querySelector('[name="ft_ent_identifier"]')
    var domThumbnail = element.querySelector('img')
    var domAuthor = element.querySelector('h6 a')

    if (!domAuthor)
      domAuthor = element.querySelector('h5 a')
    
    if (domPostId && domAuthor && domThumbnail) {
      var post = {
        url: 'https://www.facebook.com' + domAuthor.pathname + 'posts/' + domPostId.value,
        author: domAuthor.innerText,
        thumbnail: domThumbnail.src
      }
      post.debugText = post.url + ':' + post.author + ':' + post.thumbnail

      removeSponsoredPost(element, post)
    }
    else {
      console.log('AdBlocker for Facebook', 'Parsing failed for sponsored posts, report to' +
                  'developer please.')
    }
  }

  function removeSponsoredPostSidebar(element) {
    if (!element)
      return

    var domAdUnits = element.querySelectorAll('.ego_unit'),
        adUnitIndex = 0,
        domAdUnit = undefined,
        domUrl = undefined,
        domAuthor = undefined,
        domThumbnail = undefined

    for (adUnitIndex = 0; adUnitIndex < domAdUnits.length; adUnitIndex++) {
      domAdUnit = domAdUnits[adUnitIndex]
      domUrl = domAdUnit.querySelector('a[target="_blank"]')
      domAuthor = domAdUnit.querySelector('strong')
      domThumbnail = domAdUnit.querySelector('img')

      if (domUrl && domAuthor && domThumbnail) {
        var post = {
          url: domUrl.href,
          author: domAuthor.innerText,
          thumbnail: domThumbnail.src
        }
        post.debugText = post.url + ':' + post.author + ':' + post.thumbnail
        removeSponsoredPost(domAdUnit, post)
      }
      else {
        console.log('AdBlocker for Facebook', 'Parsing failed for sidebar posts, report to' +
                    'developer please.')
      }
    }

    removeSponsoredPost(element, { debugText: 'SIDEBAR CONTAINER ADS'}, true)
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
      browser.runtime.sendMessage({ type: 'SetBadgeNumber', data: blockedAds.length })
    }
  }

  function hideStaticSponsoredPosts() {
    var sponsoredIndex = 0,
      sponsoredLinks = document.querySelectorAll('[role="article"]')

    for (sponsoredIndex = 0; sponsoredIndex < sponsoredLinks.length; sponsoredIndex++) {
      removeSponsoredPostFeed(
        findAttributeAncestor(
          findSponsoredPost(sponsoredLinks[sponsoredIndex]),
          'data-testid',
          'fbfeed_story'))
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
    var renderedAdIndex = 0,
        domRenderedAd = undefined

    var renderedAds = document.querySelectorAll('.' + classNameForAd)
    for (renderedAdIndex = 0; renderedAdIndex < renderedAds.length; renderedAdIndex++) {
      domRenderedAd = renderedAds[renderedAdIndex]
      if (enabled) 
        domRenderedAd.classList.add(classNameForHiding)
      else
        domRenderedAd.classList.remove(classNameForHiding)
    }
    blockingEnabled = enabled
  }

  function setupMessaging(ready) {
    browser.storage.local.get('disabled', function (items) {
      if (items.disabled !== undefined)
        blockingEnabled = !items.disabled

      ready()
    })

    browser.storage.onChanged.addListener(function(changes, namespace) {
      for (key in changes) {
        if (key === 'disabled')
          setAdVisibility(!changes[key].newValue)
      }
    })
    browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
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
