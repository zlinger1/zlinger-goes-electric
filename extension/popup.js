// Configuration
const API_URL = 'http://localhost:3000'; // TODO: make this configurable

// Get DOM elements
const saveAllTabsBtn = document.getElementById('saveAllTabs');
const saveCurrentTabBtn = document.getElementById('saveCurrentTab');
const openDashboardBtn = document.getElementById('openDashboard');
const statusDiv = document.getElementById('status');

// Set status message
function setStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? '#dc2626' : '#6b7280';
  setTimeout(() => {
    statusDiv.textContent = '';
  }, 3000);
}

// Save all tabs
saveAllTabsBtn.addEventListener('click', async () => {
  try {
    saveAllTabsBtn.disabled = true;
    setStatus('Saving all tabs...');

    const tabs = await chrome.tabs.query({ currentWindow: true });

    // Send message to background script to process tabs
    chrome.runtime.sendMessage({
      action: 'saveTabs',
      tabs: tabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl
      }))
    }, (response) => {
      if (response.success) {
        setStatus(`Saved ${tabs.length} tabs!`);
        // Close the saved tabs
        chrome.tabs.remove(tabs.map(t => t.id).filter(id => id !== undefined));
      } else {
        setStatus('Error saving tabs', true);
      }
      saveAllTabsBtn.disabled = false;
    });
  } catch (error) {
    console.error('Error saving tabs:', error);
    setStatus('Error saving tabs', true);
    saveAllTabsBtn.disabled = false;
  }
});

// Save current tab
saveCurrentTabBtn.addEventListener('click', async () => {
  try {
    saveCurrentTabBtn.disabled = true;
    setStatus('Saving current tab...');

    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.runtime.sendMessage({
      action: 'saveTabs',
      tabs: [{
        url: currentTab.url,
        title: currentTab.title,
        favIconUrl: currentTab.favIconUrl
      }]
    }, (response) => {
      if (response.success) {
        setStatus('Tab saved!');
        chrome.tabs.remove(currentTab.id);
      } else {
        setStatus('Error saving tab', true);
      }
      saveCurrentTabBtn.disabled = false;
    });
  } catch (error) {
    console.error('Error saving tab:', error);
    setStatus('Error saving tab', true);
    saveCurrentTabBtn.disabled = false;
  }
});

// Open dashboard
openDashboardBtn.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${API_URL}/dashboard` });
});
