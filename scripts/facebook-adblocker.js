(function () {
  var removedSponsoredContentCount = 0

  // For new posts being added to the DOM, remove the sponsored posts.
  function hideDynamicSponsoredPosts() {
    var addedNodeIndex = 0,
      observer = undefined,
      node = undefined

    observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutationNode) {
        if (mutationNode.addedNodes) {
          for (addedNodeIndex = 0; addedNodeIndex < mutationNode.addedNodes.length; addedNodeIndex++) {
            node = mutationNode.addedNodes[addedNodeIndex]
            if (node.querySelector) {
              // Since Facebook is using react, they are just batching
              // each post dom while inserting, so we can just remove the
              // mutated dom which resembles the post.
              removeSponsoredPost(findAttributeAncestor(node.querySelector('.uiStreamAdditionalLogging'), 'data-testid', 'fbfeed_story'))
              removeSponsoredPost(document.querySelector('.ego_column'))
            }
          }
        }
      })
    })

    // Just observe on the root of the body, that is where the widget
    // will be rendered when it is discovered.
    observer.observe(document.body, { childList: true, subtree: true })
  }

  function removeSponsoredPost(element) {
    if (!element)
      return;

    removedSponsoredContentCount++
    element.parentNode.removeChild(element)
    updateBadge(element)
  }

  function hideStaticSponsoredPosts() {
    var sponsoredIndex = 0,
      sponsoredLinks = document.querySelectorAll('.uiStreamAdditionalLogging')

    for (sponsoredIndex = 0; sponsoredIndex < sponsoredLinks.length; sponsoredIndex++) {
      removeSponsoredPost(findAttributeAncestor(sponsoredLinks[sponsoredIndex], 'data-testid', 'fbfeed_story'))
    }
  }

  function hideStaticSponsoredBar() {
    removeSponsoredPost(document.querySelector('#pagelet_ego_pane'))
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
    console.log('Remove Sponsored Post #' + removedSponsoredContentCount)
    chrome.runtime.sendMessage({type: 'SetBadgeNumber', data: removedSponsoredContentCount})
  }

  return {
    initialize: function () {
      hideDynamicSponsoredPosts()
      hideStaticSponsoredPosts()
      hideStaticSponsoredBar()
    }
  }
})().initialize()
