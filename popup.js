let summarizationCache = {}; // Using a local cache
let totalTabs = 0;
let completedTabs = 0;
let modalTimeout = null;
let tabQueueItems = {}; // Store queue item elements by tab ID
let loginErrorCount = 0; // Track login errors
let isFallbackMode = false; // Track if running in fallback mode

function showFallbackIndicator() {
    const indicator = document.getElementById('fallbackIndicator');
    indicator.classList.add('active');
    isFallbackMode = true;
}

function hideFallbackIndicator() {
    const indicator = document.getElementById('fallbackIndicator');
    indicator.classList.remove('active');
    isFallbackMode = false;
}

async function checkPermissions() {
    try {
        const perm = { origins: ["<all_urls>"] };
        const hasPermission = await chrome.permissions.contains(perm);
        if (!hasPermission) {
            showFallbackIndicator();
        } else {
            hideFallbackIndicator();
        }
        return hasPermission;
    } catch (e) {
        console.warn('[popup] Permission check failed', e);
        showFallbackIndicator();
        return false;
    }
}

async function requestPermissions() {
    try {
        const perm = { origins: ["<all_urls>"] };
        const granted = await chrome.permissions.request(perm);
        if (granted) {
            hideFallbackIndicator();
            showToast('✓ Full page access granted!', 'success');
            // Clear cache since we can now extract full content
            summarizationCache = {};
        } else {
            showToast('⚠ Permission not granted', 'error');
        }
        return granted;
    } catch (e) {
        console.error('[popup] Permission request failed', e);
        showToast('⚠ Permission request failed', 'error');
        return false;
    }
}

function showLoginWarning() {
    const warning = document.getElementById('loginWarning');
    warning.classList.add('active');
}

function hideLoginWarning() {
    const warning = document.getElementById('loginWarning');
    warning.classList.remove('active');
}

function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showProgressModal() {
    const modal = document.getElementById('progressModal');
    modal.classList.add('active');
    currentPercentage = 0; // Reset for smooth animation
    
    // Safety timeout - force close after 2 minutes
    if (modalTimeout) clearTimeout(modalTimeout);
    modalTimeout = setTimeout(() => {
        hideProgressModal();
        showToast('⚠ Analysis took too long. Try refreshing.', 'error');
    }, 120000); // 2 minutes
}

function hideProgressModal() {
    const modal = document.getElementById('progressModal');
    modal.classList.remove('active');
    if (modalTimeout) {
        clearTimeout(modalTimeout);
        modalTimeout = null;
    }
}

let currentPercentage = 0;

function updateProgress(completed, total, message = '') {
    const targetPercentage = Math.round((completed / total) * 100);
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressText = document.getElementById('progressText');
    
    // Animate percentage counting
    const animatePercentage = () => {
        if (currentPercentage < targetPercentage) {
            currentPercentage += 1;
            progressBar.style.width = currentPercentage + '%';
            progressPercentage.textContent = currentPercentage + '%';
            requestAnimationFrame(animatePercentage);
        } else {
            currentPercentage = targetPercentage;
            progressBar.style.width = targetPercentage + '%';
            progressPercentage.textContent = targetPercentage + '%';
        }
    };
    
    animatePercentage();
    
    // Milestone celebrations!
    if (targetPercentage === 25 || targetPercentage === 50 || targetPercentage === 75 || targetPercentage === 100) {
        progressPercentage.classList.add('milestone');
        setTimeout(() => progressPercentage.classList.remove('milestone'), 600);
        if (targetPercentage === 100) {
            createParticleBurst(progressPercentage);
        }
    }
    
    if (message) {
        progressText.textContent = message;
    }
}

