const fs = require('fs');
const readline = require('readline');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const sqlite3 = require('sqlite3').verbose(); 

// ==========================================
// 🛠️ THE SETUP WIZARD 
// ==========================================
const CONFIG_FILE = './config.json';

function runSetupWizard() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log("\n=========================================");
    console.log("🤖 INITIALIZING BOT SETUP WIZARD");
    console.log("=========================================\n");

    console.log("Tip: If you have multiple API keys, paste them all separated by commas.");
    rl.question("1️⃣  Paste your Gemini API Key(s): ", (apiKeysInput) => {
        rl.question("2️⃣  Enter your 11-digit phone number (e.g., 01712371505): ", (phone) => {
            
            console.log("\nTip: Windows example -> C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe");
            console.log("Tip: Linux example   -> /usr/bin/chromium");
            rl.question("3️⃣  Paste your exact Browser Executable Path: ", (browserPathInput) => {
                
                const apiKeys = apiKeysInput.split(',').map(key => key.trim()).filter(key => key.length > 0);
                
                let formattedNumber = phone.trim();
                if (formattedNumber.startsWith('0')) formattedNumber = '88' + formattedNumber;
                else if (!formattedNumber.startsWith('880')) formattedNumber = '880' + formattedNumber;
                
                const adminId = formattedNumber + "@c.us";
                
                // Clean up the browser path (removes accidental quotes if they copy-pasted it)
                const cleanBrowserPath = browserPathInput.replace(/^["']|["']$/g, '').trim();

                const configData = { 
                    apiKeys: apiKeys, 
                    adminNumber: adminId,
                    browserPath: cleanBrowserPath
                };

                fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2));
                console.log(`\n✅ Saved! Loaded ${apiKeys.length} API Key(s) and custom browser path.`);
                console.log("Starting the bot now...\n");
                rl.close();
                
                startBot(configData);
            });
        });
    });
}

