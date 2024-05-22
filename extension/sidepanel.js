// Render a JSON FHIR Resource in the side panel HTML.
function renderJsonResource(json) {
  const target = document.getElementById('fhir-content');
  target.textContent = json;
  // TODO: make this beautiful!
}


// If there is a jsonResource to display, render it.
chrome.storage.session.get(['jsonResource'], ({ jsonResource }) => {
  if (jsonResource) {
    renderJsonResource(jsonResource);
  }
});
