// =============================================
//   سكريبت إعداد الـ Webhooks
//   الاستخدام: node setup-webhooks.js https://your-app.vercel.app
// =============================================

require("dotenv").config(); // للتشغيل المحلي فقط
const axios = require("axios");

const CLIENT_BOT_TOKEN = process.env.CLIENT_BOT_TOKEN;
const ADMIN_BOT_TOKEN  = process.env.ADMIN_BOT_TOKEN;
const VIDEO_BOT_TOKEN  = process.env.VIDEO_BOT_TOKEN;

const BASE_URL = process.argv[2];

if (!BASE_URL) {
  console.log("❌ استخدم: node setup-webhooks.js https://your-app.vercel.app");
  process.exit(1);
}

async function setWebhook(token, path, name) {
  const url = `${BASE_URL}/api/${path}`;
  try {
    const res = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
      url,
      allowed_updates: ["message", "callback_query"],
    });
    console.log(`${name}: ${res.data.ok ? "✅ تم" : "❌ فشل"} → ${url}`);
    if (!res.data.ok) console.log(`  خطأ: ${res.data.description}`);
  } catch (err) {
    console.log(`${name}: ❌ فشل — ${err.response?.data?.description || err.message}`);
  }
}

async function checkWebhook(token, name) {
  try {
    const res = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    console.log(`\n📋 حالة ${name}:`);
    console.log(`  URL: ${res.data.result.url || "غير متصل"}`);
    console.log(`  آخر خطأ: ${res.data.result.last_error_message || "لا يوجد"}`);
  } catch (err) {
    console.log(`❌ فشل فحص ${name}`);
  }
}

(async () => {
  console.log("🔄 جاري إعداد الـ Webhooks...\n");
  await setWebhook(CLIENT_BOT_TOKEN, "client", "بوت الطلاب");
  await setWebhook(ADMIN_BOT_TOKEN,  "admin",  "بوت الأدمن");
  await setWebhook(VIDEO_BOT_TOKEN,  "video",  "بوت الفيديوهات");

  console.log("\n" + "=".repeat(50));
  console.log("🔍 فحص الحالة...\n");
  await checkWebhook(CLIENT_BOT_TOKEN, "بوت الطلاب");
  await checkWebhook(ADMIN_BOT_TOKEN,  "بوت الأدمن");
  await checkWebhook(VIDEO_BOT_TOKEN,  "بوت الفيديوهات");

  console.log("\n🎉 انتهى!");
})();
