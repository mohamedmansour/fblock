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
              removeSponsoredPost(node.querySelector('.uiStreamSponsoredLink'))
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
      if (element) {
        element.parentNode.removeChild(element)
        console.log('Remove Sponsored Post')
      }
  }

  function hideStaticSponsoredPosts() {
    var sponsoredIndex = 0,
        sponsoredLinks = document.querySelectorAll('.uiStreamSponsoredLink')

    for (sponsoredIndex = 0; sponsoredIndex < sponsoredLinks.length; sponsoredIndex++) {
      removeSponsoredPost(findAncestor(sponsoredLinks[sponsoredIndex], 'userContentWrapper'))
    }
  }

  function hideStaticSponsoredBar() {
    removeSponsoredPost(document.querySelector('.ego_column'))
  }

  function findAncestor(element, className) {
    while ((element = element.parentElement) && !element.classList.contains(className))
    return element
  }

  return {
    initialize: function() {
      hideDynamicSponsoredPosts()
      hideStaticSponsoredPosts()
      hideStaticSponsoredBar()
    }
  }
})().initialize()
