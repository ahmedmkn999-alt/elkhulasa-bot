const axios = require("axios");
const db = require("../firebase");
const content = require("../content");

// =================== CONFIG ===================
const CLIENT_BOT_TOKEN = process.env.CLIENT_BOT_TOKEN;
const ADMIN_BOT_TOKEN = process.env.ADMIN_BOT_TOKEN;
const ADMIN_ID = 1778665778;
const ADMIN_USERNAME = "@Ahmedddd50";
const TRIAL_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// =================== HELPERS ===================
async function sendMessage(token, chatId, text, extra = {}) {
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...extra,
    });
  } catch (e) {
    console.error("sendMessage error:", e.response?.data || e.message);
  }
}

async function getUser(userId) {
  const snap = await db.ref(`users/${userId}`).get();
  return snap.exists() ? snap.val() : null;
}

async function saveUser(userId, username, firstName) {
  await db.ref(`users/${userId}`).set({
    userId,
    username: username || "unknown",
    firstName: firstName || "",
    status: "trial",
    trialStart: Date.now(),
    joinedAt: Date.now(),
    banned: false,
  });
}

function isTrialActive(user) {
  if (user.status !== "trial") return false;
  return Date.now() - user.trialStart < TRIAL_DURATION_MS;
}

function isSubscriptionActive(user) {
  if (user.status !== "active") return false;
  if (!user.subscriptionEnd) return false;
  return Date.now() < user.subscriptionEnd;
}

function hasAccess(user) {
  if (user.banned) return false;
  return isTrialActive(user) || isSubscriptionActive(user);
}

