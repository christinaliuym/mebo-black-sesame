/* ============================================================
   MEBO 黑芝麻丸 · Interactions
   - Bilingual toggle (zh default / en)
   - Cart drawer + mock checkout
   - Smart Q&A chat widget
   - Nav, reveal-on-scroll
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- i18n ---------------- */
  // Default content in the HTML is Chinese; data-en holds the English.
  var lang = "zh";

  function applyLang(next) {
    lang = next;
    document.documentElement.lang = next;
    document.querySelectorAll("[data-en]").forEach(function (el) {
      if (!el.dataset.zh) el.dataset.zh = el.textContent; // capture original once
      el.textContent = next === "en" ? el.dataset.en : el.dataset.zh;
    });
    // placeholders
    setPlaceholder("chatInput", next === "en" ? "Type your question…" : "输入您的问题…");
    var byNameInputs = {
      coName: ["Your full name", "请输入姓名"],
      coEmail: ["you@email.com", "请输入邮箱"],
      coAddr: ["Street, City, State, ZIP", "街道、城市、州、邮编"]
    };
    Object.keys(byNameInputs).forEach(function (id) {
      setPlaceholder(id, byNameInputs[id][next === "en" ? 0 : 1]);
    });
    document.getElementById("langToggle").textContent = next === "en" ? "中文" : "EN";
    renderCart(); // re-render cart labels in new language
  }
  function setPlaceholder(id, val) {
    var el = document.getElementById(id);
    if (el) el.placeholder = val;
  }
  document.getElementById("langToggle").addEventListener("click", function () {
    applyLang(lang === "zh" ? "en" : "zh");
  });

  /* ---------------- Nav ---------------- */
  var nav = document.getElementById("nav");
  window.addEventListener("scroll", function () {
    nav.classList.toggle("scrolled", window.scrollY > 20);
  });
  var burger = document.getElementById("navBurger");
  var navLinks = document.getElementById("navLinks");
  burger.addEventListener("click", function () { navLinks.classList.toggle("open"); });
  navLinks.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { navLinks.classList.remove("open"); });
  });

  /* ---------------- Reveal on scroll ---------------- */
  var revealEls = document.querySelectorAll(
    ".section-head, .ingredient, .benefit, .nutri-wrap, .sci-item, .stat, .co-card, .uni-card, .plan, .philosophy-quote"
  );
  revealEls.forEach(function (el) { el.classList.add("reveal"); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(function (el) { io.observe(el); });

  /* ---------------- Cart ---------------- */
  var FREE_SHIP = 49;
  var cart = []; // {id, name, nameEn, price, qty}

  function fmt(n) { return "$" + n.toFixed(2); }

  function addToCart(item) {
    var found = cart.find(function (c) { return c.id === item.id; });
    if (found) found.qty += 1;
    else cart.push({ id: item.id, name: item.name, nameEn: item.nameEn, price: item.price, qty: 1 });
    renderCart();
    openCart();
    bumpCart();
  }
  function changeQty(id, delta) {
    var item = cart.find(function (c) { return c.id === id; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(function (c) { return c.id !== id; });
    renderCart();
  }
  function removeItem(id) {
    cart = cart.filter(function (c) { return c.id !== id; });
    renderCart();
  }
  function cartTotal() {
    return cart.reduce(function (s, c) { return s + c.price * c.qty; }, 0);
  }
  function cartCount() {
    return cart.reduce(function (s, c) { return s + c.qty; }, 0);
  }

  var elItems = document.getElementById("cartItems");
  var elEmpty = document.getElementById("cartEmpty");
  var elFoot = document.getElementById("cartFoot");

  function renderCart() {
    document.getElementById("cartCount").textContent = cartCount();
    elItems.innerHTML = "";
    if (cart.length === 0) {
      elEmpty.style.display = "flex";
      elFoot.style.display = "none";
    } else {
      elEmpty.style.display = "none";
      elFoot.style.display = "block";
      cart.forEach(function (c) {
        var name = lang === "en" ? c.nameEn : c.name;
        var row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML =
          '<div class="ci-thumb"></div>' +
          '<div class="ci-info">' +
            '<div class="ci-name">' + name + "</div>" +
            '<div class="ci-price">' + fmt(c.price) + "</div>" +
            '<div class="ci-controls">' +
              '<button class="qty-btn" data-act="dec" data-id="' + c.id + '">−</button>' +
              '<span class="ci-qty">' + c.qty + "</span>" +
              '<button class="qty-btn" data-act="inc" data-id="' + c.id + '">+</button>' +
              '<button class="ci-remove" data-act="rm" data-id="' + c.id + '">' +
                (lang === "en" ? "Remove" : "移除") + "</button>" +
            "</div>" +
          "</div>";
        elItems.appendChild(row);
      });
    }
    document.getElementById("cartTotal").textContent = fmt(cartTotal());
    document.getElementById("coTotal").textContent = fmt(cartTotal());
    // shipping note
    var note = document.getElementById("shipNote");
    var remain = FREE_SHIP - cartTotal();
    if (cart.length === 0) { note.textContent = ""; }
    else if (remain > 0) {
      note.textContent = lang === "en"
        ? "Add " + fmt(remain) + " more for free shipping."
        : "再买 " + fmt(remain) + " 即可免运费。";
    } else {
      note.textContent = lang === "en" ? "🎉 You've unlocked free shipping!" : "🎉 已享受免运费！";
    }
  }

  // delegate cart controls
  elItems.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var id = btn.dataset.id;
    if (btn.dataset.act === "inc") changeQty(id, 1);
    else if (btn.dataset.act === "dec") changeQty(id, -1);
    else if (btn.dataset.act === "rm") removeItem(id);
  });

  // add-to-cart buttons
  document.querySelectorAll(".add-to-cart").forEach(function (b) {
    b.addEventListener("click", function () {
      addToCart({
        id: b.dataset.id,
        name: b.dataset.name,
        nameEn: b.dataset.nameEn,
        price: parseFloat(b.dataset.price)
      });
    });
  });

  function bumpCart() {
    var c = document.getElementById("cartCount");
    c.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.5)" }, { transform: "scale(1)" }],
      { duration: 320 }
    );
  }

  /* ---------- Cart drawer open/close ---------- */
  var drawer = document.getElementById("cartDrawer");
  var overlay = document.getElementById("overlay");
  function openCart() { drawer.classList.add("open"); overlay.classList.add("show"); }
  function closeCart() { drawer.classList.remove("open"); overlay.classList.remove("show"); }
  document.getElementById("cartBtn").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  /* ---------------- Checkout ---------------- */
  var modal = document.getElementById("checkoutModal");
  document.getElementById("checkoutBtn").addEventListener("click", function () {
    if (cart.length === 0) return;
    closeCart();
    modal.classList.add("show");
    document.getElementById("checkoutForm").hidden = false;
    document.getElementById("checkoutSuccess").hidden = true;
  });
  function closeModal() { modal.classList.remove("show"); }
  document.getElementById("checkoutClose").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.getElementById("placeOrder").addEventListener("click", function () {
    // simple required-field check
    var name = document.getElementById("coName").value.trim();
    var email = document.getElementById("coEmail").value.trim();
    if (!name || !email) {
      alert(lang === "en" ? "Please fill in your name and email." : "请填写姓名和邮箱。");
      return;
    }
    document.getElementById("checkoutForm").hidden = true;
    document.getElementById("checkoutSuccess").hidden = false;
    cart = [];
    renderCart();
  });
  document.getElementById("successClose").addEventListener("click", closeModal);

  /* ---------------- Chat widget ---------------- */
  var chatPanel = document.getElementById("chatPanel");
  var chatFab = document.getElementById("chatFab");
  var chatBody = document.getElementById("chatBody");
  var chatQuick = document.getElementById("chatQuick");

  function openChat() {
    chatPanel.classList.add("open");
    chatFab.style.display = "none";
    if (chatBody.childElementCount === 0) {
      botSay(lang === "en"
        ? "Hi! I'm the MEBO Wellness Concierge 🌿 Ask me anything about Black Sesame Wellness Bites."
        : "您好！我是美宝养生客服 🌿 关于黑芝麻丸，您可以随时问我～");
      renderQuick();
    }
  }
  function closeChat() { chatPanel.classList.remove("open"); chatFab.style.display = "flex"; }
  chatFab.addEventListener("click", openChat);
  document.getElementById("chatMin").addEventListener("click", closeChat);
  document.getElementById("openChatFoot").addEventListener("click", function (e) {
    e.preventDefault(); openChat();
  });

  // Knowledge base: keyword -> {zh, en}
  var KB = [
    {
      k: ["成分", "原料", "配料", "ingredient", "what's in", "contain", "made"],
      a: {
        zh: "黑芝麻丸由六种古老黑色超级食材制成：黑芝麻、黑大豆、黑米、黑枸杞、桑椹、黄精，0 添加糖。含有：芝麻、大豆。",
        en: "Our bites are made from six ancient black superfoods: black sesame, black soybean, black rice, black goji berry, mulberry & polygonatum — with 0g added sugar. Contains: sesame, soy."
      }
    },
    {
      k: ["功效", "好处", "作用", "benefit", "good for", "help", "效果"],
      a: {
        zh: "主要养护四方面：① 秀发活力（黑芝麻+黄精）② 养颜抗氧（黑枸杞+桑椹）③ 骨骼健康（高钙，每份 517mg）④ 每日元气（植物蛋白+膳食纤维）。",
        en: "Four key benefits: ① Hair vitality (sesame + polygonatum) ② Beauty & antioxidants (goji + mulberry) ③ Bone health (calcium 517mg/serving) ④ Daily energy (plant protein + fiber)."
      }
    },
    {
      k: ["怎么吃", "食用", "用量", "how to", "how much", "dosage", "eat", "serving"],
      a: {
        zh: "建议每日食用 1–2 颗，可搭配茶饮或咖啡，也可作为日常营养点心随时享用。",
        en: "Enjoy 1–2 bites daily — perfect with tea or coffee, or as a nourishing snack anytime."
      }
    },
    {
      k: ["糖", "热量", "卡路里", "sugar", "calorie", "keto", "减肥", "diet"],
      a: {
        zh: "每份（2 颗 / 14g）能量 80 卡，0 添加糖，膳食纤维 8.5g，植物蛋白 15.8g，是相对健康的养生零食。",
        en: "Per serving (2 bites / 14g): 80 calories, 0g added sugar, 8.5g fiber, 15.8g plant protein — a genuinely wholesome wellness snack."
      }
    },
    {
      k: ["素", "vegan", "麸质", "gluten", "过敏", "allergen", "allergy"],
      a: {
        zh: "100% 纯素、无麸质、0 添加糖。过敏提示：含芝麻与大豆。",
        en: "100% vegan, gluten-free and 0g added sugar. Allergen note: contains sesame and soy."
      }
    },
    {
      k: ["价格", "多少钱", "price", "cost", "套装", "订阅", "bundle", "subscribe"],
      a: {
        zh: "单袋 $7.99（140g/约18颗）；三袋套装 $21.99（立省10%）；月度订阅每月3袋约 $19.17（立省20%，随时取消）。",
        en: "Single bag $7.99 (140g / ~18 bites); 3-bag bundle $21.99 (save 10%); monthly subscription ~$19.17 for 3 bags (save 20%, cancel anytime)."
      }
    },
    {
      k: ["运费", "配送", "发货", "ship", "delivery", "shipping"],
      a: {
        zh: "美国境内订单满 $49 免运费，未满收取标准运费。下单后通常 2–5 个工作日内发货。",
        en: "Free U.S. shipping on orders over $49 (standard rate applies below that). Orders typically ship within 2–5 business days."
      }
    },
    {
      k: ["再生", "徐荣祥", "技术", "regenerat", "science", "xu rongxiang", "mebo"],
      a: {
        zh: "黑芝麻丸源于美宝「人体再生复原科学」——由徐荣祥教授创立，历经 35+ 年。美宝与哈佛医学院、南加大 USC、加州州立大学洛杉矶分校等设有再生科学研究中心。",
        en: "Our bites are rooted in MEBO's Human Body Regenerative Restoration Science — founded by Prof. Xu Rongxiang over 35+ years. MEBO has regenerative-science centers with Harvard Medical School, USC and Cal State LA."
      }
    },
    {
      k: ["退", "退款", "refund", "return", "退货"],
      a: {
        zh: "未开封产品支持 30 天内退换，如有质量问题请联系 service@mebolifeusa.com 或致电 1-800-988-6326。",
        en: "Unopened products can be returned within 30 days. For any quality issue, email service@mebolifeusa.com or call 1-800-988-6326."
      }
    },
    {
      k: ["联系", "客服", "电话", "邮箱", "contact", "phone", "email", "human"],
      a: {
        zh: "您可以邮件 service@mebolifeusa.com 或致电 1-800-988-6326（美国），我们的团队很乐意为您服务。",
        en: "Reach us at service@mebolifeusa.com or call 1-800-988-6326 (U.S.). Our team is happy to help!"
      }
    }
  ];

  var QUICK = [
    { zh: "有哪些成分？", en: "What's in it?" },
    { zh: "有什么功效？", en: "What are the benefits?" },
    { zh: "怎么吃？", en: "How do I use it?" },
    { zh: "价格和套装", en: "Pricing & bundles" },
    { zh: "运费多少？", en: "Shipping?" },
    { zh: "再生科学是什么？", en: "What's regenerative science?" }
  ];

  function renderQuick() {
    chatQuick.innerHTML = "";
    QUICK.forEach(function (q) {
      var chip = document.createElement("button");
      chip.className = "quick-chip";
      chip.textContent = lang === "en" ? q.en : q.zh;
      chip.addEventListener("click", function () {
        userSay(chip.textContent);
        respond(chip.textContent);
      });
      chatQuick.appendChild(chip);
    });
  }

  function botSay(text) {
    var m = document.createElement("div");
    m.className = "msg bot";
    m.textContent = text;
    chatBody.appendChild(m);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  function userSay(text) {
    var m = document.createElement("div");
    m.className = "msg user";
    m.textContent = text;
    chatBody.appendChild(m);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function respond(text) {
    var q = text.toLowerCase();
    var hit = KB.find(function (item) {
      return item.k.some(function (kw) { return q.indexOf(kw.toLowerCase()) !== -1; });
    });
    setTimeout(function () {
      if (hit) {
        botSay(lang === "en" ? hit.a.en : hit.a.zh);
      } else {
        botSay(lang === "en"
          ? "Great question! For anything I can't answer here, email service@mebolifeusa.com or call 1-800-988-6326. Meanwhile, try one of the topics above 🌿"
          : "好问题！如需更详细的解答，可邮件 service@mebolifeusa.com 或致电 1-800-988-6326。也可以点上方的常见问题哦 🌿");
      }
    }, 450);
  }

  document.getElementById("chatForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = document.getElementById("chatInput");
    var val = input.value.trim();
    if (!val) return;
    userSay(val);
    input.value = "";
    respond(val);
  });

  /* ---------------- Video autoplay on scroll ---------------- */
  var videos = document.querySelectorAll("video[data-autoplay]");
  if (videos.length) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.4 });
    videos.forEach(function (v) { vio.observe(v); });
  }
  // sound toggle (one card unmutes at a time)
  document.querySelectorAll(".video-sound").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var v = btn.parentElement.querySelector("video");
      var unmute = v.muted;
      // mute all others first
      document.querySelectorAll("video[data-autoplay]").forEach(function (other) {
        other.muted = true;
        var b = other.parentElement.querySelector(".video-sound");
        if (b) b.textContent = "🔊";
      });
      v.muted = !unmute;
      btn.textContent = v.muted ? "🔊" : "🔈";
      if (!v.muted) v.play().catch(function () {});
    });
  });

  /* ---------------- init ---------------- */
  renderCart();
})();
