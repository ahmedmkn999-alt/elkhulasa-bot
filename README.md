# 🎓 الخُلاصة — بوت مراجعات الثانوية العامة

بوت تيليجرام لإدارة مراجعات الثانوية العامة مع نظام اشتراكات وتجربة مجانية.

---

## 📁 هيكل المشروع

```
elkhulasa-bot/
├── api/
│   └── index.js          ← الكود الرئيسي للبوتات الثلاثة
├── firebase.js            ← اتصال Firebase
├── setup-webhooks.js      ← سكريبت ربط البوتات بـ Vercel
├── check-bots.js          ← سكريبت فحص حالة البوتات
├── package.json
├── vercel.json
├── .env.example           ← نموذج المتغيرات المطلوبة
└── .gitignore
```

---

## ⚙️ خطوات الإعداد على Vercel

### 1️⃣ ارفع المشروع على GitHub
```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/username/elkhulasa-bot.git
git push -u origin main
```

### 2️⃣ ادخل على vercel.com وربط الـ repo

### 3️⃣ أضف متغيرات البيئة في Vercel
اذهب إلى: **Settings → Environment Variables** وأضف:

| المتغير | القيمة |
|---------|--------|
| `CLIENT_BOT_TOKEN` | توكن بوت الطلاب |
| `ADMIN_BOT_TOKEN` | توكن بوت الأدمن |
| `VIDEO_BOT_TOKEN` | توكن بوت الفيديوهات |
| `ADMIN_ID` | رقم ID تيليجرام بتاعك |
| `ADMIN_USERNAME` | @YourUsername |
| `FIREBASE_PROJECT_ID` | elkhulasa-bot |
| `FIREBASE_CLIENT_EMAIL` | ... من Firebase |
| `FIREBASE_PRIVATE_KEY` | ... من Firebase |
| `FIREBASE_DATABASE_URL` | https://elkhulasa-bot-default-rtdb.firebaseio.com |

> ⚠️ **ملاحظة FIREBASE_PRIVATE_KEY:** لازم تحطها بين علامات تنصيص مزدوجة `"..."` وتخلي الـ `\n` زي ما هي.

### 4️⃣ بعد الـ Deploy، اربط الـ Webhooks
```bash
npm install
node setup-webhooks.js https://your-project.vercel.app
```

### 5️⃣ تحقق إن كل حاجة شغالة
```bash
node check-bots.js
```

---

## 🤖 البوتات الثلاثة

### 📱 بوت الطلاب (CLIENT)
- `/start` — الصفحة الرئيسية واختيار المادة
- اختيار المدرس والدرس
- نظام تجربة مجانية 30 دقيقة
- نظام اشتراك مدفوع

### 👑 بوت الأدمن (ADMIN)
| الأمر | الوصف |
|-------|--------|
| `/stats` | إحصائيات كاملة |
| `/activate @user 30` | تفعيل اشتراك |
| `/ban @user` | حظر مستخدم |
| `/unban @user` | رفع حظر |
| `/resettrial @user` | إعادة تجربة مجانية |
| `/info @user` | معلومات مستخدم |
| `/list active` | المشتركون |
| `/list banned` | المحظورون |
| `/broadcast رسالة` | إرسال للجميع |

### 🎬 بوت الفيديوهات (VIDEO)
| الأمر | الوصف |
|-------|--------|
| `/add مادة \| مدرس \| درس \| عنوان \| رابط` | إضافة فيديو |
| `/list` | عرض كل المحتوى |
| `/delete مادة \| مدرس \| درس \| عنوان` | حذف فيديو |

**أسماء المواد:** `arabic` `english` `physics` `chemistry` `biology` `math`

---

## 📌 حاجات ناقصة تقدر تضيفها

- [ ] تحديد عدد المستخدمين في صفحة `content.js`
- [ ] دفع أوتوماتيك (Vodafone Cash / Fawry)
- [ ] إحصائيات يومية / أسبوعية تتبعت
- [ ] رابط لوحة التحكم الويب

---

## 🔐 الأمان

- التوكنز والـ Firebase key محفوظين كـ Environment Variables مش في الكود
- ملف `.env` مضاف لـ `.gitignore`
- كل أوامر الأدمن محمية بفحص الـ `ADMIN_ID`