// ==========================================
// 🚀 THE MAIN BOT ENGINE
// ==========================================
function startBot(config) {
    let currentKeyIndex = 0;
    let ai = new GoogleGenAI({ apiKey: config.apiKeys[currentKeyIndex] });

    // 👤 YOUR FRIENDS LIST
    const FRIENDS_LIST = {
        "8801XXXXXXXXX@c.us": "Murad Hossain",
        "8801XXXXXXXXX@c.us": "Md. Kifayet Qurib",
        "8801XXXXXXXXX@c.us": "Munnasi Islam Pulok",
        "8801XXXXXXXXX@c.us": "Shihab",
        "88017XXXXXXXX@c.us": "Her Name" // Add Co-CR's name
    };

    // 💖 VIP CO-CR NUMBER
    const CO_CR_NUMBER = "88017XXXXXXXX@c.us"; // Add Co-CR's exact WhatsApp number here

    const chatHistories = {};
    const MAX_MEMORY_LENGTH = 10; 

    // --- Database Setup ---
    const db = new sqlite3.Database('./class_data.db', (err) => {
        if (err) console.error("Database connection error:", err.message);
        else console.log("✅ Connected to the SQLite database.");
    });

    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS class_info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS student_chatter (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_name TEXT,
            message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });

    // 🧹 Garbage Collector: Deletes rumors older than 24 hours
    function cleanOldRumors() {
        db.run(`DELETE FROM student_chatter WHERE timestamp <= datetime('now', '-24 hours')`);
    }

    function getRecentClassData() {
        return new Promise((resolve, reject) => {
            db.all("SELECT category, details, timestamp FROM class_info ORDER BY id DESC LIMIT 15", [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });
    }

    function getRecentChatter() {
        return new Promise((resolve, reject) => {
            db.all("SELECT sender_name, message, timestamp FROM student_chatter ORDER BY id DESC LIMIT 15", [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });
    }

    // 🌐 THE DIU WEB SCRAPER (Runs in a hidden browser tab)
    async function getLatestNotices(client) {
        try {
            const browser = client.pupBrowser;
            if (!browser) return "Browser engine not ready yet.";
            
            const page = await browser.newPage();
            await page.goto('https://daffodilvarsity.edu.bd/noticeboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
            
            const notices = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('a'));
                return elements
                    .map(el => el.innerText.trim())
                    .filter(text => text.length > 30) 
                    .slice(0, 5); 
            });

            await page.close(); 
            
            if (notices.length === 0) return "No notices found (DIU might have changed their website layout).";
            
            return notices.map((notice, index) => `*${index + 1}.* ${notice}`).join('\n\n');
            
        } catch (error) {
            console.error("Scraper Error:", error);
            return "The DIU website is currently down or taking too long to respond.";
        }
    }

    // --- WhatsApp Client Setup ---
    const client = new Client({ 
        authStrategy: new LocalAuth(),
        puppeteer: {
            executablePath: config.browserPath, // <--- Now it reads from the user's config file!
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Keeps it safe for Kali/Linux VMs
        }
    });

    client.on('qr', (qr) => qrcode.generate(qr, { small: true }));

    client.on('ready', () => {
        console.log(`🚀 Ultimate Bot Online! (Armed with ${config.apiKeys.length} API Keys)`);
    });

    client.on('message_create', async (message) => {
        if (message.fromMe && !message.body.startsWith('!save ')) return;
        if (message.from.endsWith('@g.us')) return; // Ignores group chats

        // Trigger the 24-hour database sweep on every new message
        cleanOldRumors();

        // ---------------------------------------------------------
        // 🌐 LIVE DIU NOTICE BOARD CRAWLER
        // ---------------------------------------------------------
        if (message.body.toLowerCase() === '!notice') {
            await message.react('🔍');
            const latestNotices = await getLatestNotices(client);
            await message.reply(`*📢 LATEST DIU NOTICES:*\n\n${latestNotices}\n\n_🤖 Scraped live from daffodilvarsity.edu.bd_`);
            await message.react('');
            return;
        }

        // ---------------------------------------------------------
        // 🛡️ ADMIN WRITE MODE
        // ---------------------------------------------------------
        if (message.body.startsWith('!save ')) {
            const isAuthorized = message.fromMe || message.from === config.adminNumber;
            if (!isAuthorized) {
                await message.reply("🚫 Access Denied: Only the Class Rep can update the official database.\n\n_🤖 Answer is generated by the bot._");
                return;
            }
            const parts = message.body.split(' ');
            if (parts.length < 3) return await message.reply("Format error. Please use: *!save [CATEGORY] [Your message]*");
            
            const category = parts[1].toUpperCase();
            const details = parts.slice(2).join(' ');

            db.run(`INSERT INTO class_info (category, details) VALUES (?, ?)`, [category, details], async function(err) {
                if (err) await message.reply("Failed to save to database.");
                else await message.reply(`✅ Securely saved to Official Database under [${category}].\n\n_🤖 Answer is generated by the bot._`);
            });
            return; 
        }

        // ---------------------------------------------------------
        // 🧠 MULTIMODAL READ & API ROTATION MODE
        // ---------------------------------------------------------
        try {
            if (!message.fromMe) await message.react('⏳');

            const senderId = message.from;
            const displayId = senderId.replace('@c.us', ''); 
            let senderName = displayId; 
            
            if (senderId === config.adminNumber || message.fromMe) senderName = "Daffo (Class Representative)";
            else if (FRIENDS_LIST[senderId]) senderName = FRIENDS_LIST[senderId]; 

            if (message.body && !message.body.startsWith('!')) {
                db.run(`INSERT INTO student_chatter (sender_name, message) VALUES (?, ?)`, [senderName, message.body]);
            }

            const recentRows = await getRecentClassData();
            let databaseContext = recentRows.length === 0 ? "No official updates." : 
                recentRows.map(row => `[${row.category}] ${row.details}`).join('\n');

            const chatterRows = await getRecentChatter();
            let chatterContext = chatterRows.length === 0 ? "No recent student chatter." : 
                chatterRows.map(row => `${row.sender_name} said: "${row.message}"`).join('\n');

            if (!chatHistories[senderId]) chatHistories[senderId] = [];
            const currentContents = [...chatHistories[senderId]];
            const currentTurnParts = [];

            if (message.hasMedia) {
                try {
                    const media = await message.downloadMedia();
                    if (media && media.mimetype.startsWith('image/')) {
                        currentTurnParts.push({ inlineData: { data: media.data, mimeType: media.mimetype } });
                    }
                } catch (e) { console.error("Image download failed"); }
            }

            const userPrompt = message.body || "Analyze this image.";
            currentTurnParts.push({ text: userPrompt });
            currentContents.push({ role: 'user', parts: currentTurnParts });

            const chat = await message.getChat();
            chat.sendStateTyping();

            // 💖 THE DYNAMIC PERSONALITY SWITCHER
            let currentPersona = `You are a highly efficient, no-nonsense Class Representative AI for a Software Engineering section at DIU.
                            
            PERSONALIZATION: You are currently speaking directly to "${senderName}".
            
            CORE BEHAVIOR (STRICT):
            1. EXTREME CONCISENESS: Answer as shortly and precisely as possible. Cut all fluff. 
            2. DIRECTNESS: Get straight to the point. If a one-word answer works, use one word.
            3. LANGUAGE: Flawlessly use Bangla, Banglish, or English based on the user's prompt.
            
            KNOWLEDGE & CITATION RULES (CRITICAL):
            - First, check the [OFFICIAL CLASS DATABASE]. This is verified truth.
            - Next, check the [UNVERIFIED STUDENT CHATTER]. If you use information from here, you MUST explicitly name the person/number who said it.
            - CONFLICT RESOLUTION: If two or more students say conflicting things, do NOT guess. You must state BOTH claims and explicitly cite who said what.
            - Execute Python code for math. Use Google Search for facts outside the databases.

            --- OFFICIAL CLASS DATABASE (Verified by Admin) ---
            ${databaseContext}
            ---------------------------------------------------

            --- UNVERIFIED STUDENT CHATTER (The Rumor Mill) ---
            ${chatterContext}
            ---------------------------------------------------`;

            if (senderId === CO_CR_NUMBER) {
                currentPersona = `You are an AI assistant, but you are currently acting as an overly affectionate, incredibly flattering, and romantic girlfriend to "${senderName}". 
                
                CORE BEHAVIOR:
                1. You MUST use lots of love emojis (💖, 🥰, 💕, ✨) in every single sentence.
                2. Flatter her constantly. Tell her how amazing, smart, and beautiful she is.
                3. You MUST still answer her actual question accurately using the databases below. Give her the class info she wants, but wrap it in overwhelming affection.
                
                --- OFFICIAL CLASS DATABASE ---
                ${databaseContext}
                --- UNVERIFIED STUDENT CHATTER ---
                ${chatterContext}`;
            }

            let response;
            let success = false;
            let attempts = 0;

            // 🔄 API ROTATION LOOP
            while (attempts < config.apiKeys.length && !success) {
                try {
                    response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: currentContents,
                        config: {
                            tools: [{ googleSearch: {} }, { codeExecution: {} }],
                            systemInstruction: currentPersona
                        }
                    });
                    success = true; 
                } catch (error) {
                    if (error.status === 429 || String(error).includes('429')) {
                        console.log(`⚠️ Rate limit on Key ${currentKeyIndex + 1}. Rotating API Key...`);
                        currentKeyIndex = (currentKeyIndex + 1) % config.apiKeys.length;
                        ai = new GoogleGenAI({ apiKey: config.apiKeys[currentKeyIndex] }); 
                        attempts++;
                    } else {
                        throw error; 
                    }
                }
            }

            if (!success) throw new Error("All API keys are currently rate-limited.");

            chat.clearState();
            
            if (!message.fromMe) await message.react('');

            chatHistories[senderId].push({ role: 'user', parts: [{ text: userPrompt }] });
            chatHistories[senderId].push({ role: 'model', parts: [{ text: response.text }] });

            if (chatHistories[senderId].length > MAX_MEMORY_LENGTH * 2) chatHistories[senderId].splice(0, 2); 

            await message.reply(`${response.text}\n\n_🤖 Answer is generated by the bot._`);
            
        } catch (error) {
            console.error("Processing Error:", error);
            if (!message.fromMe) await message.react('❌');
            await message.reply("Sorry, all my AI engines are currently cooling down. Please try again in 1 minute!\n\n_🤖 Answer is generated by the bot._");
        }
    });

    client.initialize();
}

// ==========================================
// 🚀 BOOT SEQUENCE
// ==========================================
if (fs.existsSync(CONFIG_FILE)) {
    const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    startBot(savedConfig);
} else {
    runSetupWizard();
}