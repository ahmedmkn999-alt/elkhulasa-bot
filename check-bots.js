// =============================================
//   سكريبت فحص البوتات
//   الاستخدام: node check-bots.js
// =============================================

require("dotenv").config();
const axios = require("axios");

const CLIENT_BOT_TOKEN  = process.env.CLIENT_BOT_TOKEN;
const ADMIN_BOT_TOKEN   = process.env.ADMIN_BOT_TOKEN;
const VIDEO_BOT_TOKEN   = process.env.VIDEO_BOT_TOKEN;
const EXPECTED_ADMIN_ID = parseInt(process.env.ADMIN_ID);

async function checkBot(token, name) {
  try {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🤖 ${name}`);
    console.log("=".repeat(50));

    const meRes = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    if (meRes.data.ok) {
      const bot = meRes.data.result;
      console.log(`✅ البوت شغال — @${bot.username} (ID: ${bot.id})`);
    }

    const webhookRes = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    if (webhookRes.data.ok) {
      const info = webhookRes.data.result;
      if (info.url) {
        console.log(`✅ Webhook متصل: ${info.url}`);
        if (info.last_error_message) {
          console.log(`⚠️  آخر خطأ: ${info.last_error_message}`);
        }
        if (info.pending_update_count > 0) {
          console.log(`📬 رسائل معلقة: ${info.pending_update_count}`);
        }
      } else {
        console.log(`❌ Webhook غير متصل`);
      }
    }
  } catch (err) {
    console.log(`❌ خطأ: ${err.response?.data?.description || err.message}`);
  }
}

(async () => {
  console.log("🔍 فحص حالة البوتات...\n");
  await checkBot(CLIENT_BOT_TOKEN, "بوت الطلاب");
  await checkBot(ADMIN_BOT_TOKEN,  "بوت الأدمن");
  await checkBot(VIDEO_BOT_TOKEN,  "بوت الفيديوهات");
  console.log("\n✅ انتهى الفحص!");
})();