function getTrialTimeLeft(user) {
  const remaining = TRIAL_DURATION_MS - (Date.now() - user.trialStart);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// =================== SUBJECTS KEYBOARD ===================
function getSubjectsKeyboard() {
  return {
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
}

// =================== CLIENT BOT ===================
async function handleClientBot(update) {
  const msg = update.message;
  const callbackQuery = update.callback_query;

  if (msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || "";
    const firstName = msg.from.first_name || "";
    const text = msg.text || "";

    let user = await getUser(userId);
    if (!user) {
      await saveUser(userId, username, firstName);
      user = await getUser(userId);
    }

    if (user.banned) {
      await sendMessage(CLIENT_BOT_TOKEN, chatId, "🚫 تم حظرك من استخدام البوت.");
      return;
    }

    if (text === "/start") {
      let statusMsg = "";
      if (isTrialActive(user)) {
        statusMsg = `⏱ <b>تجربة مجانية</b> - متبقي: ${getTrialTimeLeft(user)}`;
      } else if (isSubscriptionActive(user)) {
        const endDate = new Date(user.subscriptionEnd).toLocaleDateString("ar-EG");
        statusMsg = `✅ <b>مشترك</b> - ينتهي: ${endDate}`;
      } else {
        statusMsg = `🔒 <b>غير مشترك</b>`;
      }

      await sendMessage(
        CLIENT_BOT_TOKEN,
        chatId,
        `🎓 <b>أهلاً بك في الخُلاصة!</b>\n` +
        `مراجعات ثانوية عامة - نخبة أفضل المدرسين\n\n` +
        `${statusMsg}\n\n` +
        `اختر المادة اللي عايز تراجعها 👇`,
        { reply_markup: getSubjectsKeyboard() }
      );
    }
  }

  if (callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    await axios.post(`https://api.telegram.org/bot${CLIENT_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callbackQuery.id,
    });

    let user = await getUser(userId);
    if (!user) {
      await saveUser(userId, callbackQuery.from.username || "", callbackQuery.from.first_name || "");
      user = await getUser(userId);
    }

    if (user.banned) {
      await sendMessage(CLIENT_BOT_TOKEN, chatId, "🚫 تم حظرك من استخدام البوت.");
      return;
    }

    if (data.startsWith("subject_")) {
      const subjectKey = data.replace("subject_", "");
      const subject = content[subjectKey];
      if (!subject) return;

      if (!hasAccess(user)) {
        let msg = `🔒 <b>انتهت صلاحيتك!</b>\n\n`;
        if (user.status === "trial") {
          msg += `انتهت التجربة المجانية (30 دقيقة)\n\n`;
        }
        msg += `للاشتراك: <b>100 جنيه مصري</b>\n`;
        msg += `تواصل مع الإدارة: ${ADMIN_USERNAME}`;
        await sendMessage(CLIENT_BOT_TOKEN, chatId, msg);
        return;
      }

      // Show trial timer if in trial
      let headerMsg = `📖 <b>${subject.name}</b>\n`;
      if (isTrialActive(user)) {
        headerMsg += `⏱ متبقي من التجربة: ${getTrialTimeLeft(user)}\n`;
      }

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
          `${headerMsg}\n⏳ لم يتم رفع مراجعات لهذه المادة بعد.\nسيتم الإعلان فور الرفع!`
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

  if (userId !== ADMIN_ID) {
    await sendMessage(ADMIN_BOT_TOKEN, chatId, "⛔ غير مصرح لك.");
    return;
  }

  // /start
  if (text === "/start") {
    await sendMessage(
      ADMIN_BOT_TOKEN, chatId,
      `👑 <b>لوحة تحكم الخُلاصة</b>\n\n` +
      `<b>أوامر المستخدمين:</b>\n` +
      `/activate @username 30 - تفعيل لمدة 30 يوم\n` +
      `/ban @username - حظر مستخدم\n` +
      `/unban @username - رفع الحظر\n` +
      `/info @username - معلومات مستخدم\n\n` +
      `<b>الإحصائيات:</b>\n` +
      `/stats - إحصائيات عامة\n` +
      `/list active - قائمة المشتركين\n` +
      `/list banned - قائمة المحظورين\n` +
      `/list trial - قائمة في التجربة\n\n` +
      `<b>البرودكاست:</b>\n` +
      `/broadcast رسالتك - إرسال لكل الطلاب`
    );
    return;
  }

  // /stats
  if (text === "/stats") {
    const snap = await db.ref("users").get();
    if (!snap.exists()) {
      await sendMessage(ADMIN_BOT_TOKEN, chatId, "📊 لا يوجد مستخدمون.");
      return;
    }
    const users = Object.values(snap.val());
    const now = Date.now();
    const active = users.filter(u => u.status === "active" && u.subscriptionEnd > now).length;
    const trial = users.filter(u => u.status === "trial" && (now - u.trialStart) < TRIAL_DURATION_MS).length;
    const expired = users.filter(u => 
      (u.status === "trial" && (now - u.trialStart) >= TRIAL_DURATION_MS) ||
      (u.status === "active" && u.subscriptionEnd <= now)
    ).length;
    const banned = users.filter(u => u.banned).length;

    await sendMessage(
      ADMIN_BOT_TOKEN, chatId,
      `📊 <b>إحصائيات الخُلاصة</b>\n\n` +
      `👥 إجمالي المستخدمين: <b>${users.length}</b>\n` +
      `✅ مشتركون نشطون: <b>${active}</b>\n` +
      `⏱ في التجربة المجانية: <b>${trial}</b>\n` +
      `❌ منتهي الصلاحية: <b>${expired}</b>\n` +
      `🚫 محظورون: <b>${banned}</b>`
    );
    return;
  }

  // /activate @username days
  if (text.startsWith("/activate ")) {
    const parts = text.split(" ");
    const targetUsername = parts[1]?.replace("@", "").trim();
    const days = parseInt(parts[2]) || 30;

    const snap = await db.ref("users").orderByChild("username").equalTo(targetUsername).get();
    if (!snap.exists()) {
      await sendMessage(ADMIN_BOT_TOKEN, chatId, `❌ المستخدم @${targetUsername} غير موجود.`);
      return;
    }

    const subscriptionEnd = Date.now() + days * 24 * 60 * 60 * 1000;
    const endDate = new Date(subscriptionEnd).toLocaleDateString("ar-EG");
    const updates = {};
    snap.forEach(child => {
      updates[`users/${child.key}/status`] = "active";
      updates[`users/${child.key}/subscriptionEnd`] = subscriptionEnd;
      updates[`users/${child.key}/banned`] = false;
    });
    await db.ref().update(updates);

    // Notify user
    let userIdToNotify;
    snap.forEach(child => { userIdToNotify = child.val().userId; });
    if (userIdToNotify) {
      await sendMessage(CLIENT_BOT_TOKEN, userIdToNotify,
        `🎉 <b>تم تفعيل اشتراكك!</b>\n\n` +
        `✅ اشتراكك نشط لمدة <b>${days} يوم</b>\n` +
        `📅 ينتهي في: <b>${endDate}</b>\n\n` +
        `ابعت /start للبدء 🚀`
      );
    }

    await sendMessage(ADMIN_BOT_TOKEN, chatId,
      `✅ تم تفعيل @${targetUsername}\n📅 ينتهي: ${endDate} (${days} يوم)`
    );
    return;
  }

  // /ban @username
  if (text.startsWith("/ban ")) {
    const targetUsername = text.replace("/ban ", "").replace("@", "").trim();
    const snap = await db.ref("users").orderByChild("username").equalTo(targetUsername).get();
    if (!snap.exists()) {
      await sendMessage(ADMIN_BOT_TOKEN, chatId, `❌ المستخدم @${targetUsername} غير موجود.`);
      return;
    }
    const updates = {};
    snap.forEach(child => { updates[`users/${child.key}/banned`] = true; });
    await db.ref().update(updates);
    await sendMessage(ADMIN_BOT_TOKEN, chatId, `🚫 تم حظر @${targetUsername}`);
    return;
  }

  // /unban @username
  if (text.startsWith("/unban ")) {
    const targetUsername = text.replace("/unban ", "").replace("@", "").trim();
    const snap = await db.ref("users").orderByChild("username").equalTo(targetUsername).get();
    if (!snap.exists()) {
      await sendMessage(ADMIN_BOT_TOKEN, chatId, `❌ المستخدم @${targetUsername} غير موجود.`);
      return;
    }
    const updates = {};
    snap.forEach(child => { updates[`users/${child.key}/banned`] = false; });
    await db.ref().update(updates);
    await sendMessage(ADMIN_BOT_TOKEN, chatId, `✅ تم رفع الحظر عن @${targetUsername}`);
    return;
  }

  // /info @username
  if (text.startsWith("/info ")) {
    const targetUsername = text.replace("/info ", "").replace("@", "").trim();
    const snap = await db.ref("users").orderByChild("username").equalTo(targetUsername).get();
    if (!snap.exists()) {
      await sendMessage(ADMIN_BOT_TOKEN, chatId, `❌ المستخدم @${targetUsername} غير موجود.`);
      return;
    }
    snap.forEach(child => {
      const u = child.val();
      const now = Date.now();
      let statusText = "";
      if (u.banned) statusText = "🚫 محظور";
      else if (u.status === "active" && u.subscriptionEnd > now) {
        statusText = `✅ مشترك - ينتهي ${new Date(u.subscriptionEnd).toLocaleDateString("ar-EG")}`;
      } else if (u.status === "trial" && (now - u.trialStart) < TRIAL_DURATION_MS) {
        statusText = "⏱ في التجربة المجانية";
      } else statusText = "❌ منتهي الصلاحية";

      sendMessage(ADMIN_BOT_TOKEN, chatId,
        `👤 <b>معلومات المستخدم</b>\n\n` +
        `الاسم: ${u.firstName || "غير محدد"}\n` +
        `يوزرنيم: @${u.username}\n` +
        `ID: ${u.userId}\n` +
        `الحالة: ${statusText}\n` +
        `انضم في: ${new Date(u.joinedAt).toLocaleDateString("ar-EG")}`
      );
    });
    return;
  }

  // /list active|banned|trial
  if (text.startsWith("/list ")) {
    const filter = text.replace("/list ", "").trim();
    const snap = await db.ref("users").get();
    if (!snap.exists()) {
      await sendMessage(ADMIN_BOT_TOKEN, chatId, "لا يوجد مستخدمون.");
      return;
    }
    const now = Date.now();
    let users = Object.values(snap.val());
    let filtered = [];
    let title = "";

    if (filter === "active") {
      filtered = users.filter(u => u.status === "active" && u.subscriptionEnd > now && !u.banned);
      title = "✅ المشتركون النشطون";
    } else if (filter === "banned") {
      filtered = users.filter(u => u.banned);
      title = "🚫 المحظورون";
    } else if (filter === "trial") {
      filtered = users.filter(u => u.status === "trial" && (now - u.trialStart) < TRIAL_DURATION_MS);
      title = "⏱ في التجربة المجانية";
    }

    if (filtered.length === 0) {
      await sendMessage(ADMIN_BOT_TOKEN, chatId, `${title}\n\nلا يوجد مستخدمون في هذه الفئة.`);
      return;
    }

    let listText = `${title} (${filtered.length})\n\n`;
    filtered.forEach((u, i) => {
      listText += `${i + 1}. @${u.username} - ${u.firstName || ""}\n`;
    });
    await sendMessage(ADMIN_BOT_TOKEN, chatId, listText);
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
    let sent = 0, failed = 0;
    for (const user of users) {
      if (user.banned) continue;
      try {
        await sendMessage(CLIENT_BOT_TOKEN, user.userId,
          `📢 <b>إعلان من الخُلاصة:</b>\n\n${broadcastMsg}`
        );
        sent++;
      } catch (e) { failed++; }
    }
    await sendMessage(ADMIN_BOT_TOKEN, chatId,
      `📢 <b>تم الإرسال</b>\n✅ وصل لـ: ${sent}\n❌ فشل: ${failed}`
    );
    return;
  }

  // Unknown command
  await sendMessage(ADMIN_BOT_TOKEN, chatId, "❓ أمر غير معروف. ابعت /start لقائمة الأوامر.");
}

// =================== MAIN HANDLER ===================
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).send("الخُلاصة Bot is running ✅");
  }
  try {
    const path = req.url || "";
    const update = req.body;
    if (path.includes("/api/client")) await handleClientBot(update);
    else if (path.includes("/api/admin")) await handleAdminBot(update);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(200).json({ ok: false });
  }
};
    
