const axios = require("axios");
const db = require("../firebase");
const content = require("../content");

// =================== CONFIG ===================
const CLIENT_BOT_TOKEN = process.env.CLIENT_BOT_TOKEN; // @ElKhulasa_Bot
const ADMIN_BOT_TOKEN = process.env.ADMIN_BOT_TOKEN;   // @Boss_Managered_Bot
const ADMIN_ID = 1778665778;
const ADMIN_USERNAME = "@Ahmedddd50";

// =================== HELPERS ===================
async function sendMessage(token, chatId, text, extra = {}) {
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extra,
  });
}

async function getUser(userId) {
  const snap = await db.ref(`users/${userId}`).get();
  return snap.exists() ? snap.val() : null;
}

async function saveUser(userId, username) {
  await db.ref(`users/${userId}`).set({
    userId,
    username: username || "unknown",
    status: "inactive",
    joinedAt: Date.now(),
  });
}

// =================== CLIENT BOT ===================
async function handleClientBot(update) {
  const msg = update.message || update.callback_query?.message;
  const callbackQuery = update.callback_query;

  if (update.message) {
    const chatId = update.message.chat.id;
    const userId = update.message.from.id;
    const username = update.message.from.username || update.message.from.first_name;
    const text = update.message.text;

    // Save user if not exists
    const user = await getUser(userId);
    if (!user) await saveUser(userId, username);

    if (text === "/start") {
      // Build subjects keyboard
      const keyboard = {
        inline_keyboard: [
          [
            { text: "📚 اللغة العربية", callback_data: "subject_arabic" },
            { text: "🌍 اللغة الإنجليزية", callback_data: "subject_english" },
          ],
          [
            { text: "⚡ الفيزياء", callback_data: "subject_physics" },
            { text: "🧪 الكيمياء", callback_data: "subject_chemistry" },
          ],
          [
            { text: "🧬 الأحياء", callback_data: "subject_biology" },
            { text: "📐 الرياضيات", callback_data: "subject_math" },
          ],
        ],
      };

      await sendMessage(
        CLIENT_BOT_TOKEN,
        chatId,
        `🎓 <b>أهلاً بك في الخُلاصة!</b>\n\n` +
        `مراجعات ثانوية عامة - نخبة أفضل المدرسين\n\n` +
        `اختر المادة اللي عايز تراجعها 👇`,
        { reply_markup: keyboard }
      );
    }
  }

  if (callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // Answer callback to remove loading
    await axios.post(`https://api.telegram.org/bot${CLIENT_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callbackQuery.id,
    });

    // Subject selected
    if (data.startsWith("subject_")) {
      const subjectKey = data.replace("subject_", "");
      const subject = content[subjectKey];
      if (!subject) return;

      const user = await getUser(userId);

      if (!user || user.status !== "active") {
        // Not subscribed
        await sendMessage(
          CLIENT_BOT_TOKEN,
          chatId,
          `🔒 <b>هذا المحتوى للمشتركين فقط</b>\n\n` +
          `سعر الاشتراك: <b>100 جنيه مصري</b>\n\n` +
          `للتفعيل تواصل مع الإدارة:\n` +
          `👤 ${ADMIN_USERNAME}`
        );
        return;
      }

      // User is active - show teachers
      const teachers = subject.teachers;
      let hasLinks = false;

      for (const teacher of teachers) {
        if (teacher.links && teacher.links.length > 0) {
          hasLinks = true;
          let linksText = `👨‍🏫 <b>${teacher.name}</b>\n\n`;
          teacher.links.forEach((link, i) => {
            linksText += `${i + 1}. <a href="${link.url}">${link.title}</a>\n`;
          });
          await sendMessage(CLIENT_BOT_TOKEN, chatId, linksText, {
            disable_web_page_preview: true,
          });
        }
      }

      if (!hasLinks) {
        await sendMessage(
          CLIENT_BOT_TOKEN,
          chatId,
          `📂 <b>${subject.name}</b>\n\n` +
          `⏳ لم يتم رفع مراجعات لهذه المادة بعد.\n` +
          `سيتم الإعلان فور الرفع!`
        );
      }
    }
  }
}

// =================== ADMIN BOT ===================
async function handleAdminBot(update) {
  const msg = update.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text || "";

  // Security check
  if (userId !== ADMIN_ID) {
    await sendMessage(ADMIN_BOT_TOKEN, chatId, "⛔ غير مصرح لك باستخدام هذا البوت.");
    return;
  }

  // /start
  if (text === "/start") {
    await sendMessage(
      ADMIN_BOT_TOKEN,
      chatId,
      `👑 <b>لوحة تحكم الخُلاصة</b>\n\n` +
      `الأوامر المتاحة:\n\n` +
      `/stats - إحصائيات المستخدمين\n` +
      `/activate @username - تفعيل مستخدم\n` +
      `/deactivate @username - إلغاء تفعيل مستخدم\n` +
      `/broadcast رسالتك - إرسال رسالة لكل الطلاب`
    );
    return;
  }

  // /stats
  if (text === "/stats") {
    const snap = await db.ref("users").get();
    if (!snap.exists()) {
      await sendMessage(ADMIN_BOT_TOKEN, chatId, "📊 لا يوجد مستخدمون حتى الآن.");
      return;
    }
    const users = Object.values(snap.val());
    const active = users.filter((u) => u.status === "active").length;
    const inactive = users.filter((u) => u.status === "inactive").length;

    await sendMessage(
      ADMIN_BOT_TOKEN,
      chatId,
      `📊 <b>إحصائيات المستخدمين</b>\n\n` +
      `👥 إجمالي المستخدمين: <b>${users.length}</b>\n` +
      `✅ مشتركون (Active): <b>${active}</b>\n` +
      `❌ غير مشتركين (Inactive): <b>${inactive}</b>`
    );
    return;
  }

  // /activate @username
  if (text.startsWith("/activate ")) {
    const targetUsername = text.replace("/activate ", "").replace("@", "").trim();
    const snap = await db.ref("users").orderByChild("username").equalTo(targetUsername).get();

    if (!snap.exists()) {
      await sendMessage(ADMIN_BOT_TOKEN, chatId, `❌ المستخدم @${targetUsername} غير موجود في قاعدة البيانات.`);
      return;
    }

    const updates = {};
    snap.forEach((child) => {
      updates[`users/${child.key}/status`] = "active";
    });
    await db.ref().update(updates);

    await sendMessage(ADMIN_BOT_TOKEN, chatId, `✅ تم تفعيل @${targetUsername} بنجاح!`);
    return;
  }

  // /deactivate @username
  if (text.startsWith("/deactivate ")) {
    const targetUsername = text.replace("/deactivate ", "").replace("@", "").trim();
    const snap = await db.ref("users").orderByChild("username").equalTo(targetUsername).get();

    if (!snap.exists()) {
      await sendMessage(ADMIN_BOT_TOKEN, chatId, `❌ المستخدم @${targetUsername} غير موجود.`);
      return;
    }

    const updates = {};
    snap.forEach((child) => {
      updates[`users/${child.key}/status`] = "inactive";
    });
    await db.ref().update(updates);

    await sendMessage(ADMIN_BOT_TOKEN, chatId, `🔒 تم إلغاء تفعيل @${targetUsername}.`);
    return;
  }

  // /broadcast
  if (text.startsWith("/broadcast ")) {
    const broadcastMsg = text.replace("/broadcast ", "").trim();
    const snap = await db.ref("users").get();

    if (!snap.exists()) {
      await sendMessage(ADMIN_BOT_TOKEN, chatId, "❌ لا يوجد مستخدمون.");
      return;
    }

    const users = Object.values(snap.val());
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await sendMessage(CLIENT_BOT_TOKEN, user.userId, `📢 <b>إعلان من الخُلاصة:</b>\n\n${broadcastMsg}`);
        sent++;
      } catch (e) {
        failed++;
      }
    }

    await sendMessage(
      ADMIN_BOT_TOKEN,
      chatId,
      `📢 <b>تم إرسال البرودكاست</b>\n\n✅ وصل لـ: ${sent}\n❌ فشل: ${failed}`
    );
    return;
  }
}

// =================== MAIN HANDLER ===================
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).send("الخُلاصة Bot is running ✅");
  }

  try {
    const path = req.url || "";
    const update = req.body;

    if (path.includes("/api/client")) {
      await handleClientBot(update);
    } else if (path.includes("/api/admin")) {
      await handleAdminBot(update);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(200).json({ ok: false });
  }
};
