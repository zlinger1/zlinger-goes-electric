// Configuration
const API_URL = window.location.origin;

// State
let currentTab = 'saved-tabs';
let tabs = [];
let digests = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupTabSwitching();
  setupDigestGenerator();
  loadTabs();
  loadDigests();
});

// Tab switching
function setupTabSwitching() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });

  currentTab = tabId;
}

// Load saved tabs
async function loadTabs() {
  try {
    const response = await fetch(`${API_URL}/api/tabs?limit=100`);
    const data = await response.json();
    tabs = data.tabs;

    renderTabs();
  } catch (error) {
    console.error('Error loading tabs:', error);
    document.getElementById('tabs-list').innerHTML = `
      <div class="empty-state">
        <h3>Error loading tabs</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function renderTabs() {
  const tabsList = document.getElementById('tabs-list');
  const totalTabs = document.getElementById('total-tabs');

  totalTabs.textContent = `${tabs.length} tab${tabs.length !== 1 ? 's' : ''} saved`;

  if (tabs.length === 0) {
    tabsList.innerHTML = `
      <div class="empty-state">
        <h3>No tabs saved yet</h3>
        <p>Use the browser extension to start saving tabs</p>
      </div>
    `;
    return;
  }

  tabsList.innerHTML = tabs.map(tab => {
    const savedDate = new Date(tab.saved_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const hasSummary = tab.summary && tab.summary.trim();
    const summaryClass = hasSummary ? '' : 'pending';
    const summaryText = hasSummary ? tab.summary : 'Summary being generated...';

    return `
      <div class="tab-item">
        ${tab.fav_icon_url ? `<img src="${tab.fav_icon_url}" alt="" class="tab-favicon" onerror="this.style.display='none'">` : ''}
        <div class="tab-info">
          <a href="${tab.url}" target="_blank" class="tab-title">${escapeHtml(tab.title)}</a>
          <div class="tab-url">${escapeHtml(tab.url)}</div>
          <div class="tab-summary ${summaryClass}">${escapeHtml(summaryText)}</div>
          <div class="tab-meta">
            <span>Saved ${savedDate}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Load digests
async function loadDigests() {
  try {
    const response = await fetch(`${API_URL}/api/digests`);
    digests = await response.json();

    renderDigests();
  } catch (error) {
    console.error('Error loading digests:', error);
    document.getElementById('digests-list').innerHTML = `
      <div class="empty-state">
        <h3>Error loading digests</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function renderDigests() {
  const digestsList = document.getElementById('digests-list');

  if (digests.length === 0) {
    digestsList.innerHTML = `
      <div class="empty-state">
        <h3>No digests yet</h3>
        <p>Generate your first digest to see patterns in your browsing</p>
      </div>
    `;
    return;
  }

  // Load full content for each digest
  digestsList.innerHTML = digests.map(digest => {
    const startDate = new Date(digest.start_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const endDate = new Date(digest.end_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <div class="digest-item" data-digest-id="${digest.id}">
        <div class="digest-header">
          <div class="digest-date">${startDate} - ${endDate}</div>
          <div class="digest-stats">${digest.tab_count} tabs</div>
        </div>
        <div class="digest-content" data-digest-id="${digest.id}">Loading...</div>
      </div>
    `;
  }).join('');

  // Load full content for each digest
  digests.forEach(digest => {
    loadDigestContent(digest.id);
  });
}

async function loadDigestContent(digestId) {
  try {
    const response = await fetch(`${API_URL}/api/digests/${digestId}`);
    const digest = await response.json();

    const contentEl = document.querySelector(`.digest-content[data-digest-id="${digestId}"]`);
    if (contentEl) {
      contentEl.textContent = digest.content;
    }
  } catch (error) {
    console.error(`Error loading digest ${digestId}:`, error);
  }
}

// Digest generator
function setupDigestGenerator() {
  const generateBtn = document.getElementById('generate-digest-btn');
  const generator = document.getElementById('digest-generator');
  const doGenerateBtn = document.getElementById('do-generate-digest');
  const cancelBtn = document.getElementById('cancel-generate');

  generateBtn.addEventListener('click', () => {
    generator.style.display = 'block';
  });

  cancelBtn.addEventListener('click', () => {
    generator.style.display = 'none';
  });

  doGenerateBtn.addEventListener('click', async () => {
    const days = parseInt(document.getElementById('date-range').value);
    await generateDigest(days);
  });
}

async function generateDigest(days) {
  try {
    const doGenerateBtn = document.getElementById('do-generate-digest');
    doGenerateBtn.disabled = true;
    doGenerateBtn.textContent = 'Generating...';

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const response = await fetch(`${API_URL}/api/digests/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate digest');
    }

    const digest = await response.json();

    // Hide generator
    document.getElementById('digest-generator').style.display = 'none';

    // Reload digests
    await loadDigests();

    // Reset button
    doGenerateBtn.disabled = false;
    doGenerateBtn.textContent = 'Generate';
  } catch (error) {
    console.error('Error generating digest:', error);
    alert(`Error generating digest: ${error.message}`);

    const doGenerateBtn = document.getElementById('do-generate-digest');
    doGenerateBtn.disabled = false;
    doGenerateBtn.textContent = 'Generate';
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-refresh tabs to show new summaries
setInterval(() => {
  if (currentTab === 'saved-tabs') {
    loadTabs();
  }
}, 10000); // Refresh every 10 seconds
