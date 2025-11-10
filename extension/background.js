// Configuration
const API_URL = 'http://localhost:3000';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveTabs') {
    handleSaveTabs(request.tabs).then(result => {
      sendResponse(result);
    }).catch(error => {
      console.error('Error in saveTabs:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
});

// Extract page content from a tab
async function extractPageContent(tabId, url) {
  try {
    // Skip chrome:// and other special URLs
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
        url.startsWith('about:') || url.startsWith('edge://')) {
      return null;
    }

    // Inject content script to extract page text
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Extract main text content
        const body = document.body;
        const title = document.title;

        // Remove script and style elements
        const clone = body.cloneNode(true);
        const scripts = clone.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());

        // Get text content
        const text = clone.innerText || clone.textContent || '';

        // Get meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        const description = metaDesc ? metaDesc.getAttribute('content') : '';

        return {
          title,
          text: text.slice(0, 10000), // Limit to first 10k chars
          description
        };
      }
    });

    return results[0]?.result || null;
  } catch (error) {
    console.error(`Error extracting content from tab ${tabId}:`, error);
    return null;
  }
}

// Save tabs to backend
async function handleSaveTabs(tabs) {
  try {
    const tabsWithContent = [];

    for (const tab of tabs) {
      // Get the actual tab ID for content extraction
      const allTabs = await chrome.tabs.query({ url: tab.url });
      const tabId = allTabs[0]?.id;

      let content = null;
      if (tabId) {
        content = await extractPageContent(tabId, tab.url);
      }

      tabsWithContent.push({
        url: tab.url,
        title: tab.title || content?.title || 'Untitled',
        favIconUrl: tab.favIconUrl,
        content: content ? {
          text: content.text,
          description: content.description
        } : null,
        savedAt: new Date().toISOString()
      });
    }

    // Send to backend API
    const response = await fetch(`${API_URL}/api/tabs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tabs: tabsWithContent
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving tabs:', error);
    return { success: false, error: error.message };
  }
}
