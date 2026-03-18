const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');

const token = process.env.TOKEN;
const url = process.env.RENDER_EXTERNAL_URL;

const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

// تثبيت yt-dlp تلقائي
exec("apt update && apt install -y yt-dlp ffmpeg", (err) => {
    if (err) console.log("❌ install failed");
    else console.log("✅ yt-dlp installed");
});

// webhook
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

bot.setWebHook(`${url}/bot${token}`);

console.log("🔥 BOT STARTED");

// /start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id,
`👋 أهلاً بيك

📥 ابعت أي لينك فيديو
وهتختار:

🎥 فيديو
🎧 MP3

📩 الدعم:
@Abdalluhgomaa`);
});

// استقبال اللينك
bot.on('message', (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    if (!text || text.startsWith("/")) return;

    if (text.startsWith("http")) {
        bot.sendMessage(chatId, "اختار 👇", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🎥 جودة عالية", callback_data: `high|${text}` },
                        { text: "📱 جودة متوسطة", callback_data: `low|${text}` }
                    ],
                    [
                        { text: "🎧 MP3", callback_data: `mp3|${text}` }
                    ]
                ]
            }
        });
    }
});

// الأزرار
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const [type, url] = query.data.split("|");

    bot.sendMessage(chatId, "⏳ جاري التحميل...");

    let file = "";

    if (type === "high") {
        file = `video_${chatId}.mp4`;
        exec(`yt-dlp -f best -o ${file} ${url}`, sendFile);
    }

    if (type === "low") {
        file = `video_${chatId}.mp4`;
        exec(`yt-dlp -f worst -o ${file} ${url}`, sendFile);
    }

    if (type === "mp3") {
        file = `audio_${chatId}.mp3`;
        exec(`yt-dlp -x --audio-format mp3 -o ${file} ${url}`, sendFile);
    }

    function sendFile(err) {
        if (err) {
            bot.sendMessage(chatId, "❌ فشل التحميل");
            return;
        }

        if (type === "mp3") {
            bot.sendAudio(chatId, file);
        } else {
            bot.sendVideo(chatId, file);
        }

        fs.unlinkSync(file);
    }
});

// تشغيل السيرفر
app.listen(3000, () => {
    console.log("🚀 Server running");
});
