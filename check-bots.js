// =========================================
//   سكريبت فحص البوتات والمشاكل
// =========================================
// الاستخدام: node check-bots.js

const axios = require("axios");

const CLIENT_BOT_TOKEN = "8794840933:AAEZTk1cBTr-TcTi5f1w_QiLneNvVyCFnHM";
const ADMIN_BOT_TOKEN = "8777919219:AAEc_mZ9I-jdfPTcnRUf9VKL9cWg3Nh3Rc4";
const VIDEO_BOT_TOKEN = "7847315022:AAGbUTrd8R1V8bKZMpJCZrVoL3WNiEmDklY";
const EXPECTED_ADMIN_ID = 1778665778;

async function checkBot(token, name) {
  try {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🤖 ${name}`);
    console.log("=".repeat(50));
    
    // 1. Check bot info
    const meRes = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    if (meRes.data.ok) {
      const bot = meRes.data.result;
      console.log(`✅ البوت شغال`);
      console.log(`   الاسم: @${bot.username}`);
      console.log(`   ID: ${bot.id}`);
    }
    
    // 2. Check webhook
    const webhookRes = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    if (webhookRes.data.ok) {
      const info = webhookRes.data.result;
      if (info.url) {
        console.log(`✅ Webhook متصل`);
        console.log(`   URL: ${info.url}`);
        console.log(`   آخر تحديث: ${new Date(info.last_synchronization_error_date * 1000).toLocaleString('ar-EG') || "لا يوجد"}`);
        
        if (info.last_error_message) {
          console.log(`⚠️  آخر خطأ: ${info.last_error_message}`);
          console.log(`   تاريخ الخطأ: ${new Date(info.last_error_date * 1000).toLocaleString('ar-EG')}`);
        }
        
        if (info.pending_update_count > 0) {
          console.log(`📬 رسائل معلقة: ${info.pending_update_count}`);
        }
      } else {
        console.log(`❌ Webhook غير متصل`);
      }
    }
    
    // 3. Get recent updates
    const updatesRes = await axios.get(`https://api.telegram.org/bot${token}/getUpdates?limit=5`);
    if (updatesRes.data.ok && updatesRes.data.result.length > 0) {
      console.log(`\n📨 آخر 5 رسائل:`);
      updatesRes.data.result.forEach((update, i) => {
        if (update.message) {
          const msg = update.message;
          console.log(`   ${i+1}. من: @${msg.from.username || "unknown"} (ID: ${msg.from.id})`);
          console.log(`      الرسالة: ${msg.text?.substring(0, 50) || "غير نصية"}`);
          
          if (name === "بوت الأدمن" && msg.from.id !== EXPECTED_ADMIN_ID) {
            console.log(`      ⚠️  هذا المستخدم ليس الأدمن المتوقع!`);
            console.log(`      ⚠️  الأدمن المتوقع ID: ${EXPECTED_ADMIN_ID}`);
          }
        }
      });
    } else {
      console.log(`\n📭 لا توجد رسائل حديثة`);
    }
    
  } catch (err) {
    console.log(`❌ خطأ في فحص ${name}:`);
    console.log(`   ${err.response?.data?.description || err.message}`);
  }
}

async function getMyTelegramId() {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🔍 كيف تعرف الـ ID بتاعك؟`);
  console.log("=".repeat(50));
  console.log(`\n1. ابعت رسالة لـ @userinfobot على تليجرام`);
  console.log(`2. هيرد عليك بـ ID بتاعك`);
  console.log(`3. لو ID مختلف عن ${EXPECTED_ADMIN_ID}،`);
  console.log(`   لازم تعدل ADMIN_ID في ملف api/index.js\n`);
}

(async () => {
  console.log(`🔍 فحص حالة البوتات...\n`);
  
  await checkBot(CLIENT_BOT_TOKEN, "بوت الطلاب");
  await checkBot(ADMIN_BOT_TOKEN, "بوت الأدمن");
  await checkBot(VIDEO_BOT_TOKEN, "بوت الفيديوهات");
  
  await getMyTelegramId();
  
  console.log(`\n✅ انتهى الفحص!`);
})();
