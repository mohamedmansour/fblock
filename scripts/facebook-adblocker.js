(function () {
  var debugMode = true
  var removedSponsoredContentCount = 0

  // When developing, makes it easier to locate the ads by drawing an area on top.
  // That allows us to see what we extracted and act upon it.
  function injectDebugCss() {
    console.log('AdBlocker for Facebook (fBlock) Activated!')

    if (debugMode) {
      document
        .styleSheets[0]
          .insertRule('[data-testid="fbfeed_story"]:before { content: attr(data-content); }', 0)
      document
        .styleSheets[0]
          .insertRule('.ego_column:before { content: attr(data-content); }', 0)
    }
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
      return;

    var domPostId = element.querySelector('[name="ft_ent_identifier"]')
    var domThumbnail = element.querySelector('img')
    var domAuthor = element.querySelector('h6 a')

    if (!domAuthor)
      domAuthor = element.querySelector('h5 a')

    var post = {
      id: domPostId.value,
      author: domAuthor.pathname,
      thumbnail: domThumbnail.src 
    }

    removeSponsoredPost(element, post.id + post.author + post.thumbnail)
  }

  function removeSponsoredPostSidebar(element) {
    if (!element)
      return;

    removeSponsoredPost(element, 'SIDEBAR')
  }

  function removeSponsoredPost(element, reason) {
    removedSponsoredContentCount++

    if (debugMode) {
      element.style.outline = '2px solid red'
      element.setAttribute('data-content', reason)
    }
    else {
      element.parentNode.removeChild(element)
    }

    updateBadge(element)
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
    removeSponsoredPostSidebar(document.querySelector('#pagelet_ego_pane'))
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

  function updateBadge(removedElement) {
    chrome.runtime.sendMessage({type: 'SetBadgeNumber', data: removedSponsoredContentCount})
  }

  return {
    initialize: function () {
      injectDebugCss()
      hideDynamicSponsoredPosts()
      hideStaticSponsoredPosts()
      hideStaticSponsoredBar()
    }
  }
})().initialize()
