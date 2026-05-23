
# Whatsapp-Gemini Auto Reply AI



At its core, it is an **Automated WhatsApp AI Assistant** designed to take over the repetitive duties of a University Class Representative. It connects directly to your WhatsApp account and acts as a 24/7 intelligent agent for your classmates.

Here are the key things it does automatically:

* **Smart Q&A (The Rumor Mill):** It listens to what students are texting, remembers their questions and answers, and uses that "chatter" to help other students—always citing who said what (e.g., *"Murad said the exam is at 10 AM"*).
* **Official Knowledge Base:** It maintains a secure, permanent database of class routines, Drive links, and syllabus details that only you (the Admin) can update.
* **Live University Updates:** If a student types `!notice`, the bot invisibly surfs the web, scrapes the official Daffodil International University (DIU) website, and texts back the latest official announcements.
* **Dynamic Personas:** It acts like a strict, precise AI for most students, but seamlessly switches to a completely different, customized personality when specific people (like your female Co-CR) text it.
* **Bulletproof Uptime:** It is engineered with API rotation to never crash when too many students message it at once.

In short: **It is a localized, multimodal AI search engine built specifically to help your Software Engineering classmates survive the semester.**
## 🎓 DIU Class Rep AI Agent



An intelligent, multimodal WhatsApp AI agent built to manage, automate, and assist a Software Engineering university section. Powered by the Gemini 2.5 Flash API, this bot acts as a 24/7 Class Representative.

## ✨ Core Features
* **Dual-Database Memory:** Uses SQLite to maintain an "Official Class Database" (Admin only) and a 24-hour auto-cleaning "Rumor Mill" based on student chatter.
* **Auto API Key Rotation:** Built-in load balancing instantly swaps API keys if a Google rate limit (429) is hit, ensuring constant uptime.
* **Live DIU Web Scraper:** Typing `!notice` triggers a hidden browser to scrape the official DIU Notice Board and return the top 5 latest updates.
* **Dynamic AI Personas:** The bot automatically shifts its tone and behavior based on who is texting it.
* **Multimodal Vision:** Capable of reading images, analyzing screenshots of code, and executing Python for math.
* **Native Language Processing:** Automatically detects and flawlessly replies in English, Bangla, or Banglish.

## 🛠️ Tech Stack
* **Runtime:** Node.js
* **Library:** `whatsapp-web.js`
* **AI Engine:** Google Gemini 2.5 Flash (`@google/genai`)
* **Database:** SQLite3
* **Browser Engine:** Brave Browser / Chromium

---

## 🚀 Setup & Installation Guide

### 1. Prerequisites
You need to have **Node.js** installed on your Windows machine, as well as a Chromium-based browser like **Brave, Google Chrome, or Microsoft Edge**.

### 2. Install the Bot
Open your terminal and run the following commands to clone the code and install the required brains:
```bash
git clone https://github.com/aszaklearns/whatsapp-gemini-bot.git
https://github.com/aszaklearns/whatsapp-gemini-bot.git
cd whatsapp-gemini-bot
npm install
```
## Launch the Setup Wizard
Run the master script:

```bash
node index.js
```

### The terminal will launch a setup wizard.

Paste your Gemini API Keys (separated by commas).

Enter your admin phone number (e.g., 017xxxxxxxx).

Scan the generated QR code with your WhatsApp app.



## ⚠️ Common Troubleshooting (Read This First!)
If you run into errors while setting this up on a fresh Windows machine, here are the exact fixes:

Error 1:
```bash
npm init
```
or,

```bash
npm install
```
throws a "Running scripts is disabled" error.
The Cause: Windows PowerShell blocks developer scripts by default on fresh installs.
The Fix: Open PowerShell as Administrator, paste this command, and press Y when asked:

```bash
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```


Error 2: 

Could not find Chrome or Browser was not found at the configured executablePath
The Cause: Puppeteer failed to download its own hidden browser, or it cannot find where your browser is installed.
The Fix: Open index.js, find the puppeteer: block, and change the executablePath to match the browser you actually use:

For Brave: C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe

For Chrome: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe

For Edge: C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe

Error 3:

 You changed the code, but the bot is still throwing the same error.
The Cause: You forgot to save the file.
The Fix: Always press Ctrl + S in your text editor after changing the code, then restart the terminal with node index.js.

Error 4: 

429 RESOURCE_EXHAUSTED
The Cause: You sent too many messages too quickly and hit the free API speed limit.
The Fix: The bot has an auto-rotator, but if you only put 1 API key in the config.json file, you just need to wait exactly 60 seconds for the Google server to cool down.



## 📝 Usage Commands

!save [CATEGORY] [Information] - (Admin Only) Saves official details to the permanent SQLite database.

!notice - Triggers the live web crawler to fetch the latest university notices.

General Texting - The bot will read the databases, process the context, resolve conflicting rumors, and reply naturally.


