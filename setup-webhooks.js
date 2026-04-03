// =========================================
//   سكريبت إعداد الـ Webhooks
//   شغّله مرة واحدة بعد الرفع على Vercel
// =========================================
// الاستخدام:
//   node setup-webhooks.js https://your-app.vercel.app

const axios = require("axios");

const CLIENT_BOT_TOKEN = "ضع_توكن_بوت_الطلاب";   // @ElKhulasa_Bot
const ADMIN_BOT_TOKEN = "ضع_توكن_بوت_الأدمن";    // @Boss_Managered_Bot

const BASE_URL = process.argv[2]; // مثال: https://elkhulasa-bot.vercel.app

if (!BASE_URL) {
  console.log("❌ استخدم: node setup-webhooks.js https://your-app.vercel.app");
  process.exit(1);
}

async function setWebhook(token, path, name) {
  const url = `${BASE_URL}/api/${path}`;
  const res = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
    url,
    allowed_updates: ["message", "callback_query"],
  });
  console.log(`${name}: ${res.data.ok ? "✅ تم" : "❌ فشل"} → ${url}`);
}

(async () => {
  await setWebhook(CLIENT_BOT_TOKEN, "client", "بوت الطلاب");
  await setWebhook(ADMIN_BOT_TOKEN, "admin", "بوت الأدمن");
  console.log("\n🎉 الـ Webhooks جاهزة!");
})();
