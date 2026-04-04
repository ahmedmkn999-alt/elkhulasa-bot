const axios = require("axios");
const db = require("../firebase");

// =================== CONFIG ===================
const CLIENT_BOT_TOKEN = process.env.CLIENT_BOT_TOKEN;
const ADMIN_BOT_TOKEN  = process.env.ADMIN_BOT_TOKEN;
const VIDEO_BOT_TOKEN  = process.env.VIDEO_BOT_TOKEN;
const ADMIN_ID         = parseInt(process.env.ADMIN_ID);
const ADMIN_USERNAME   = process.env.ADMIN_USERNAME || "@Ahmedddd50";
const TRIAL_DURATION_MS = 30 * 60 * 1000; // 30 دقيقة

// =================== SUBJECTS ===================
const SUBJECTS = {
  arabic:    { name: "اللغة العربية 📚",    teachers: ["أ. محمد صلاح"] },
  english:   { name: "اللغة الإنجليزية 🌍", teachers: ["أ. انجلشاوي", "أ. مي مجدي"] },
  physics:   { name: "الفيزياء ⚡",         teachers: ["أ. محمد عبد المعبود", "د. كيرلس", "م. محمود مجدي"] },
  chemistry: { name: "الكيمياء 🧪",         teachers: ["أ. خالد صقر", "أ. محمد عبد الجواد", "د. جون جيهاد"] },
  biology:   { name: "الأحياء 🧬",          teachers: ["د. أحمد الجوهري", "د. جيوم ماجد"] },
  math:      { name: "الرياضيات 📐",        teachers: ["أ. لطفي الزهران"] },
};

// =================== HELPERS ===================
async function send(token, chatId, text, extra = {}) {
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId, text, parse_mode: "HTML", ...extra,
    });
  } catch (e) {
    console.error("send error:", e.response?.data || e.message);
  }
}

async function answerCB(token, id) {
  try {
    await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      callback_query_id: id,
    });
  } catch {}
}

async function getUser(userId) {
  const snap = await db.ref(`users/${userId}`).get();
  return snap.exists() ? snap.val() : null;
}

async function saveUser(userId, username, firstName) {
  await db.ref(`users/${userId}`).set({
    userId,
    username:   username  || "unknown",
    firstName:  firstName || "",
    status:     "trial",
    trialStart: Date.now(),
    joinedAt:   Date.now(),
    banned:     false,
  });
}

function hasAccess(user) {
  if (user.banned) return false;
  if (user.status === "trial")  return Date.now() - user.trialStart < TRIAL_DURATION_MS;
  if (user.status === "active") return user.subscriptionEnd > Date.now();
  return false;
}

