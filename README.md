# BetterLooksmax.org 1.0

> **Open-source Browser Extension for Looksmax.org**


**By:** [@menas](https://github.com/menas) [@mvpisafaggot420](https://looksmax.org/members/mvpisafaggot420.153834/)

**Credits to:** @chadisbeingmade, @Sadist, and @Zagro for letting me steal their xenforo cookies (testers). 😈

---

## 🚀 Why Did We Create This?

Everything started when I noticed that most of the suggestions in the suggestions section were being ignored. Since I had already built a BBCode tool earlier for formatting, I thought — why not just take it further and make an extension that handles everything?

So I created a group chat with cbm, xnj (the sadist), zagro, and a few others to get their opinions. After some back and forth, I started building the extension with a couple of friends. Their feedback helped shape the initial direction, and it quickly became more than just a formatting tool.

---

## 📦 Installation

### Chrome/Chromium-based browsers:

1. **Download** the extension from this GitHub repository
2. Navigate to `chrome://extensions/` in your browser
3. **Enable Developer Mode** (toggle in the upper right corner)
4. Click **"Load unpacked"** (upper left corner)
5. Select the downloaded extension folder
6. That's it! You should now notice the changes on looksmax.org

### Manual Installation Steps:
```bash
# Clone or download the repository
git clone https://github.com/Betterlooksmaxdotorg/BetterLooksmax.org.git

# Or download as ZIP and extract
```

---

## ✨ Features Overview

The BetterLooksmax.org Extension 1.0 includes **7 powerful features**:

### 🔍 **1. Greycel Filter**
Are you annoyed by tiktokcels who spam garbage threads like "how can i debloat??" Here's the fix for you! With one click, you can remove every single greycel from sight.

**What it does:**
- Hides all posts and threads made by greycels
- Clean browsing experience
- Toggle on/off easily

### 🕶️ **2. Public Mode**
Are you scared that someone will notice that you're one of those looksmaxxer "incels"? Public Mode was built for you, my friend.

**Features:**
- Replaces all avatars with default ones
- Replaces "looksmax"/"looksmaxxing" with "Finance"
- Censors inappropriate words
- Blurs media and signature text

### ⚡ **3. Quick Reply**
Sometimes you just want to say "DNRD" in a thread but you're too lazy to type it all? With one click, you can automatically fill the input.

**How it works:**
- Pre-defined quick responses
- One-click reply insertion
- Customizable reply templates

### ⏱️ **4. Time Tracking & Limiting**
Have you noticed that you're spending too much time on the site? Or do you wonder how much time you spend? This feature is for you.

**Features:**
- Timer displayed in navbar
- Set daily time limits
- 24-hour reset cycle
- Usage analytics

### 🔞 **5. NSFW Filter**
Are you on NoFap? Or maybe you just don't want to encounter weird NSFW threads? This is for you.

**What it does:**
- Hides all threads with NSFW tags
- Clean, family-friendly browsing
- Easy toggle on/off

### 👑 **6. OP Filter**
Sometimes you just want to read the posts of OP but you can't because of all those junk posts other users made? The OP filter is for you!

**Benefits:**
- Shows only Original Poster's content
- Cleaner thread reading
- Focus on main discussion points

### 🎨 **7. Text Presets (Ultimate Formatting Tool)**
You might wonder how threads are formatted so beautifully? Here's the answer!

**Capabilities:**
- Rainbow gradients with background
- Blue gradients
- Custom text styling
- Keyboard shortcuts (e.g., Ctrl+J)
- Easy-to-use brush icon interface

---

## 🛠️ Usage

### Basic Setup:
1. Install the extension following the installation steps above
2. Visit looksmax.org
3. Look for the extension icon in your toolbar
4. Configure your preferred settings

### Text Presets:
1. Look for the brush icon in your editor
2. Click to open the presets interface
3. Create custom presets with styling
4. Assign keyboard shortcuts for quick access

---

## 🏗️ Project Structure

```
Betterlooksmax.org 1.0/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── content.js            # Main content script
├── greyfilter.js         # Greycel filtering functionality
├── nsfwfilter.js         # NSFW content filtering
├── opfilter.js           # OP-only post filtering
├── publicmode.js         # Public mode features
├── quickreply.js         # Quick reply functionality
├── text-presets.js       # Text formatting presets
├── timer.js              # Time tracking and limiting
├── settings.json         # Extension settings
├── popup/               # Extension popup interface
   ├── popup.html
   ├── popup.js
   ├── popup.css
   └── logo.png

```

---

## 🔧 Development

### Prerequisites:
- Modern web browser (Chrome/Chromium recommended)
- Basic knowledge of JavaScript/HTML/CSS
- Text editor or IDE

### Local Development:
1. Clone the repository
2. Make your changes
3. Load the extension in developer mode
4. Test on looksmax.org
5. Submit pull request

### Contributing:
We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📋 Supported Sites

- ✅ looksmax.org
- ✅ forum.looksmaxxing.com
- ✅ lookism.cc

---

## 🐛 Bug Reports

Found a bug? Please report it by:
1. Opening an issue on GitHub
2. Including steps to reproduce
3. Browser and extension version
4. Screenshots if applicable

---

## 📄 License

This project is open-source. See LICENSE file for details.

---

## 🤝 Credits

- **Creator:** @menas
- **Testers:** @chadisbeingmade, @Sadist, @Zagro
- **Community:** All users who provided feedback and suggestions

---

## 🔮 Future Plans

- Additional formatting options
- More filtering capabilities
- Enhanced analytics
- Mobile browser support
- Custom themes

---

**Made with ❤️ for the Looksmax community**

---

*Note: This extension is not affiliated with looksmax.org. It's a community-driven project aimed at improving user experience.*
