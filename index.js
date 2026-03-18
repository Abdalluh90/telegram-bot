const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const ytdl = require('ytdl-core');
const fs = require('fs');

const token = process.env.TOKEN;
const url = process.env.RENDER_EXTERNAL_URL;

const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

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

📥 ابعت لينك YouTube
وهختارلك:

🎥 فيديو
🎧 MP3`);
});

// استقبال اللينك
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith("/")) return;

    if (ytdl.validateURL(text)) {
        bot.sendMessage(chatId, "اختار 👇", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🎥 فيديو", callback_data: `video|${text}` },
                        { text: "🎧 MP3", callback_data: `mp3|${text}` }
                    ]
                ]
            }
        });
    } else {
        bot.sendMessage(chatId, "❌ اللينك لازم يكون YouTube حالياً");
    }
});

// الأزرار
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const [type, url] = query.data.split("|");

    bot.sendMessage(chatId, "⏳ جاري التحميل...");

    try {
        const file = `${chatId}.mp4`;

        if (type === "video") {
            const stream = ytdl(url, { quality: 'highest' });
            const writeStream = fs.createWriteStream(file);

            stream.pipe(writeStream);

            writeStream.on('finish', () => {
                bot.sendVideo(chatId, file).then(() => {
                    fs.unlinkSync(file);
                });
            });
        }

        if (type === "mp3") {
            bot.sendMessage(chatId, "❌ MP3 محتاج ffmpeg (مش متاح هنا)");
        }

    } catch (err) {
        bot.sendMessage(chatId, "❌ حصل خطأ");
    }
});

// server
app.listen(3000, () => {
    console.log("🚀 Server running");
});
