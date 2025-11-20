// Default settings - Free ChatGPT web access only
const DEFAULT_SETTINGS = {
    customPrompt: ''
};

// Preset prompts
const PRESETS = {
    concise: 'Provide a very brief 1-2 sentence summary focusing on the main point only.',
    detailed: 'Provide a comprehensive summary covering all key points, important details, and main conclusions.',
    bullet: 'Summarize as a list of bullet points with the most important information first.',
    technical: 'Provide a technical summary focusing on facts, data, methodologies, and technical details.',
    eli5: 'Explain this like I\'m five years old - use simple language and analogies.'
};

// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
    const settings = await loadSettings();
    populateSettings(settings);
    setupEventListeners();
    await updatePermissionStatus();
});

async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['tabulatorSettings'], (result) => {
            resolve(result.tabulatorSettings || DEFAULT_SETTINGS);
        });
    });
}

function populateSettings(settings) {
    document.getElementById('customPrompt').value = settings.customPrompt || '';
}

function setupEventListeners() {
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            document.getElementById('customPrompt').value = PRESETS[preset];
        });
    });
    
    // Save button
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetSettings);
    
    // Permission buttons
    document.getElementById('grantPermissionsBtn').addEventListener('click', grantPermissions);
    document.getElementById('revokePermissionsBtn').addEventListener('click', revokePermissions);
}

async function saveSettings() {
    const customPrompt = document.getElementById('customPrompt').value.trim();
    
    const settings = {
        customPrompt
    };
    
    chrome.storage.local.set({ tabulatorSettings: settings }, () => {
        showStatus('Settings saved successfully!', 'success');
        
        // Notify background script to reload settings
        chrome.runtime.sendMessage({ action: 'reloadSettings' });
    });
}

function resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
        populateSettings(DEFAULT_SETTINGS);
        showStatus('Settings reset to defaults (not saved yet)', 'success');
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

// Permission management functions
async function updatePermissionStatus() {
    const hasAllUrls = await chrome.permissions.contains({ origins: ['<all_urls>'] });
    
    const statusEl = document.getElementById('permissionStatus');
    const grantBtn = document.getElementById('grantPermissionsBtn');
    const revokeBtn = document.getElementById('revokePermissionsBtn');
    
    if (hasAllUrls) {
        statusEl.textContent = '✓ Full page access granted';
        statusEl.style.color = '#00ff88';
        grantBtn.style.display = 'none';
        revokeBtn.style.display = 'inline-block';
    } else {
        statusEl.textContent = '⚠ Running in fallback mode (title + URL only)';
        statusEl.style.color = '#ff9800';
        grantBtn.style.display = 'inline-block';
        revokeBtn.style.display = 'none';
    }
}

async function grantPermissions() {
    try {
        const granted = await chrome.permissions.request({ origins: ['<all_urls>'] });
        
        if (granted) {
            showStatus('Full page access granted! More detailed summaries now available.', 'success');
            await updatePermissionStatus();
        } else {
            showStatus('Permission request declined. Using fallback mode.', 'error');
        }
    } catch (error) {
        console.error('Error granting permissions:', error);
        showStatus('Failed to grant permissions: ' + error.message, 'error');
    }
}

async function revokePermissions() {
    if (!confirm('Revoke full page access?\n\nThe extension will switch to fallback mode (title + URL only) for more privacy.')) {
        return;
    }
    
    try {
        const revoked = await chrome.permissions.remove({ origins: ['<all_urls>'] });
        
        if (revoked) {
            showStatus('Full page access revoked. Now using fallback mode.', 'success');
            await updatePermissionStatus();
        } else {
            showStatus('Failed to revoke permissions.', 'error');
        }
    } catch (error) {
        console.error('Error revoking permissions:', error);
        showStatus('Failed to revoke permissions: ' + error.message, 'error');
    }
}
