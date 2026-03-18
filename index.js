const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = process.env.TOKEN;
const url = process.env.RENDER_EXTERNAL_URL;

const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

// webhook route
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// set webhook
bot.setWebHook(`${url}/bot${token}`);

console.log("🔥 WEBHOOK BOT STARTED");

// start command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🔥 البوت شغال على Render");
});

// تشغيل السيرفر
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});