// ChatGPT Web API Integration (inlined to avoid importScripts issues)
const CHATGPT_URL = 'https://chatgpt.com';

async function checkChatGPTLogin() {
    try {
        const response = await fetch(CHATGPT_URL, {
            credentials: 'include'
        });
        const text = await response.text();
        
        // Check for multiple indicators of being logged in
        const hasUserData = text.includes('"user":{');
        const hasAuthAttribute = text.includes('data-authenticated="true"');
        const hasLoginButton = text.includes('Log in') || text.includes('Sign up');
        const hasLogoutButton = text.includes('Log out');
        
        // More lenient check - assume logged in unless clear login indicators
        const isLoggedIn = hasUserData || hasAuthAttribute || hasLogoutButton || !hasLoginButton;
        
        console.log('[ChatGPT] Login detection:', {
            hasUserData,
            hasAuthAttribute,
            hasLoginButton,
            hasLogoutButton,
            isLoggedIn
        });
        
        return isLoggedIn;
    } catch (error) {
        console.error('[ChatGPT] Error checking login:', error);
        // Assume logged in on error to avoid false negatives
        return true;
    }
}

async function summarizeWithChatGPT(content, customPrompt = '') {
    console.log('[ChatGPT] summarizeWithChatGPT called');
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('ChatGPT request timeout')), 50000) // Increased to 50s (5s load + 5s textarea retry + 30s response + buffer)
    );
    
    const summaryPromise = (async () => {
        try {
            console.log('[ChatGPT] Starting summary promise...');
            
            // Skip pre-check and try directly - will naturally fail if not logged in
            // This avoids false negatives from the login detection
        
        const tab = await chrome.tabs.create({
            url: CHATGPT_URL,
            active: false
        });
        
        console.log('[ChatGPT] Waiting for page to load...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Increased to 5s for better reliability
        
        const prompt = customPrompt 
            ? `${customPrompt}\n\nContent to summarize:\n${content}`
            : `Please provide a concise summary of the following content:\n\n${content}`;
        
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: async (promptText) => {
                try {
                    // Wait for textarea to appear (retry up to 5 times)
                    let textarea = null;
                    let attempts = 0;
                    
                    while (!textarea && attempts < 5) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        textarea = document.querySelector('textarea[data-id="root"]') ||
                                 document.querySelector('#prompt-textarea') ||
                                 document.querySelector('textarea[placeholder*="Message"]') ||
                                 document.querySelector('textarea[id*="prompt"]') ||
                                 document.querySelector('div[contenteditable="true"]') ||
                                 document.querySelector('textarea');
                        attempts++;
                        console.log(`Attempt ${attempts}: textarea found = ${!!textarea}`);
                    }
                    
                    // Check if we're on the login page
                    const pageText = document.body.innerText;
                    const isLoginPage = pageText.includes('Welcome to ChatGPT') || 
                                       (pageText.includes('Log in') && pageText.includes('Sign up') && !textarea);
                    
                    if (isLoginPage) {
                        return { error: 'Not logged into ChatGPT. Please visit chatgpt.com and log in.' };
                    }
                    
                    if (!textarea) {
                        return { error: 'ChatGPT textarea not found after waiting. Try refreshing ChatGPT or check your internet connection.' };
                    }
                    
                    textarea.value = promptText;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // Wait a moment for the button to become enabled
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const submitBtn = document.querySelector('button[data-testid="send-button"]') ||
                                    document.querySelector('button[aria-label="Send prompt"]') ||
                                    Array.from(document.querySelectorAll('button')).find(btn => 
                                        btn.textContent.trim() === '' && btn.querySelector('svg')
                                    );
                    
                    if (submitBtn && !submitBtn.disabled) {
                        submitBtn.click();
                    } else if (submitBtn) {
                        return { error: 'Submit button is disabled. ChatGPT may be rate limiting.' };
                    } else {
                        return { error: 'Submit button not found. ChatGPT UI may have changed.' };
                    }
                    
                    console.log('Waiting for ChatGPT response...');
                    
                    // Wait and retry checking for response (up to 30 seconds)
                    let response = null;
                    let responseAttempts = 0;
                    const maxResponseAttempts = 10; // 10 attempts x 3 seconds = 30 seconds max
                    
                    while (!response && responseAttempts < maxResponseAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 3000)); // Check every 3 seconds
                        
                        const responses = document.querySelectorAll('[data-message-author-role=\"assistant\"]');
                        console.log(`Found ${responses.length} assistant message elements`);
                        
                        if (responses.length > 0) {
                            const latestResponse = responses[responses.length - 1];
                            console.log('Latest response element:', latestResponse);
                            
                            // Try multiple ways to extract text
                            let text = '';
                            
                            // Method 1: Look for markdown/prose content
                            const markdown = latestResponse.querySelector('.markdown, [class*="prose"], [class*="message"], p');
                            if (markdown) {
                                text = markdown.innerText || markdown.textContent;
                                console.log('Method 1 (markdown): found text length =', text?.length);
                            }
                            
                            // Method 2: Get all paragraph text
                            if (!text || text.trim().length < 10) {
                                const paragraphs = latestResponse.querySelectorAll('p');
                                text = Array.from(paragraphs).map(p => p.innerText || p.textContent).join('\n');
                                console.log('Method 2 (paragraphs): found text length =', text?.length);
                            }
                            
                            // Method 3: Just get all text from the element
                            if (!text || text.trim().length < 10) {
                                text = latestResponse.innerText || latestResponse.textContent;
                                console.log('Method 3 (innerText): found text length =', text?.length);
                            }
                            
                            // Validate the text
                            if (text) {
                                const trimmed = text.trim();
                                const hasMinLength = trimmed.length > 20;
                                const isNotCSS = !trimmed.includes('font-family') && !trimmed.includes('.progress-');
                                const isNotError = !trimmed.includes('Error:') || trimmed.length > 100;
                                
                                console.log('Text validation:', { length: trimmed.length, hasMinLength, isNotCSS, isNotError });
                                
                                if (hasMinLength && isNotCSS && isNotError) {
                                    response = { text: trimmed };
                                    console.log('✓ Valid response found!');
                                }
                            }
                        }
                        
                        responseAttempts++;
                        console.log(`Response check attempt ${responseAttempts}/${maxResponseAttempts}: found = ${!!response}`);
                    }
                    
                    if (response && response.text) {
                        return { summary: response.text };
                    }
                    
                    console.log('No response found after 30 seconds');
                    return { error: 'No response received after 30 seconds. ChatGPT may be slow or rate limiting.' };
                } catch (error) {
                    return { error: error.message };
                }
            },
            args: [prompt]
        });
        
        await chrome.tabs.remove(tab.id);
        
        if (result && result[0] && result[0].result) {
            if (result[0].result.error) {
                throw new Error(result[0].result.error);
            }
            return result[0].result.summary;
        }
        
        throw new Error('Failed to get response from ChatGPT');
        
    } catch (error) {
        console.error('[ChatGPT] Error:', error);
        throw error;
    }
    })();
    
    return Promise.race([summaryPromise, timeoutPromise]);
}

