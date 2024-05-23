/**
 * A Chrome extension that shows a side panel when a FHIR resource is viewed
 * in a tab.
 *
 * A content script sends the raw JSON resource to the extension, which then
 * stores the resource into session storage.
 * 
 * The side panel loads the resource from session storage and displays it,
 * rendering it as beautiful HTML.
 */

// Save handles to the current tabID and panel visibility state, so a keyboard
// shortcut can toggle open and close the side panel, when available.
var currentTabId = null;
var panelIsOpen = false;


// Returns true if the url suggests the user is viewing a FHIR resource.
const enablePanelFor = (url) => {
  if (!url) return false;
  if (!url.includes('/fhir/')) return false;
  return /\?_format=json$/.test(url);
};


// Reset the side panel whenever a new tab is activated.
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  currentTabId = tabId;
  const tab = await chrome.tabs.query({ currentWindow: true, active: true });
  return chrome.sidePanel.setOptions({ tabId, enabled: enablePanelFor(tab[0].url) });
});


// Enable the side panel only if the user is viewing a FHIR resource.
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {

  currentTabId = tabId;

  // Do nothing if the page is still loading.
  if (info.status !== 'complete') return;

  // Enable or disable the side panel based on the URL.
  await chrome.sidePanel.setOptions({
    tabId,
    path: 'sidepanel.html',
    enabled: enablePanelFor(tab.url),
  });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});


async function togglePanel(tabId) {
  if (!tabId) return;

  // If the panel is on, the only way to turn it off is to disable it and
  // re-enable it.  Kinda yucky, but it works.
  if (panelIsOpen) {
    await chrome.sidePanel.setOptions({ tabId, enabled: false });
    panelIsOpen = false;
    return chrome.sidePanel.setOptions({ tabId, enabled: true });
  }

  // Open the panel, updating the global variable to reflect the new state.
  return chrome.sidePanel
    .open({ tabId })
    .then(() => { panelIsOpen = true; })
    .catch(console.debug);
}


// Respond to keyboard command shortcuts.
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-panel') {
    return togglePanel(currentTabId);
  }
  console.error('Unknown command:', command);
});


// Place received JSON resources in session storage.
chrome.runtime.onMessage.addListener(async (message, sender, _) => {
  if (message.action === 'receiveJsonResource') {
    chrome.storage.session
      .set({ jsonResource: message.json })
      .then(() => {
        //
        // TODO: change the panel icon to indicate activity.
        //
        console.debug("received resource saved to session storage");
      })
      .catch(console.error);
  } else {
    console.error('Unknown action:', message.action, 'from', sender);
  }
});