function createQueueItem(tab, index) {
    const queueItem = document.createElement('div');
    queueItem.classList.add('queue-item');
    queueItem.setAttribute('data-tab-id', tab.id);
    
    const header = document.createElement('div');
    header.classList.add('queue-item-header');
    
    const info = document.createElement('div');
    info.classList.add('queue-item-info');
    
    const favicon = document.createElement('img');
    favicon.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect fill="%2300ffff" width="16" height="16" opacity="0.3"/></svg>';
    favicon.classList.add('queue-item-favicon');
    info.appendChild(favicon);
    
    const title = document.createElement('div');
    title.classList.add('queue-item-title');
    try {
        const hostname = new URL(tab.url).hostname || tab.title;
        title.textContent = hostname;
    } catch (e) {
        title.textContent = tab.title || 'Unknown';
    }
    info.appendChild(title);
    
    header.appendChild(info);
    
    const status = document.createElement('div');
    status.classList.add('queue-item-status', 'waiting');
    status.textContent = 'Waiting';
    header.appendChild(status);
    
    queueItem.appendChild(header);
    
    const progressContainer = document.createElement('div');
    progressContainer.classList.add('queue-item-progress');
    
    const progressBar = document.createElement('div');
    progressBar.classList.add('queue-item-progress-bar');
    progressContainer.appendChild(progressBar);
    
    queueItem.appendChild(progressContainer);
    
    return queueItem;
}

function createParticleBurst(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.classList.add('reward-particle');
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 40 + Math.random() * 20;
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
    }
}

function updateQueueItemStatus(tabId, status, progress = 0) {
    const queueItem = tabQueueItems[tabId];
    if (!queueItem) return;
    
    const statusEl = queueItem.querySelector('.queue-item-status');
    const progressBar = queueItem.querySelector('.queue-item-progress-bar');
    
    // Remove all status classes
    queueItem.classList.remove('processing', 'completed', 'error');
    statusEl.classList.remove('waiting', 'processing', 'completed', 'error');
    
    // Add new status
    if (status === 'processing') {
        queueItem.classList.add('processing');
        statusEl.classList.add('processing');
        statusEl.textContent = 'Analyzing';
        progressBar.style.width = '50%';
    } else if (status === 'completed') {
        queueItem.classList.add('completed');
        statusEl.classList.add('completed');
        statusEl.textContent = '✓ Done';
        progressBar.style.width = '100%';
        // Reward animation!
        createParticleBurst(queueItem);
    } else if (status === 'error') {
        queueItem.classList.add('error');
        statusEl.classList.add('error');
        statusEl.textContent = '✗ Error';
        progressBar.style.width = '100%';
    } else {
        statusEl.classList.add('waiting');
        statusEl.textContent = 'Waiting';
        progressBar.style.width = '0%';
    }
    
    if (progress > 0) {
        progressBar.style.width = progress + '%';
    }
}