// Default settings - Free ChatGPT web access only
let settings = {
    customPrompt: ''
};

let summarizationCache = {};

// Load settings on startup
chrome.runtime.onInstalled.addListener(async () => {
    await loadSettings();
});

chrome.runtime.onStartup.addListener(async () => {
    await loadSettings();
});

async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['tabulatorSettings'], (result) => {
            if (result.tabulatorSettings) {
                settings = result.tabulatorSettings;
                console.log('[Settings] Loaded:', settings);
            }
            resolve();
        });
    });
}

function generateTabHtml() {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>The Tabinator</title>
            <style>
                body { margin: 10px; }
                .tab-item {
                    display: flex;
                    margin-bottom: 10px;
                    border: 1px solid #ccc;
                    padding: 10px;
                    align-items: center;
                    max-height: 200px;
                }
                .tab-item img {
                    max-width: 150px;
                    max-height: 150px;
                    margin-right: 10px;
                    object-fit: cover;
                }
                .tab-info { flex: 1; }
                .tab-url {
                    font-size: 0.8em;
                    color: #555;
                    margin-bottom: 5px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .tab-summary {
                    font-size: 0.9em;
                    max-height: 80px;
                    overflow: hidden;
                }
                .loading {
                    margin-left: 10px;
                    font-style: italic;
                }
               .progress-container {
                   width: 100%;
                    background-color: #f0f0f0;
                    margin-top: 5px;
                     height: 8px;
                   border-radius: 4px;
                   display: none;
               }
                .progress-bar {
                     height: 8px;
                      background-color: #4CAF50;
                       border-radius: 4px;
                  }
            </style>
        </head>
        <body>
            <h1>The Tabinator</h1>
            <div id="tab-list"></div>
        </body>
        </html>
    `;
}

function generateSimpleSummary(content) {
    // Fallback: Generate a simple extractive summary
    if (!content || content.trim() === "") {
        return 'No content available.';
    }
    
    // Get first 3 sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const summary = sentences.slice(0, 3).join(' ').trim();
    
    if (summary.length > 200) {
        return summary.substring(0, 197) + '...';
    }
    
    return summary || 'Content too short to summarize.';
}

// Process items with concurrency limit
async function processConcurrent(items, concurrency, processor) {
    const results = [];
    const executing = [];
    
    for (const item of items) {
        const promise = processor(item).then(result => {
            executing.splice(executing.indexOf(promise), 1);
            return result;
        });
        results.push(promise);
        executing.push(promise);
        
        if (executing.length >= concurrency) {
            await Promise.race(executing);
        }
    }
    
    return Promise.all(results);
}

async function fetchSummary(tabId, content, progressCallback) {
    const cachedSummary = summarizationCache[tabId];
    if (cachedSummary) {
        console.log(`[fetchSummary] Cache hit for tab ${tabId}: ${cachedSummary.substring(0, 20)}...`);
        if (progressCallback) progressCallback(100);
        return cachedSummary;
     }
    
    // Check if content is a system page error message
    if (!content || content.trim() === "" || content === 'Cannot analyze system pages or special URLs.') {
         console.log(`[fetchSummary] Skipping tab ${tabId}: ${content || 'No content'}`);
        if (progressCallback) progressCallback(100);
        return content || 'No content available.';
    }
    
     try {
        console.log(`[fetchSummary] Content length: ${content.length} characters for tab ${tabId}`);
        if (progressCallback) progressCallback(10);
        
        // Truncate content if too long (ChatGPT has limits)
        const maxLength = 4000;
        const truncatedContent = content.length > maxLength 
            ? content.substring(0, maxLength) + '... [content truncated]'
            : content;
        
        if (progressCallback) progressCallback(20);
        
        // Use ChatGPT web access (free)
        console.log(`[fetchSummary] About to call summarizeWithChatGPT for tab ${tabId}`);
        console.log(`[fetchSummary] Content preview: ${truncatedContent.substring(0, 100)}...`);
        const summary = await summarizeWithChatGPT(truncatedContent, settings.customPrompt || '');
        console.log(`[fetchSummary] Got summary for tab ${tabId}: ${summary.substring(0, 50)}...`);
        summarizationCache[tabId] = summary;
        if (progressCallback) progressCallback(100);
        return summary;
    } catch (chatGPTError) {
        console.error(`[fetchSummary] ChatGPT failed for tab ${tabId}:`, chatGPTError.message);
        // Return simple fallback summary
        const fallback = generateSimpleSummary(content);
        if (progressCallback) progressCallback(100);
        return `⚠ ChatGPT unavailable. Please log into chatgpt.com first.\n\nQuick summary: ${fallback}`;
    }
}
async function extractContent(tabId, url) {
    // Skip special URLs that can't be accessed
    if (!url || url.startsWith("chrome-extension://") || 
                url.startsWith("chrome://") || 
                url.startsWith("chrome-search://") ||
                url.startsWith("data:") ||
                url.startsWith("about:") ||
                url.startsWith("edge:") ||
                url.startsWith("brave:") ||
                url.startsWith("arc:")) {
        console.log(`[extractContent] Skipping special URL: ${url || 'unknown'}`);
        return 'Cannot analyze system pages or special URLs.';
   }
    try {
       console.log(`[extractContent] Extracting content for tab ${tabId}...`);
       
       // Enhanced content extraction for different page types
       const result = await chrome.scripting.executeScript({
             target: { tabId: tabId },
           function:()=> {
               let content = '';
               
               // Check for YouTube video
               if (window.location.hostname.includes('youtube.com')) {
                   const title = document.querySelector('h1.ytd-video-primary-info-renderer, h1.title')?.innerText || '';
                   const description = document.querySelector('#description')?.innerText || 
                                     document.querySelector('yt-formatted-string.content')?.innerText || '';
                   const channel = document.querySelector('ytd-channel-name a')?.innerText || '';
                   content = `YouTube Video: ${title}\nChannel: ${channel}\n${description}`;
               }
               // Check for Twitter/X
               else if (window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com')) {
                   const tweets = Array.from(document.querySelectorAll('[data-testid="tweetText"]'))
                       .map(t => t.innerText).slice(0, 5).join('\n\n');
                   content = tweets || document.body.innerText;
               }
               // Check for Reddit
               else if (window.location.hostname.includes('reddit.com')) {
                   const title = document.querySelector('h1')?.innerText || '';
                   const post = document.querySelector('[data-test-id="post-content"]')?.innerText || '';
                   const comments = Array.from(document.querySelectorAll('[data-testid="comment"]'))
                       .map(c => c.innerText).slice(0, 3).join('\n\n');
                   content = `${title}\n\n${post}\n\nTop Comments:\n${comments}`;
               }
               // Check for article content
               else if (document.querySelector('article')) {
                   const article = document.querySelector('article');
                   const title = document.querySelector('h1')?.innerText || '';
                   content = `${title}\n\n${article.innerText}`;
               }
               // Default: get main content or body text
               else {
                   const main = document.querySelector('main') || document.querySelector('[role="main"]');
                   content = main ? main.innerText : document.body.innerText;
               }
               
               return content || document.body.innerText;
           }
        });
        if (result && result[0] && result[0].result){
            console.log(`[extractContent] Content extracted for tab ${tabId}: ${result[0].result.substring(0, 20)}...`);
             return result[0].result;
       }else {
           console.log(`[extractContent] No content extracted for tab ${tabId}`);
             return null;
        }
     } catch (error) {
          console.error("Failed to extract content", error);
          return null;
    }
}


async function generateTabInformation() {
     try{
          const tabs = await chrome.tabs.query({});
          console.log("[generateTabInformation] Tabs queried:", tabs.map(tab => ({ id: tab.id, url: tab.url, title: tab.title })));

        const tabsData = [];
         for (const tab of tabs) {
                try {
                  const content = await extractContent(tab.id, tab.url);
                    const summary = await fetchSummary(tab.id, content);
                     tabsData.push({
                          id: tab.id,
                            url: tab.url,
                            title: tab.title,
                            favIconUrl: tab.favIconUrl,
                            summary: summary
                        });
                } catch (error) {
                    console.error(`[generateTabInformation] Error processing tab ${tab.id} during extraction/summarization`, error);
                      tabsData.push({
                           id: tab.id,
                            url: tab.url,
                          title: tab.title,
                          favIconUrl: tab.favIconUrl,
                            summary: "Error"
                     });
                }
       }
    const html = generateTabHtml(tabsData);
       console.log("[generateTabInformation] Generated HTML:", html);
        chrome.storage.local.set({tabData: tabsData}, ()=>{
              chrome.tabs.create({url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html)}, (newTab) => {
                     if(newTab && newTab.id){
                             chrome.scripting.executeScript({
                                   target: {tabId: newTab.id},
                                  files: ['content.js']
                             });
                      }else{
                        console.error("[generateTabInformation] Error: New tab was not created successfully");
                       }
                 });
          });

   }  catch(error){
         console.error("[generateTabInformation] An error occurred in generateTabInformation:", error);
    }
}
// Queue for managing concurrent ChatGPT requests
let processingQueue = [];
let activeRequests = 0;
const MAX_CONCURRENT = 2; // Process max 2 tabs at once to avoid overwhelming ChatGPT

async function queueSummaryRequest(tabId, processFunc) {
    return new Promise((resolve, reject) => {
        processingQueue.push({ tabId, processFunc, resolve, reject });
        console.log(`[Queue] Added tab ${tabId} to queue, total queued: ${processingQueue.length}`);
        // Kick off processing (might start multiple if under MAX_CONCURRENT)
        for (let i = 0; i < MAX_CONCURRENT; i++) {
            processNextInQueue();
        }
    });
}

async function processNextInQueue() {
    if (activeRequests >= MAX_CONCURRENT || processingQueue.length === 0) {
        console.log(`[Queue] Cannot process: activeRequests=${activeRequests}, queueLength=${processingQueue.length}`);
        return;
    }
    
    const { tabId, processFunc, resolve, reject } = processingQueue.shift();
    activeRequests++;
    console.log(`[Queue] Processing tab ${tabId}, active=${activeRequests}, remaining=${processingQueue.length}`);
    
    try {
        const result = await processFunc();
        resolve(result);
    } catch (error) {
        console.error(`[Queue] Error processing tab ${tabId}:`, error);
        reject(error);
    } finally {
        activeRequests--;
        console.log(`[Queue] Completed tab ${tabId}, active=${activeRequests}, remaining=${processingQueue.length}`);
        processNextInQueue(); // Process next item
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSummary' && request.tabId) {
        (async () => {
            try {
                console.log(`[Message] Queuing getSummary for tab ${request.tabId}`);
                
                const result = await queueSummaryRequest(request.tabId, async () => {
                    // Check if tab still exists
                    let tab;
                    try {
                        tab = await chrome.tabs.get(request.tabId);
                    } catch (error) {
                        throw new Error('Tab was closed during processing');
                    }
                    
                    const content = await extractContent(request.tabId, tab.url);
                    
                    // Add progress callback
                    const progressCallback = (percent) => {
                        console.log(`[Progress] Tab ${request.tabId}: ${percent}%`);
                    };
                    
                    const summary = await fetchSummary(request.tabId, content, progressCallback);
                    console.log(`[Message] Summary ready for tab ${request.tabId}`);
                    return { summary: summary };
                });
                
                sendResponse(result);
            } catch (error) {
                console.error(`[Message] Error getting summary for tab ${request.tabId}:`, error);
                sendResponse({ error: 'Error fetching summary.' });
            }
        })();
        return true; // Keep channel open for async response
    }
    
    if (request.action === 'reloadSettings') {
        (async () => {
            await loadSettings();
            sendResponse({ success: true });
        })();
        return true;
    }
});

// Listen for the extension button click
chrome.action.onClicked.addListener(() => {
     generateTabInformation();
});