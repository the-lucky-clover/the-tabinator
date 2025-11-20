# 🚀 The Tabinator

> A beautiful, cyberpunk-themed Chrome extension that uses **free ChatGPT web access** to intelligently summarize all your open tabs.

![Version](https://img.shields.io/badge/version-0.1.0-cyan)
![License](https://img.shields.io/badge/license-MIT-magenta)
![ChatGPT](https://img.shields.io/badge/powered%20by-ChatGPT-green)

## ✨ Features

### 🎨 Beautiful Cyberpunk UI

- **3D Glassmorphic Design** with backdrop blur effects
- **Animated Progress Modal** with real-time progress tracking
- **Staggered Card Animations** for smooth entrance effects
- **Micro-interactions** and hover effects throughout
- **Cyberpunk Color Scheme** (cyan, magenta, neon accents)

### 🤖 Smart Summarization

- **Free ChatGPT Integration** - No API keys required!
- **Enhanced Content Extraction** for YouTube, Twitter, Reddit, and articles
- **Custom Prompts** - Personalize your summarization style
- **Fallback Summaries** when ChatGPT is unavailable
- **Content Truncation** to prevent timeouts

### 🎯 UX Enhancements

- **Tab Counter Badge** with pulse animation
- **Refresh Button** with 360° rotation animation
- **Copy to Clipboard** - One-click summary copying
- **Toast Notifications** for user feedback
- **Skeleton Loading** with shimmer effects
- **System Page Detection** - Gracefully handles chrome://, data:, etc.

## 🎥 Demo

```text
┌─────────────────────────────────────┐
│     ◢ Analyzing 5 tabs ◣            │
│                                     │
│         [Spinning Loader]           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │████████████░░░░░░░░░░░░░░░░│   │
│  └─────────────────────────────┘   │
│                                     │
│             67%                     │
│                                     │
│    Analyzing: wikipedia.org...      │
└─────────────────────────────────────┘
```

## 🚀 Installation

### Prerequisites

- Chrome, Brave, Arc, or any Chromium-based browser
- A free ChatGPT account (from [chatgpt.com](https://chatgpt.com))

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/the-lucky-clover/the-tabinator.git
   cd the-tabinator
   ```

2. **Log into ChatGPT**
   - Visit [chatgpt.com](https://chatgpt.com)
   - Sign in with your account
   - Keep the tab open or close it (cookies will persist)

3. **Load the Extension**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the `the-tabinator` folder
   - The extension icon will appear in your toolbar

4. **Start Using**
   - Open multiple tabs
   - Click the Tabinator icon
   - Watch the magic happen! ✨

## 📖 Usage

### Basic Usage

1. **Open Multiple Tabs** - Browse the web as usual
2. **Click Extension Icon** - Find The Tabinator in your toolbar
3. **Watch Progress** - Animated modal shows real-time progress
4. **View Summaries** - Each tab card displays an AI-generated summary

### Features

#### 🔄 Refresh Summaries

Click the **↻** refresh button to clear cache and re-analyze all tabs.

#### 📋 Copy Summary

Hover over any tab card and click the **📋 COPY** button to copy the summary to your clipboard.

#### ⚙️ Custom Prompts

1. Click **⚙ SETTINGS**
2. Choose a preset or write your own prompt
3. Examples:
   - "Summarize in 3 bullet points"
   - "Focus on technical details"
   - "Explain like I'm five"

#### 🏷️ Tab Counter

See the real-time count of open tabs in the header badge.

## 🛠️ Technical Details

### Architecture

```text
the-tabinator/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (main logic)
├── popup.html            # Main UI
├── popup.js              # UI logic
└── content.js            # Content script
```

### How It Works

1. **Tab Detection** - Queries all open tabs in current window
2. **Content Extraction** - Extracts text from pages using enhanced selectors
3. **ChatGPT Integration** - Opens ChatGPT in background tab, submits content
4. **Response Parsing** - Extracts AI summary from ChatGPT response
5. **UI Display** - Shows summaries with beautiful animations

### Supported Page Types

✅ **Regular Web Pages** (http://, https://)
✅ **YouTube Videos** (title, description, channel)
✅ **Twitter/X Posts** (tweets and threads)
✅ **Reddit Threads** (posts and comments)
✅ **News Articles** (article content)
✅ **Wikipedia Pages** (article text)
✅ **File URLs** (file:///)

❌ **System Pages** (chrome://, data:, about:, etc.)
   → Shows: "Cannot analyze system pages or special URLs"

### Technologies Used

- **Manifest V3** - Latest Chrome extension standard
- **ChatGPT Web API** - Free AI summarization
- **Chrome APIs** - tabs, storage, scripting
- **CSS3** - Glassmorphic effects, animations
- **JavaScript** - ES6+, async/await
- **Google Fonts** - Orbitron, Rajdhani

## 🎨 Customization

### Changing the Theme

Edit `popup.html` CSS variables:

```css
/* Colors */
--primary: #00ffff;    /* Cyan */
--secondary: #ff00ff;  /* Magenta */
--success: #00ff88;    /* Green */
--error: #ff3366;      /* Red */
```

### Custom Prompts

Built-in presets:

- **Concise** - Brief 1-2 sentence summaries
- **Detailed** - Comprehensive coverage
- **Bullet Points** - List format
- **Technical** - Focus on facts and data
- **ELI5** - Simple explanations

## 🐛 Troubleshooting

### Common Issues

#### Error: "ChatGPT unavailable"

- ✓ Ensure you're logged into [chatgpt.com](https://chatgpt.com)
- ✓ Check cookies aren't blocked
- ✓ Try incognito/private mode

#### Error: "ChatGPT interface not found"

- ✓ ChatGPT page structure may have changed
- ✓ Wait a few seconds and try again
- ✓ Check if chatgpt.com loads manually

#### Modal Stuck on "Analyzing Tabs"

- ✓ Wait up to 2 minutes (safety timeout)
- ✓ Click refresh button (↻)
- ✓ Reload extension

#### No Summaries Appearing

- ✓ Verify ChatGPT login
- ✓ Check console for errors (F12)
- ✓ Try with fewer tabs first
- ✓ Reload extension

### Debug Mode

1. Right-click extension icon
2. Click "Inspect popup"
3. Check Console for logs:
   - `[ChatGPT] Login status: true`
   - `[fetchSummary] Using ChatGPT web access`
   - `[extractContent] Extracting content...`

## 📊 Performance

- **Tab Limit**: Works best with 5-20 tabs
- **Processing Time**: ~5-10 seconds per tab
- **Content Limit**: 4000 characters per page
- **Timeout**: 2-minute safety timeout
- **Animations**: 60fps smooth rendering

## 🔐 Privacy

- ✅ **No API Keys** - Uses your ChatGPT session
- ✅ **No Data Collection** - Everything stays local
- ✅ **No External Servers** - Direct ChatGPT communication
- ✅ **Open Source** - Fully transparent code

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Clone the repo
git clone https://github.com/the-lucky-clover/the-tabinator.git
cd the-tabinator

# Make changes
# Test in browser via chrome://extensions/

# Submit PR
```

### Reporting Issues

Please include:

- Browser version
- Extension version
- Console errors (if any)
- Steps to reproduce

## 🏪 Chrome Web Store Submission Guide

### Step 1: Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Pay the one-time $5 registration fee
4. Complete your developer profile

### Step 2: Prepare Extension Package

```bash
# Create a clean build directory
mkdir -p dist
cp manifest.json popup.html popup.js background.js content.js settings.html settings.js dist/
cp icon16.png icon48.png icon128.png dist/

# Create ZIP file (from within dist directory)
cd dist && zip -r ../the-tabinator.zip . && cd ..
```

### Step 3: Prepare Store Listing

Before uploading, prepare these materials:

#### Required Assets

1. **Icons** (Already created - but replace with production-quality versions):
   - 16x16px (toolbar)
   - 48x48px (extension management)
   - 128x128px (Chrome Web Store)
   - Use tools: [Favicon.io](https://favicon.io/), Figma, or Photoshop

2. **Screenshots** (1280x800 or 640x400):
   - Take 3-5 screenshots of your extension in action
   - Show: Main popup, summary results, settings page, permission flow
   - Use macOS Screenshot tool (Cmd+Shift+4) or [Screely](https://screely.com/)

3. **Promotional Tile** (440x280, optional but recommended):
   - Featured tile for promotional purposes
   - Use Canva or Figma with cyberpunk theme

#### Store Listing Copy

```text
Short Description (132 chars max):
"Summarize all open tabs with free ChatGPT. Beautiful cyberpunk UI, smart content extraction, privacy-focused."

Detailed Description:
[Use sections from README - Features, How It Works, Privacy, etc.]
```

### Step 4: Privacy Requirements

Create a privacy policy (required for extensions with `<all_urls>` permission):

**Key Points to Include:**

- What data is collected: Tab titles, URLs, page content (only when permission granted)
- How data is used: Sent to ChatGPT for summarization only
- Data retention: Not stored permanently (cache cleared on refresh)
- Third-party services: ChatGPT web interface (chatgpt.com)
- User control: Users can revoke permissions anytime via settings

**Host Privacy Policy:**

- GitHub Pages: Create `privacy-policy.md` in repo, enable Pages
- Google Sites: Free privacy policy hosting
- Your own website

**Add to manifest.json:**

```json
"homepage_url": "https://github.com/your-username/the-tabinator",
"privacy_policy": "https://your-username.github.io/the-tabinator/privacy-policy.html"
```

### Step 5: Upload Extension

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **"New Item"**
3. Upload `the-tabinator.zip`
4. Fill in store listing:
   - **Category**: Productivity
   - **Language**: English
   - Upload screenshots and promotional images
   - Add detailed description
   - Set pricing (Free)

### Step 6: Distribution Options

Choose distribution method:

- **Public**: Available to everyone (recommended)
- **Unlisted**: Only people with link can install
- **Private**: Only specific Google Workspace domains

### Step 7: Submit for Review

1. Review all fields for accuracy
2. Click **"Submit for Review"**
3. Review typically takes 1-3 business days
4. Check email for approval/rejection notification

### Step 8: Post-Approval

Once approved:

- Extension goes live within 24 hours
- Share store link: `https://chrome.google.com/webstore/detail/[your-extension-id]`
- Update README with "Install from Chrome Web Store" button
- Monitor reviews and respond to feedback

### Common Rejection Reasons & Fixes

| Issue | Fix |
|-------|-----|
| Broad permissions | ✅ Already fixed - using optional runtime permissions |
| Missing privacy policy | Create and link privacy policy (see Step 4) |
| Unclear functionality | Add clear screenshots and description |
| Icon quality issues | Replace placeholder icons with high-quality versions |
| Code obfuscation | Ensure all code is readable (already compliant) |
| Misleading description | Be accurate, don't claim features you don't have |

### Updating the Extension

After approval, to release updates:

1. Increment version in `manifest.json` (e.g., 0.1.0 → 0.1.1)
2. Create new ZIP package
3. Upload to existing item in dashboard
4. Submit for review
5. Updates auto-install for existing users after approval

### Monitoring & Maintenance

- Check **Developer Dashboard** regularly
- Respond to user reviews within 7 days
- Monitor crash reports and errors
- Keep dependencies updated
- Test on latest Chrome versions

### Resources

- [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Extension Listing Guidelines](https://developer.chrome.com/docs/webstore/cws-dashboard-listing/)
- [Privacy Policy Requirements](https://developer.chrome.com/docs/webstore/user_data/)
- [Review Process](https://developer.chrome.com/docs/webstore/review-process/)

## 📝 Changelog

### v0.1.0 (2025-11-19)

#### Initial Release

- ChatGPT web integration (free!)
- Cyberpunk glassmorphic UI
- Animated progress modal
- Tab counter and refresh button
- Copy to clipboard functionality
- Toast notifications
- Staggered card animations
- Enhanced content extraction
- Custom prompt support
- System page detection
- Fallback summaries

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- ChatGPT by OpenAI for AI summarization
- Chrome Extensions API documentation
- Google Fonts (Orbitron, Rajdhani)
- Cyberpunk 2077 for design inspiration

## 📬 Contact

- GitHub: [@the-lucky-clover](https://github.com/the-lucky-clover)
- Issues: [Report a bug](https://github.com/the-lucky-clover/the-tabinator/issues)

---

Made with ❤️ and ⚡ by developers, for developers

[⭐ Star on GitHub](https://github.com/the-lucky-clover/the-tabinator) | [🐛 Report Bug](https://github.com/the-lucky-clover/the-tabinator/issues) | [✨ Request Feature](https://github.com/the-lucky-clover/the-tabinator/issues)
