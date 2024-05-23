/**
 * This content-script runs in the context of the page being viewed.  If the page is a FHIR
 * resource, it sends the raw resource content to the extension.  That's it!
 */
function sendToExtension() {
  if (document.contentType === 'application/fhir+json') {
    chrome.runtime.sendMessage({
      action: 'receiveJsonResource',
      json: document.body.innerText,
    });
  } else {
    console.debug('Not a known FHIR resource contentType:', document.contentType);
  }
}

// Send the resource to the extension when the page loads or regains focus.
window.addEventListener('load', sendToExtension, false);
window.addEventListener('focus', sendToExtension, false);