function trialLeft(user) {
  const ms = TRIAL_DURATION_MS - (Date.now() - user.trialStart);
  const m  = Math.floor(ms / 60000);
  const s  = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${m}:${s}`;
}

// =================== KEYBOARDS ===================
function subjectsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📚 اللغة العربية",    callback_data: "sub_arabic"    },
        { text: "🌍 اللغة الإنجليزية", callback_data: "sub_english"   },
      ],
      [
        { text: "⚡ الفيزياء",  callback_data: "sub_physics"   },
        { text: "🧪 الكيمياء", callback_data: "sub_chemistry" },
      ],
      [
        { text: "🧬 الأحياء",      callback_data: "sub_biology" },
        { text: "📐 الرياضيات", callback_data: "sub_math"    },
      ],
    ],
  };
}

function teachersKeyboard(subjectKey) {
  const teachers = SUBJECTS[subjectKey].teachers;
  const rows = teachers.map(t => [{ text: t, callback_data: `teacher_${subjectKey}_${t}` }]);
  rows.push([{ text: "🔙 رجوع", callback_data: "back_subjects" }]);
  return { inline_keyboard: rows };
}

async function lessonsKeyboard(subjectKey, teacherName) {
  const snap = await db.ref(`content/${subjectKey}/${teacherName}`).get();
  if (!snap.exists()) return null;
  const lessons = snap.val();
  const rows = Object.keys(lessons).map(lessonName => [{
    text: `📖 ${lessonName}`,
    callback_data: `lesson_${subjectKey}_${encodeTeacher(teacherName)}_${lessonName}`,
  }]);
  rows.push([{ text: "🔙 رجوع", callback_data: `sub_${subjectKey}` }]);
  return { inline_keyboard: rows };
}

function encodeTeacher(name) {
  return Buffer.from(name).toString("base64").replace(/=/g, "");
}

function decodeTeacher(encoded) {
  const pad = encoded.length % 4 === 0 ? "" : "=".repeat(4 - (encoded.length % 4));
  return Buffer.from(encoded + pad, "base64").toString("utf8");
}

// =================== CLIENT BOT ===================
async function handleClient(update) {
  const msg = update.message;
  const cb  = update.callback_query;

  // ---------- TEXT MESSAGES ----------
  if (msg) {
    const { id: chatId }                        = msg.chat;
    const { id: userId, username, first_name }  = msg.from;
    const text = msg.text || "";

    let user = await getUser(userId);
    if (!user) {
      await saveUser(userId, username, first_name);
      user = await getUser(userId);
    }
    if (user.banned) {
      await send(CLIENT_BOT_TOKEN, chatId, "🚫 تم حظرك من استخدام البوت.");
      return;
    }

    if (text === "/start") {
      let statusLine = "";
      if (user.status === "trial" && Date.now() - user.trialStart < TRIAL_DURATION_MS) {
        statusLine = `⏱ <b>تجربة مجانية</b> — متبقي: ${trialLeft(user)}`;
      } else if (user.status === "active" && user.subscriptionEnd > Date.now()) {
        statusLine = `✅ <b>مشترك</b> حتى ${new Date(user.subscriptionEnd).toLocaleDateString("ar-EG")}`;
      } else {
        statusLine = `🔒 <b>غير مشترك</b>`;
      }

      await send(
        CLIENT_BOT_TOKEN, chatId,
        `🎓 <b>أهلاً بك في الخُلاصة!</b>\n\n` +
        `هنا تلاقي أفضل مراجعات الثانوية العامة\n` +
        `من نخبة المدرسين — منظمة ومرتبة لك.\n\n` +
        `📌 البوت بيوفرلك:\n` +
        `• مراجعات لكل المواد\n` +
        `• تحديثات مستمرة\n` +
        `• وصول سريع وسهل\n\n` +
        `${statusLine}\n\n` +
        `👇 اختر المادة:`,
        { reply_markup: subjectsKeyboard() }
      );
      return;
    }
  }

  // ---------- CALLBACK QUERIES ----------
  if (cb) {
    const chatId = cb.message.chat.id;
    const userId = cb.from.id;
    const data   = cb.data;
    await answerCB(CLIENT_BOT_TOKEN, cb.id);

    let user = await getUser(userId);
    if (!user) {
      await saveUser(userId, cb.from.username, cb.from.first_name);
      user = await getUser(userId);
    }
    if (user.banned) {
      await send(CLIENT_BOT_TOKEN, chatId, "🚫 تم حظرك من استخدام البوت.");
      return;
    }

    // رجوع للمواد
    if (data === "back_subjects") {
      await send(CLIENT_BOT_TOKEN, chatId, "👇 اختر المادة:", { reply_markup: subjectsKeyboard() });
      return;
    }

    // اختيار مادة
    if (data.startsWith("sub_")) {
      const subKey = data.replace("sub_", "");
      if (!SUBJECTS[subKey]) return;

      if (!hasAccess(user)) {
        await send(CLIENT_BOT_TOKEN, chatId,
          `🔒 <b>انتهت صلاحيتك!</b>\n\n` +
          `للاشتراك بـ <b>100 جنيه مصري</b>\n` +
          `تواصل مع الإدارة: ${ADMIN_USERNAME}`
        );
        return;
      }

      const header = user.status === "trial"
        ? `⏱ متبقي من التجربة: ${trialLeft(user)}\n\n`
        : "";

      await send(CLIENT_BOT_TOKEN, chatId,
        `${header}👨‍🏫 اختر المدرس:`,
        { reply_markup: teachersKeyboard(subKey) }
      );
      return;
    }

    // اختيار مدرس
    if (data.startsWith("teacher_")) {
      const parts       = data.replace("teacher_", "").split("_");
      const subKey      = parts[0];
      const teacherName = parts.slice(1).join("_");

      if (!hasAccess(user)) {
        await send(CLIENT_BOT_TOKEN, chatId,
          `🔒 <b>انتهت صلاحيتك!</b>\n\nللاشتراك تواصل: ${ADMIN_USERNAME}`
        );
        return;
      }

      const kb = await lessonsKeyboard(subKey, teacherName);
      if (!kb) {
        await send(CLIENT_BOT_TOKEN, chatId,
          `📂 <b>${teacherName}</b>\n\n⏳ لم يتم رفع دروس بعد.\nسيتم الإعلان فور الرفع!`,
          { reply_markup: { inline_keyboard: [[{ text: "🔙 رجوع", callback_data: `sub_${subKey}` }]] } }
        );
        return;
      }
      await send(CLIENT_BOT_TOKEN, chatId, `📖 اختر الدرس:`, { reply_markup: kb });
      return;
    }

    // اختيار درس
    if (data.startsWith("lesson_")) {
      const withoutPrefix   = data.replace("lesson_", "");
      const firstUnderscore = withoutPrefix.indexOf("_");
      const subKey          = withoutPrefix.substring(0, firstUnderscore);
      const rest            = withoutPrefix.substring(firstUnderscore + 1);
      const secondUnderscore = rest.indexOf("_");
      const encodedTeacher  = rest.substring(0, secondUnderscore);
      const lessonName      = rest.substring(secondUnderscore + 1);
      const teacherName     = decodeTeacher(encodedTeacher);

      if (!hasAccess(user)) {
        await send(CLIENT_BOT_TOKEN, chatId,
          `🔒 <b>انتهت صلاحيتك!</b>\n\nللاشتراك تواصل: ${ADMIN_USERNAME}`
        );
        return;
      }

      const snap = await db.ref(`content/${subKey}/${teacherName}/${lessonName}`).get();
      if (!snap.exists()) {
        await send(CLIENT_BOT_TOKEN, chatId, "⏳ لم يتم رفع فيديوهات لهذا الدرس بعد.");
        return;
      }

      const videos = snap.val();
      let txt = `🎬 <b>${lessonName}</b>\n👨‍🏫 ${teacherName}\n\n`;
      Object.entries(videos).forEach(([title, url], i) => {
        txt += `${i + 1}. <a href="${url}">${title}</a>\n`;
      });
      await send(CLIENT_BOT_TOKEN, chatId, txt, { disable_web_page_preview: true });
      return;
    }
  }
}

// =================== ADMIN BOT ===================
async function handleAdmin(update) {
  const msg = update.message;
  if (!msg || msg.from.id !== ADMIN_ID) return;

  const chatId = msg.chat.id;
  const text   = msg.text || "";

  // ---- /start ----
  if (text === "/start") {
    await send(ADMIN_BOT_TOKEN, chatId,
      `👑 <b>لوحة تحكم الخُلاصة</b>\n\n` +
      `<b>المستخدمون:</b>\n` +
      `/activate @user 30 — تفعيل لمدة 30 يوم\n` +
      `/ban @user — حظر\n` +
      `/unban @user — رفع حظر\n` +
      `/resettrial @user — إعادة تجربة مجانية\n` +
      `/info @user — معلومات\n\n` +
      `<b>الإحصائيات:</b>\n` +
      `/stats — إحصائيات عامة\n` +
      `/list active — المشتركون\n` +
      `/list banned — المحظورون\n\n` +
      `<b>البرودكاست:</b>\n` +
      `/broadcast رسالتك`
    );
    return;
  }

  // ---- /stats ----
  if (text === "/stats") {
    const snap = await db.ref("users").get();
    if (!snap.exists()) { await send(ADMIN_BOT_TOKEN, chatId, "لا يوجد مستخدمون."); return; }
    const users = Object.values(snap.val());
    const now   = Date.now();
    const active  = users.filter(u => u.status === "active"  && u.subscriptionEnd > now && !u.banned).length;
    const trial   = users.filter(u => u.status === "trial"   && (now - u.trialStart) < TRIAL_DURATION_MS && !u.banned).length;
    const expired = users.filter(u =>
      !u.banned &&
      !(u.status === "active"  && u.subscriptionEnd > now) &&
      !(u.status === "trial"   && (now - u.trialStart) < TRIAL_DURATION_MS)
    ).length;
    const banned  = users.filter(u => u.banned).length;

    await send(ADMIN_BOT_TOKEN, chatId,
      `📊 <b>إحصائيات الخُلاصة</b>\n\n` +
      `👥 الإجمالي:    <b>${users.length}</b>\n` +
      `✅ مشتركون:   <b>${active}</b>\n` +
      `⏱ في التجربة: <b>${trial}</b>\n` +
      `❌ منتهي:      <b>${expired}</b>\n` +
      `🚫 محظورون:  <b>${banned}</b>`
    );
    return;
  }

  // ---- /activate ----
  if (text.startsWith("/activate ")) {
    const parts = text.split(" ");
    const uname = parts[1]?.replace("@", "").trim();
    const days  = parseInt(parts[2]) || 30;

    const snap = await db.ref("users").orderByChild("username").equalTo(uname).get();
    if (!snap.exists()) { await send(ADMIN_BOT_TOKEN, chatId, `❌ @${uname} غير موجود.`); return; }

    const subEnd  = Date.now() + days * 86400000;
    const updates = {};
    let uid;
    snap.forEach(c => {
      updates[`users/${c.key}/status`]          = "active";
      updates[`users/${c.key}/subscriptionEnd`] = subEnd;
      updates[`users/${c.key}/banned`]          = false;
      uid = c.val().userId;
    });
    await db.ref().update(updates);

    if (uid) {
      await send(CLIENT_BOT_TOKEN, uid,
        `🎉 <b>تم تفعيل اشتراكك!</b>\n` +
        `✅ ${days} يوم\n` +
        `📅 ينتهي: ${new Date(subEnd).toLocaleDateString("ar-EG")}\n\n` +
        `ابعت /start 🚀`
      );
    }
    await send(ADMIN_BOT_TOKEN, chatId, `✅ تم تفعيل @${uname} لمدة ${days} يوم`);
    return;
  }

  // ---- /resettrial ----
  if (text.startsWith("/resettrial ")) {
    const uname = text.replace("/resettrial ", "").replace("@", "").trim();
    const snap  = await db.ref("users").orderByChild("username").equalTo(uname).get();
    if (!snap.exists()) { await send(ADMIN_BOT_TOKEN, chatId, `❌ @${uname} غير موجود.`); return; }

    const updates = {};
    let uid;
    snap.forEach(c => {
      updates[`users/${c.key}/status`]     = "trial";
      updates[`users/${c.key}/trialStart`] = Date.now();
      uid = c.val().userId;
    });
    await db.ref().update(updates);

    if (uid) await send(CLIENT_BOT_TOKEN, uid, `🎁 تم تجديد تجربتك المجانية! لديك 30 دقيقة جديدة 🚀`);
    await send(ADMIN_BOT_TOKEN, chatId, `✅ تم إعادة تجربة @${uname}`);
    return;
  }

  // ---- /ban ----
  if (text.startsWith("/ban ")) {
    const uname = text.replace("/ban ", "").replace("@", "").trim();
    const snap  = await db.ref("users").orderByChild("username").equalTo(uname).get();
    if (!snap.exists()) { await send(ADMIN_BOT_TOKEN, chatId, `❌ @${uname} غير موجود.`); return; }

    const updates = {};
    snap.forEach(c => { updates[`users/${c.key}/banned`] = true; });
    await db.ref().update(updates);
    await send(ADMIN_BOT_TOKEN, chatId, `🚫 تم حظر @${uname}`);
    return;
  }

  // ---- /unban ----
  if (text.startsWith("/unban ")) {
    const uname = text.replace("/unban ", "").replace("@", "").trim();
    const snap  = await db.ref("users").orderByChild("username").equalTo(uname).get();
    if (!snap.exists()) { await send(ADMIN_BOT_TOKEN, chatId, `❌ @${uname} غير موجود.`); return; }

    const updates = {};
    snap.forEach(c => { updates[`users/${c.key}/banned`] = false; });
    await db.ref().update(updates);
    await send(ADMIN_BOT_TOKEN, chatId, `✅ تم رفع الحظر عن @${uname}`);
    return;
  }

  // ---- /info ----
  if (text.startsWith("/info ")) {
    const uname = text.replace("/info ", "").replace("@", "").trim();
    const snap  = await db.ref("users").orderByChild("username").equalTo(uname).get();
    if (!snap.exists()) { await send(ADMIN_BOT_TOKEN, chatId, `❌ @${uname} غير موجود.`); return; }

    snap.forEach(c => {
      const u   = c.val();
      const now = Date.now();
      let st;
      if (u.banned) {
        st = "🚫 محظور";
      } else if (u.status === "active" && u.subscriptionEnd > now) {
        st = `✅ مشترك — ينتهي ${new Date(u.subscriptionEnd).toLocaleDateString("ar-EG")}`;
      } else if (u.status === "trial" && (now - u.trialStart) < TRIAL_DURATION_MS) {
        st = `⏱ في التجربة — متبقي ${Math.floor((TRIAL_DURATION_MS - (now - u.trialStart)) / 60000)} دقيقة`;
      } else {
        st = "❌ منتهي";
      }
      send(ADMIN_BOT_TOKEN, chatId,
        `👤 <b>${u.firstName || ""}</b>\n` +
        `@${u.username}\n` +
        `ID: <code>${u.userId}</code>\n` +
        `الحالة: ${st}\n` +
        `انضم: ${new Date(u.joinedAt).toLocaleDateString("ar-EG")}`
      );
    });
    return;
  }

  // ---- /list ----
  if (text.startsWith("/list ")) {
    const filter = text.replace("/list ", "").trim();
    const snap   = await db.ref("users").get();
    if (!snap.exists()) { await send(ADMIN_BOT_TOKEN, chatId, "لا يوجد مستخدمون."); return; }

    const now   = Date.now();
    const users = Object.values(snap.val());
    let filtered, title;

    if (filter === "active") {
      filtered = users.filter(u => u.status === "active" && u.subscriptionEnd > now && !u.banned);
      title = "✅ المشتركون";
    } else if (filter === "banned") {
      filtered = users.filter(u => u.banned);
      title = "🚫 المحظورون";
    } else {
      filtered = users.filter(u => u.status === "trial" && (now - u.trialStart) < TRIAL_DURATION_MS);
      title = "⏱ في التجربة";
    }

    if (!filtered.length) { await send(ADMIN_BOT_TOKEN, chatId, `${title}\n\nلا يوجد.`); return; }
    let txt = `${title} (${filtered.length})\n\n`;
    filtered.forEach((u, i) => { txt += `${i + 1}. @${u.username} — ${u.firstName || ""}\n`; });
    await send(ADMIN_BOT_TOKEN, chatId, txt);
    return;
  }

  // ---- /broadcast ----
  if (text.startsWith("/broadcast ")) {
    const message = text.replace("/broadcast ", "").trim();
    const snap    = await db.ref("users").get();
    if (!snap.exists()) { await send(ADMIN_BOT_TOKEN, chatId, "لا يوجد مستخدمون."); return; }

    const users = Object.values(snap.val());
    let sent = 0, failed = 0;

    for (const u of users) {
      if (u.banned) continue;
      try {
        await send(CLIENT_BOT_TOKEN, u.userId, `📢 <b>إعلان من الخُلاصة:</b>\n\n${message}`);
        sent++;
      } catch {
        failed++;
      }
    }
    await send(ADMIN_BOT_TOKEN, chatId, `📢 انتهى الإرسال\n✅ نجح: ${sent}\n❌ فشل: ${failed}`);
    return;
  }

  await send(ADMIN_BOT_TOKEN, chatId, "❓ أمر غير معروف. ابعت /start للقائمة");
}

// =================== VIDEO ADMIN BOT ===================
async function handleVideoAdmin(update) {
  const msg = update.message;
  if (!msg || msg.from.id !== ADMIN_ID) return;

  const chatId = msg.chat.id;
  const text   = msg.text || "";

  // ---- /start ----
  if (text === "/start") {
    await send(VIDEO_BOT_TOKEN, chatId,
      `🎬 <b>بوت إدارة الفيديوهات</b>\n\n` +
      `لإضافة فيديو:\n` +
      `<code>/add مادة | اسم المدرس | اسم الدرس | عنوان الفيديو | الرابط</code>\n\n` +
      `<b>أسماء المواد:</b>\n` +
      `arabic, english, physics, chemistry, biology, math\n\n` +
      `<b>مثال:</b>\n` +
      `<code>/add physics | أ. محمد عبد المعبود | الكهرباء | الجزء الأول | https://t.me/...</code>\n\n` +
      `أوامر أخرى:\n` +
      `/list — عرض كل المحتوى\n` +
      `/delete مادة | مدرس | درس | عنوان — حذف فيديو`
    );
    return;
  }

  // ---- /add ----
  if (text.startsWith("/add ")) {
    const parts = text.replace("/add ", "").split("|").map(s => s.trim());
    if (parts.length < 5) {
      await send(VIDEO_BOT_TOKEN, chatId,
        "❌ الصيغة غلط!\n\n/add مادة | مدرس | درس | عنوان | رابط"
      );
      return;
    }
    const [subject, teacher, lesson, title, url] = parts;
    if (!SUBJECTS[subject]) {
      await send(VIDEO_BOT_TOKEN, chatId,
        `❌ اسم المادة غلط!\nالمواد الصحيحة: ${Object.keys(SUBJECTS).join(", ")}`
      );
      return;
    }
    await db.ref(`content/${subject}/${teacher}/${lesson}/${title}`).set(url);
    await send(VIDEO_BOT_TOKEN, chatId,
      `✅ <b>تم إضافة الفيديو!</b>\n\n` +
      `📚 المادة:  ${SUBJECTS[subject].name}\n` +
      `👨‍🏫 المدرس:  ${teacher}\n` +
      `📖 الدرس:   ${lesson}\n` +
      `🎬 العنوان: ${title}`
    );
    return;
  }

  // ---- /list ----
  if (text === "/list") {
    const snap = await db.ref("content").get();
    if (!snap.exists()) { await send(VIDEO_BOT_TOKEN, chatId, "لا يوجد محتوى بعد."); return; }

    const content = snap.val();
    let txt = "📋 <b>المحتوى الحالي:</b>\n\n";
    for (const [sub, teachers] of Object.entries(content)) {
      txt += `📚 <b>${SUBJECTS[sub]?.name || sub}</b>\n`;
      for (const [teacher, lessons] of Object.entries(teachers)) {
        txt += `  👨‍🏫 ${teacher}\n`;
        for (const [lesson, videos] of Object.entries(lessons)) {
          txt += `    📖 ${lesson} (${Object.keys(videos).length} فيديو)\n`;
        }
      }
      txt += "\n";
    }
    await send(VIDEO_BOT_TOKEN, chatId, txt);
    return;
  }

  // ---- /delete ----
  if (text.startsWith("/delete ")) {
    const parts = text.replace("/delete ", "").split("|").map(s => s.trim());
    if (parts.length < 4) {
      await send(VIDEO_BOT_TOKEN, chatId, "❌ الصيغة: /delete مادة | مدرس | درس | عنوان");
      return;
    }
    const [subject, teacher, lesson, title] = parts;
    await db.ref(`content/${subject}/${teacher}/${lesson}/${title}`).remove();
    await send(VIDEO_BOT_TOKEN, chatId, `🗑 تم حذف: ${title}`);
    return;
  }

  await send(VIDEO_BOT_TOKEN, chatId, "❓ /start للقائمة");
}

// =================== MAIN HANDLER ===================
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(200).send("الخُلاصة ✅");
  try {
    const path   = req.url || "";
    const update = req.body;
    if      (path.includes("/api/client")) await handleClient(update);
    else if (path.includes("/api/admin"))  await handleAdmin(update);
    else if (path.includes("/api/video"))  await handleVideoAdmin(update);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("handler error:", err);
    res.status(200).json({ ok: false, error: err.message });
  }
};
