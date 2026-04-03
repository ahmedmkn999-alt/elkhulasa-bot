const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "elkhulasa-bot",
      clientEmail: "firebase-adminsdk-fbsvc@elkhulasa-bot.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCirwtFxsjWI+CS\njYniwfTnB1atoqcHfj+uP/KAtFteLT1eKUEUnM06lN2mdsdv7eHdQY39c9WTD4MX\nIuaG66yv4o2Xmc29nAmHRfqJeD7wMIrNQcBzGBbTMcHWhqZPhHwkp0I74jHtLRMz\nfToGPGg1m7x3oR1TlSXHsnDIzJhNMyJJN2w/9vEcqWkKlMZS/iUHciru+mqsszLf\n7bLk3irp0Q0Pd0+wFpsC/dT6wFdIvkc3baalRrs1GfRiwTY+c1yKUMO+7RE3ZWHU\nDP7XgzV1Ml9Fm45Ek2j4r94CpJYPRL6R46PuwwBi5eBIWmv2OBV0dBlHz8rEeqx5\nsaJskw4DAgMBAAECggEAGhqJQ1h6uGBIXsD8S4OAvE4BUATbKp4iMgphFdrFaw6f\nnAt1kwz391A/YpWzjwJgwrkL7gvB94IT2vNcLHEGJAYaXyWBjaJLJca07+L4rQoK\nSOt7KbHx/lBWazREMlqD9aOq7TibIen2J0W5jkTvbw6pW+62acdy/ks5GAHlkZlY\nhxSCaPYjoNgIUBolO8fKfBYTGOKIfmnViGXLkthlxp2pRz42H6mJAD+74qNebIZA\nyPAF/N3o2xrBdwl7Lhz4R+raW+BMLGfUiG+lng8i2vOoKFgG+3jkaCg9x/aAsx7Y\n+/n99AOtpPH/+kaW+vd6DktUtB7VgsHy/OhhYByVHQKBgQDNOWWLwDzmRdAvlFM9\nRXz/eGy+yanQs0WdD/iC2ZzA3YkMRFcL4kFMaRDAdTAfNTusBfYdy8xRdPUq+BFr\nj5G27vi406pK5uWG8xc1SswsT79b9VN2jCGu56UyXmDNrzLXvrXybBN+hrfO22Qh\nWOQuvBhDpjIV2fs3NTYKvVQ75wKBgQDK7zKYzDgdbCTQRno1bZMKmKsNWasDzuQE\nZxAHJGhrPIh4H4ccQHRIe+RJ4y5aisnh+C9/aiy7ubOxpDrLzwx3ib91WLA+1n10\nW9ErD0Axen7et1BqHRQKe4Ya+7LFs9huMwz+IC+BY/XkPGsDBl7BEbmjEME0nZVO\nG/YAKoq5hQKBgETkL6JqNgdXCDvwnsDCwuM/mcGyEL9ubr/6zIGga26S756ekln6\n6dCstGLm8/CF/jIRDj2SXFQ73tE91Rs2ZsPyFKx24YOjXwmeMPxCz6dQXfyQriPt\nhqEgQeRWqkhht7+U1Z87iI/AyZM3MrW/EVpe6gZLlCShuCMgSbPxOoWhAoGBAJgZ\nb/LWHbjvtSflqvMgjXUDuDDpZCQWjRA/ruOrhhfZ5u8hskKajI1HTnOSsstp+qZD\nPlZhXeXV6bjbPrZDGTT/KWDqeC6g1KbBqqR7acGr7is/eiYOZVb1/i17OSK1CSKP\nYM2XkgOIyGOoZQx/WcWbY2e0xxqIgb9pdZfqSs+BAoGAXfaXHpN6DPQYUW5VT1/L\n+Ox0xb7CwiJ4ZlL/D1CFDKaXwqjXwea1rU4KEzAwaOQc2wiXZoqaTi1IcyIT2hQb\n+aUHLl+US2+KvVZQrwl3tNfjnxSeB4nUtCo5qTOITRnIOyqWEWgSb6esEOiiBdYG\nGeRTTy08ZCv/yb/m3ngAnp8=\n-----END PRIVATE KEY-----\n",
    }),
    databaseURL: "https://elkhulasa-bot-default-rtdb.firebaseio.com",
  });
}

const db = admin.database();
module.exports = db;