async function animateTabCount(targetCount) {
    const progressTitle = document.querySelector('.progress-title');
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');
    const duration = 1000; // 1 second
    const steps = 20;
    const increment = targetCount / steps;
    const delay = duration / steps;
    
    progressText.textContent = 'Counting tabs...';
    progressPercentage.textContent = '◢ ◣';
    
    for (let i = 0; i <= steps; i++) {
        const currentCount = Math.min(Math.round(i * increment), targetCount);
        progressTitle.textContent = `◢ Found ${currentCount} tab${currentCount !== 1 ? 's' : ''} ◣`;
        // Add satisfying scale effect
        progressTitle.style.transform = `scale(${1 + (i % 2) * 0.02})`;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    progressTitle.style.transform = 'scale(1)';
    progressTitle.textContent = `◢ Analyzing ${targetCount} tab${targetCount !== 1 ? 's' : ''} ◣`;
    progressText.textContent = 'Starting analysis...';
    progressPercentage.textContent = '0%';
    await new Promise(resolve => setTimeout(resolve, 500));
}

function updateTabCounter(count) {
    const counter = document.getElementById('tabCounter');
    counter.textContent = `${count} tab${count !== 1 ? 's' : ''}`;
    counter.classList.add('updated');
    setTimeout(() => {
        counter.classList.remove('updated');
    }, 600);
}

async function displayTabs(tabs) {
    const tabListDiv = document.getElementById('tab-list');
    tabListDiv.innerHTML = ''; // Clear previous content

    if (tabs.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.classList.add('empty-state');
        emptyState.innerHTML = `
            <div class="empty-state-icon">◢ ◣</div>
            <div class="empty-state-text">◢ No Tabs Found ◣</div>
            <div class="empty-state-hint">Open some tabs and click the extension icon to analyze them.</div>
        `;
        tabListDiv.appendChild(emptyState);
        updateTabCounter(0);
        return;
    }
    
    totalTabs = tabs.length;
    completedTabs = 0;
    tabQueueItems = {};
    updateTabCounter(totalTabs);
    showProgressModal();
    
    // Animate counting tabs before processing
    await animateTabCount(totalTabs);
    
    // Populate queue list
    const queueList = document.getElementById('tabQueue');
    queueList.innerHTML = '';
    tabs.forEach((tab, index) => {
        const queueItem = createQueueItem(tab, index);
        tabQueueItems[tab.id] = queueItem;
        queueList.appendChild(queueItem);
    });
    
    updateProgress(0, totalTabs, 'Starting analysis...');

    tabs.forEach((tab, index) => {
        const tabItem = document.createElement('div');
        tabItem.classList.add('tab-item');
        tabItem.style.setProperty('--item-index', index);
        if (tab.active) {
            tabItem.classList.add('active');
        }
        
        // Create inner wrapper for better structure
        const tabInner = document.createElement('div');
        tabInner.classList.add('tab-item-inner');
        
        // Create header with favicon and URL
        const tabHeader = document.createElement('div');
        tabHeader.classList.add('tab-header');
       
        const thumbNail = document.createElement('img');
        thumbNail.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect fill="%2300ffff" width="24" height="24" opacity="0.2"/></svg>';
        thumbNail.alt = 'Favicon';
        tabHeader.appendChild(thumbNail);

        const tabInfo = document.createElement('div');
        tabInfo.classList.add('tab-info');

        const tabUrl = document.createElement('div');
        tabUrl.classList.add('tab-url');
        try {
            const urlDisplay = new URL(tab.url).hostname || tab.url;
            tabUrl.textContent = urlDisplay + (tab.active ? ' [ACTIVE]' : '');
        } catch (e) {
            tabUrl.textContent = tab.title || 'Unknown';
        }
        tabInfo.appendChild(tabUrl);
        
        tabHeader.appendChild(tabInfo);
        tabInner.appendChild(tabHeader);
       
        const summaryDiv = document.createElement('div');
        summaryDiv.classList.add('tab-summary');
        tabInner.appendChild(summaryDiv);

        // Create skeleton loading state
        const skeletonContainer = document.createElement('div');
        for (let i = 0; i < 3; i++) {
            const skeletonLine = document.createElement('div');
            skeletonLine.classList.add('skeleton-loader', 'skeleton-line');
            skeletonContainer.appendChild(skeletonLine);
        }
        summaryDiv.appendChild(skeletonContainer);

        tabItem.appendChild(tabInner);
        tabListDiv.appendChild(tabItem);

        //Fetch and display Summary
        fetchSummary(tab, summaryDiv)
    });
}

function createCopyButton(summary) {
    const copyBtn = document.createElement('button');
    copyBtn.classList.add('copy-btn');
    copyBtn.textContent = '📋 COPY';
    copyBtn.title = 'Copy summary to clipboard';
    
    copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(summary);
            copyBtn.textContent = '✓ COPIED';
            copyBtn.classList.add('copied');
            // Satisfying visual reward!
            createParticleBurst(copyBtn);
            setTimeout(() => {
                copyBtn.textContent = '📋 COPY';
                copyBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            copyBtn.textContent = '✗ ERROR';
            setTimeout(() => {
                copyBtn.textContent = '📋 COPY';
            }, 2000);
        }
    });
    
    return copyBtn;
}

