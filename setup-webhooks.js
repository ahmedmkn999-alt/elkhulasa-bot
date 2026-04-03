// =========================================
//   سكريبت إعداد الـ Webhooks - محدث
// =========================================
// الاستخدام:
//   node setup-webhooks-fixed.js https://your-app.vercel.app

const axios = require("axios");

// التوكنز الحقيقية من ملف index.js
const CLIENT_BOT_TOKEN = "8794840933:AAEZTk1cBTr-TcTi5f1w_QiLneNvVyCFnHM";
const ADMIN_BOT_TOKEN = "8777919219:AAEc_mZ9I-jdfPTcnRUf9VKL9cWg3Nh3Rc4";
const VIDEO_BOT_TOKEN = "7847315022:AAGbUTrd8R1V8bKZMpJCZrVoL3WNiEmDklY";

const BASE_URL = process.argv[2]; // مثال: https://elkhulasa-bot.vercel.app

if (!BASE_URL) {
  console.log("❌ استخدم: node setup-webhooks-fixed.js https://your-app.vercel.app");
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
    if (!res.data.ok) {
      console.log(`  خطأ: ${res.data.description}`);
    }
  } catch (err) {
    console.log(`${name}: ❌ فشل`);
    console.log(`  خطأ: ${err.response?.data?.description || err.message}`);
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
  await setWebhook(ADMIN_BOT_TOKEN, "admin", "بوت الأدمن");
  await setWebhook(VIDEO_BOT_TOKEN, "video", "بوت الفيديوهات");
  
  console.log("\n" + "=".repeat(50));
  console.log("🔍 فحص الحالة...\n");
  
  await checkWebhook(CLIENT_BOT_TOKEN, "بوت الطلاب");
  await checkWebhook(ADMIN_BOT_TOKEN, "بوت الأدمن");
  await checkWebhook(VIDEO_BOT_TOKEN, "بوت الفيديوهات");
  
  console.log("\n🎉 انتهى!");
})();
