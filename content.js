chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setSummaries' && request.tabsData) {
      const tabListDiv = document.getElementById('tab-list');
        tabListDiv.innerHTML = '';
       request.tabsData.forEach((tabData) => {
         const tabItem = document.createElement('div');
           tabItem.classList.add('tab-item');
           const thumbNail = document.createElement('img');
             thumbNail.src = tabData.favIconUrl;
              thumbNail.alt = 'Tab Thumbnail';
           tabItem.appendChild(thumbNail);

             const tabInfo = document.createElement('div');
            tabInfo.classList.add('tab-info');

            const tabUrl = document.createElement('div');
             tabUrl.classList.add('tab-url');
             tabUrl.textContent = tabData.url;
            tabInfo.appendChild(tabUrl);
             const summaryDiv = document.createElement('div');
            summaryDiv.classList.add('tab-summary');
             summaryDiv.textContent = tabData.summary;
            tabInfo.appendChild(summaryDiv);
              tabItem.appendChild(tabInfo);
           tabListDiv.appendChild(tabItem);
        });
    }
});
window.addEventListener('load', () => {
       chrome.storage.local.get(['tabData'], (result) => {
         if(result && result.tabData){
            chrome.runtime.sendMessage({action:'setSummaries', tabsData:result.tabData});
           }
       });
});