async function fetchSummary(tab, summaryDiv){
    const cachedSummary = summarizationCache[tab.id];
    if (cachedSummary) {
        summaryDiv.innerHTML = '';
        const textSpan = document.createElement('span');
        textSpan.textContent = cachedSummary;
        summaryDiv.appendChild(textSpan);
        summaryDiv.appendChild(createCopyButton(cachedSummary));
        
        updateQueueItemStatus(tab.id, 'completed');
        completedTabs++;
        updateProgress(completedTabs, totalTabs, `Analyzing tab ${completedTabs}/${totalTabs}...`);
        if (completedTabs === totalTabs) {
            setTimeout(hideProgressModal, 500);
        }
        return;
    }
    
    // Mark as processing
    updateQueueItemStatus(tab.id, 'processing');
        
    try {
        let hostname = 'tab';
        try {
            hostname = new URL(tab.url).hostname;
        } catch (e) {
            hostname = tab.title || 'tab';
        }
        
        updateProgress(completedTabs, totalTabs, `◢ Analyzing: ${hostname}... ◣`);
        
        const response = await chrome.runtime.sendMessage({action:'getSummary', tabId:tab.id});
        summaryDiv.innerHTML = '';
        
        if (response && response.summary) {
            // Smooth transition from skeleton to content
            summaryDiv.style.opacity = '0';
            summaryDiv.innerHTML = '';
            
            const textSpan = document.createElement('span');
            textSpan.textContent = response.summary;
            summaryDiv.appendChild(textSpan);
            summaryDiv.appendChild(createCopyButton(response.summary));
            summarizationCache[tab.id] = response.summary;
            
            // Fade in the content
            setTimeout(() => {
                summaryDiv.style.transition = 'opacity 0.4s ease-out';
                summaryDiv.style.opacity = '1';
            }, 50);
            
            updateQueueItemStatus(tab.id, 'completed');
        } else {
            summaryDiv.style.opacity = '0';
            summaryDiv.innerHTML = '';
            
            const errorSpan = document.createElement('span');
            errorSpan.classList.add('error-message');
            const errorMsg = response?.error || 'No Summary Available.';
            errorSpan.textContent = errorMsg;
            summaryDiv.appendChild(errorSpan);
            
            // Check if it's a login error
            if (errorMsg.includes('Not logged into ChatGPT') || errorMsg.includes('log in')) {
                loginErrorCount++;
                if (loginErrorCount >= 1) { // Show warning immediately on first login error
                    showLoginWarning();
                    hideProgressModal();
                }
            }
            
            setTimeout(() => {
                summaryDiv.style.transition = 'opacity 0.4s ease-out';
                summaryDiv.style.opacity = '1';
            }, 50);
            
            updateQueueItemStatus(tab.id, 'error');
        }
    } catch(error) {
        console.error("Failed to fetch summary", error);
        summaryDiv.innerHTML = '';
        const errorSpan = document.createElement('span');
        errorSpan.classList.add('error-message');
        errorSpan.textContent = '⚠ Error fetching summary. Try refreshing.';
        summaryDiv.appendChild(errorSpan);
        updateQueueItemStatus(tab.id, 'error');
    } finally {
        completedTabs++;
        updateProgress(completedTabs, totalTabs, `◢ Completed ${completedTabs}/${totalTabs} tabs ◣`);
        if (completedTabs >= totalTabs) {
            setTimeout(() => {
                hideProgressModal();
                showToast(`✓ Analyzed ${totalTabs} tab${totalTabs !== 1 ? 's' : ''}!`, 'success');
            }, 800);
        }
    }
}


async function refreshTabs() {
    summarizationCache = {}; // Clear cache
    completedTabs = 0;
    loginErrorCount = 0; // Reset login error count
    hideLoginWarning(); // Hide warning on refresh
    await checkPermissions(); // Recheck permissions
    
    // Add visual feedback to refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.style.transform = 'rotate(360deg) scale(1.2)';
    setTimeout(() => {
        refreshBtn.style.transform = '';
    }, 400);
    
    showToast('◢ Refreshing all summaries... ◣', 'info');
    chrome.tabs.query({}, (tabs) => {
        console.log('Refreshing tabs:', tabs.length);
        displayTabs(tabs);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check permissions on startup
    await checkPermissions();
    
    chrome.tabs.query({}, (tabs) => {
        console.log('Total tabs:', tabs.length);
        displayTabs(tabs);
    });
    
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await refreshTabs();
    });
    
    // Open ChatGPT button in login warning
    document.getElementById('openChatGPT').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://chatgpt.com' });
        showToast('◢ Opening ChatGPT... Please log in and try again ◣', 'info');
    });
    
    // Grant permissions link in fallback indicator
    document.getElementById('grantPermissionsLink').addEventListener('click', () => {
        requestPermissions();
    });
});