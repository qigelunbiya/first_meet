// ========= 基本 DOM =========
const appRoot = document.getElementById("appRoot");
let yesButton = document.getElementById("yes");
let noButton = document.getElementById("no");
let questionText = document.getElementById("question");
let mainImage = document.getElementById("mainImage");

// ========= BGM & 静音 =========
const bgm = document.getElementById("bgm");
const muteToggle = document.getElementById("muteToggle");
let isMuted = false;

function initBgm() {
  if (!bgm || !muteToggle) return;
  // ⭐ 音量这里调（0 ~ 1）
  bgm.volume = 0.2;

  // 尝试自动播放；被拦截的话，第一次点击后再播
  const tryPlay = () => {
    bgm.play().catch(() => {});
  };
  bgm.play().catch(() => {
    const handler = () => {
      tryPlay();
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
    };
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
  });

  muteToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    isMuted = !isMuted;
    bgm.muted = isMuted;
    muteToggle.textContent = isMuted ? "🔈" : "🔊";
  });
}

initBgm();

// ========= 名字拼在问题后面 =========
const params = new URLSearchParams(window.location.search);
let username = params.get("name");

const maxLength = 20;
const safeUsername = username ? username.substring(0, maxLength) : "";

if (username && questionText) {
  questionText.innerText = questionText.innerText + safeUsername;
}

// ========= 「不去」相关逻辑（无限点击版） =========
let clickCount = 0; // 记录点击「不去」的次数

// 「哼，不去😤」按钮的文字变化（带 emoji）
const noTexts = [
  "你认真的吗…😭",
  "要不再想想😱",
  "不许选这个！😫",
  "我伤心了🥹",
  "你这样我会难过哦😔",
  "再给我一次机会嘛🥺",
  "点左边那个好不好😀",
  "拒绝无效！只能同意😆",
];

// ======= 关键：这里填 ngrok 暴露出来的 HTTPS 地址 =======
const API_BASE = "https://supervoluminously-penicillate-malia.ngrok-free.dev";

// ======= 嘘寒问暖的弹窗内容 =======
const careMessages = [
  "有好好吃饭吗？",
  "要好好休息～",
  "记得多喝热水呀🥤",
  "外面有点冷",
  "不要熬夜啦👀",
  "遇到烦心事可以跟我说",
  "每天都开开心心的😊",
  "能和我多聊聊天吗？",
  "手机别玩太晚啦～",
  "心情会变好",
  "可以休息一下噢",
  "加班也不要饿着",
  "最近工作辛苦了",
  "每天都要元气满满",
  "很高兴认识你",
  "久坐不好呀～",
  "早点睡好不好💤",
  "梦想成真",
  "照顾好自己",
  "注意保暖别感冒",
  "会好起来的",
];

// ======= 幸运彩蛋内容（创意 4） =======
const luckyList = [
  "见面那天，我请你喝第一杯饮料 🍹",
  "见面那天，我帮你拍一张你满意的照片 📸",
  "见面那天，我给你带一小份小零食，不好吃你可以现场吐槽 😆",
  "见面那天，我手机尽量收起来，好好听你说话 📵",
  "见面那天，如果你有点迟到也没关系，我会耐心等你 ⏳",
];

// 存问卷 & 心情 & 幸运彩蛋结果
let profileAnswers = {
  q1: null,
  q2: null,
  q3: null,
  mood: null,
  lucky: null,
};

// 「哼，不去😤」点击
noButton.addEventListener("click", function () {
  clickCount++;

  // 使用 log 函数，让增长越来越慢，支持无限点击但不至于飞出屏幕
  const factor = Math.log2(clickCount + 1); // 1, 1.58, 2, 2.32, ...

  // 让「我同意」按钮越来越大
  const yesSize = 1 + factor * 0.7;
  yesButton.style.transform = `scale(${yesSize})`;

  // 把「不去」按钮不断往右挤
  const noOffset = factor * 60;
  noButton.style.transform = `translateX(${noOffset}px)`;

  // 图片和文字往上移动一点
  const moveUp = factor * 25;
  mainImage.style.transform = `translateY(-${moveUp}px)`;
  questionText.style.transform = `translateY(-${moveUp}px)`;

  // No 文案变化
  if (clickCount <= noTexts.length) {
    noButton.innerText = noTexts[clickCount - 1];
  } else {
    noButton.innerText = noTexts[noTexts.length - 1];
  }

  // 图片变化
  if (clickCount === 1) mainImage.src = "images/xinqingbuxing.jpg";
  if (clickCount === 2) mainImage.src = "images/nizhidaoba.jpg";
  if (clickCount === 3) mainImage.src = "images/weiqu.jpg";
  if (clickCount >= 4) mainImage.src = "images/stop.jpg";
});

// ================== 点击「我同意😊」后的三幕 ==================
let agreeStarted = false;

yesButton.addEventListener("click", function () {
  if (agreeStarted) return;
  agreeStarted = true;

  const container = document.querySelector(".container");
  if (container) {
    container.classList.add("container-fade-out");
    setTimeout(() => {
      showFirstScreen();
    }, 450);
  } else {
    showFirstScreen();
  }
});

// 第一幕：中央大字 + 小号提示
function showFirstScreen() {
  appRoot.innerHTML = `
    <div class="first-screen">
      <div class="first-message">耶！你愿意给我一个认识你的机会啦～</div>
      <div class="click-hint first-hint">点击画面继续……</div>
    </div>
  `;
  document.body.style.overflow = "hidden";

  const firstScreen = document.querySelector(".first-screen");
  firstScreen.addEventListener("click", function () {
    showCarePopups();
  });
}

// 第二幕：超多可爱弹窗雨 + 小号提示（点击后逐个淡出，然后进入【问卷】）
function showCarePopups() {
  appRoot.innerHTML = `
    <div class="popup-stage">
      <div class="popup-overlay"></div>
      <div class="click-hint second-hint hidden">点击画面继续……</div>
    </div>
  `;
  document.body.style.overflow = "hidden";

  const overlay = document.querySelector(".popup-overlay");
  const hint = document.querySelector(".second-hint");
  const stage = document.querySelector(".popup-stage");

  const POPUP_COUNT = 140;   // 弹窗数量
  const POPUP_INTERVAL = 35; // 弹出间隔，越小越快

  const pastelColors = [
    "#ffe4e1",
    "#fff5c4",
    "#e0f7fa",
    "#f3e5f5",
    "#e8f5e9",
    "#ffdce5",
    "#fef3e7",
  ];

  for (let i = 0; i < POPUP_COUNT; i++) {
    const msg = careMessages[i % careMessages.length];

    const box = document.createElement("div");
    box.className = "popup-box";
    box.textContent = msg;

    const top = 2 + Math.random() * 86;   // 2%-88%
    const left = 2 + Math.random() * 86;  // 2%-88%
    box.style.top = top + "vh";
    box.style.left = left + "vw";

    const color = pastelColors[Math.floor(Math.random() * pastelColors.length)];
    box.style.backgroundColor = color;

    const rotate = (Math.random() * 10 - 5).toFixed(1);
    box.style.transform = `scale(0.6) translateY(20px) rotate(${rotate}deg)`;

    const delay = i * POPUP_INTERVAL + Math.random() * 100;
    box.style.animationDelay = `${delay}ms`;

    overlay.appendChild(box);
  }

  let canContinue = false;
  let isFadingOut = false;
  const appearDuration = POPUP_COUNT * POPUP_INTERVAL + 2500;

  // 所有弹出差不多结束后，显示“点击画面继续……”
  setTimeout(() => {
    hint.classList.remove("hidden");
    canContinue = true;
  }, appearDuration);

  // 点击后：逐个淡出，然后再进入【认识你小问卷】
  stage.addEventListener("click", function () {
    if (!canContinue || isFadingOut) return;
    isFadingOut = true;
    hint.classList.add("hidden");

    const boxes = Array.from(document.querySelectorAll(".popup-box"));
    const FADE_INTERVAL = 18;   // 每个弹窗开始淡出的间隔
    const FADE_DURATION = 250;  // popupOut 动画时长（要和 CSS 对上）

    boxes.forEach((box, index) => {
      setTimeout(() => {
        box.style.animation = "popupOut 0.3s ease forwards";
      }, index * FADE_INTERVAL);
    });

    const total = boxes.length * FADE_INTERVAL + FADE_DURATION + 150;

    setTimeout(() => {
      showQuestionnaire();
    }, total);
  });
}

// ================== 创意 2 + 5：认识你的小问卷 + 心情温度计 ==================
function showQuestionnaire() {
  appRoot.innerHTML = `
    <div class="quiz-page">
      <div class="quiz-header-small">
        在见面之前，先偷偷认识你一点点 ☁️
      </div>

      <h2 class="quiz-title">
        下面这些没有标准答案，<br>
        你怎么舒服就怎么选～ 
      </h2>

      <!-- Q1 -->
      <section class="quiz-card" data-q="q1">
        <div class="quiz-q">Q1 第一次见面，你更想要什么氛围？</div>
        <div class="quiz-options">
          <button class="quiz-pill" data-q="q1" data-value="咖啡聊天">
            安静喝杯咖啡聊天 ☕
          </button>
          <button class="quiz-pill" data-q="q1" data-value="散步奶茶">
            散步+奶茶，边走边聊 🧋
          </button>
          <button class="quiz-pill" data-q="q1" data-value="随缘看看">
            随缘走走看看，有什么好玩 🎡
          </button>
        </div>
      </section>

      <!-- Q2 -->
      <section class="quiz-card" data-q="q2">
        <div class="quiz-q">Q2 这次见面，你更想要哪种感觉？</div>
        <div class="quiz-options">
          <button class="quiz-pill" data-q="q2" data-value="轻松聊天">
            轻松聊天，主要是认识彼此 🙂
          </button>
          <button class="quiz-pill" data-q="q2" data-value="一起吃好吃的">
            边吃好吃的边小吐槽生活 🍜
          </button>
          <button class="quiz-pill" data-q="q2" data-value="随缘再看">
            轻松漂流系，看心情再决定后续 🌊
          </button>
        </div>
      </section>

      <!-- Q3 -->
      <section class="quiz-card" data-q="q3">
        <div class="quiz-q">Q3 第一次见面，你比较希望我是个什么人设？</div>
        <div class="quiz-options">
          <button class="quiz-pill" data-q="q3" data-value="不会冷场担当">
            负责搞笑，让场面不尴尬 🤹‍♂️
          </button>
          <button class="quiz-pill" data-q="q3" data-value="认真倾听型">
            负责认真听你说话 👂
          </button>
          <button class="quiz-pill" data-q="q3" data-value="分享故事型">
            分享见闻和有趣故事 📚
          </button>
          <button class="quiz-pill" data-q="q3" data-value="自由切换型">
            现场看你状态自由切换 🌀
          </button>
        </div>
      </section>

      <!-- 心情温度计 -->
      <section class="quiz-card" data-q="mood">
        <div class="quiz-q">顺便偷看一下，你现在大概是什么心情？（没有好坏之分）</div>
        <div class="quiz-options">
          <button class="quiz-pill mood-pill" data-mood="tired">
            有点累，想轻松一点 😴
          </button>
          <button class="quiz-pill mood-pill" data-mood="calm">
            还挺平静的，随缘聊天就好 🙂
          </button>
          <button class="quiz-pill mood-pill" data-mood="nervous">
            有一点点紧张 🤏
          </button>
          <button class="quiz-pill mood-pill" data-mood="excited">
            还挺期待的 🤩
          </button>
          <button class="quiz-pill mood-pill" data-mood="complex">
            说不上来，比较复杂 🌀
          </button>
        </div>
      </section>

      <div class="quiz-next-wrap">
        <button class="quiz-next-btn" id="quizNextBtn">
          下一步，我们约个时间 →
        </button>
        <div class="quiz-note">
          随便怎么选都没关系，只是帮我更好准备第一次见面而已～
        </div>
      </div>
    </div>
  `;

  // 这一页可以自由滚动
  document.body.style.overflow = "auto";

  const answers = { q1: null, q2: null, q3: null };
  let mood = profileAnswers.mood || null;

  const pills = document.querySelectorAll(".quiz-pill[data-q]");
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const q = pill.dataset.q;
      const value = pill.dataset.value;

      // 同一题只保留一个高亮
      document
        .querySelectorAll('.quiz-pill[data-q="' + q + '"]')
        .forEach((p) => p.classList.remove("active"));

      pill.classList.add("active");
      answers[q] = value;
    });
  });

  // 心情按钮
  const moodPills = document.querySelectorAll(".mood-pill");
  moodPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      moodPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      mood = pill.dataset.mood;
    });
  });

  const nextBtn = document.getElementById("quizNextBtn");
  nextBtn.addEventListener("click", () => {
    // 如果想强制三题都选完再继续，可以放开下面这段
    // if (!answers.q1 || !answers.q2 || !answers.q3) {
    //   alert("每道题随便选一个就好，先帮我了解一下你～");
    //   return;
    // }

    // 存到全局
    profileAnswers.q1 = answers.q1;
    profileAnswers.q2 = answers.q2;
    profileAnswers.q3 = answers.q3;
    profileAnswers.mood = mood;

    showDateForm();
  });
}

// ================== 第三幕：自定义弹窗时间选择器 ==================
function showDateForm() {
  appRoot.innerHTML = `
    <div class="date-page">
      <p class="date-tip">
        第一次见面时间就定在 <strong>这个周六</strong> 吧
      </p>
      <p class="date-subtip">
        你选择你觉得舒服的时间段，我只负责准时出现 🌱
      </p>

      <div class="time-input-row">
        <div class="time-card">
          <div class="time-label">开始时间</div>
          <button type="button" class="time-display" data-target="start">点击选择时间</button>
        </div>

        <div class="time-card">
          <div class="time-label">结束时间</div>
          <button type="button" class="time-display" data-target="end">点击选择时间</button>
        </div>
      </div>

      <!-- 真正提交用的值存这里 -->
      <input type="hidden" id="startTime">
      <input type="hidden" id="endTime">

      <button id="submitDate" class="submit-btn">锁定这个时间</button>
      <p class="form-hint-bottom">保证准时到达，不迟到不放鸽子。🕒</p>

      <!-- 自定义时间选择弹窗 -->
      <div class="time-picker-overlay">
        <div class="time-picker">
          <div class="tp-title">选择时间</div>
          <div class="tp-columns">
            <div class="tp-col tp-hours"></div>
            <div class="tp-col tp-mins"></div>
          </div>
          <div class="tp-actions">
            <button type="button" class="tp-btn tp-cancel">算啦</button>
            <button type="button" class="tp-btn tp-ok">就这个</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.style.overflow = "hidden";
  document.body.classList.add("fade-in");

  const submitBtn = document.getElementById("submitDate");
  const startHidden = document.getElementById("startTime");
  const endHidden = document.getElementById("endTime");
  const displays = document.querySelectorAll(".time-display");

  const overlay = document.querySelector(".time-picker-overlay");
  const hoursCol = document.querySelector(".tp-hours");
  const minsCol = document.querySelector(".tp-mins");
  const btnCancel = document.querySelector(".tp-cancel");
  const btnOk = document.querySelector(".tp-ok");

  // 构建时间选项
  function buildTimeOptions() {
    hoursCol.innerHTML = "";
    minsCol.innerHTML = "";

    for (let h = 0; h < 24; h++) {
      const span = document.createElement("div");
      span.className = "tp-item tp-hour";
      span.dataset.value = h.toString().padStart(2, "0");
      span.textContent = span.dataset.value;
      hoursCol.appendChild(span);
    }

    for (let m = 0; m < 60; m++) {
      const span = document.createElement("div");
      span.className = "tp-item tp-min";
      span.dataset.value = m.toString().padStart(2, "0");
      span.textContent = span.dataset.value;
      minsCol.appendChild(span);
    }
  }

  buildTimeOptions();

  let activeTarget = null;      // 'start' or 'end'
  let selectedHour = "19";
  let selectedMinute = "00";

  function openPicker(target) {
    activeTarget = target;

    // 读当前值，如果有，就用当前值做默认
    const currentValue = target === "start" ? startHidden.value : endHidden.value;
    if (currentValue && currentValue.includes(":")) {
      const [h, m] = currentValue.split(":");
      selectedHour = h;
      selectedMinute = m;
    } else {
      selectedHour = "19";
      selectedMinute = "00";
    }

    markSelected();
    overlay.classList.add("show");
  }

  function closePicker() {
    overlay.classList.remove("show");
  }

  function markSelected() {
    document.querySelectorAll(".tp-hour").forEach((el) => {
      el.classList.toggle("selected", el.dataset.value === selectedHour);
    });
    document.querySelectorAll(".tp-min").forEach((el) => {
      el.classList.toggle("selected", el.dataset.value === selectedMinute);
    });
  }

  hoursCol.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("tp-hour")) {
      selectedHour = target.dataset.value;
      markSelected();
    }
  });

  minsCol.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("tp-min")) {
      selectedMinute = target.dataset.value;
      markSelected();
    }
  });

  displays.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target; // 'start' or 'end'
      openPicker(target);
    });
  });

  btnCancel.addEventListener("click", () => {
    closePicker();
  });

  btnOk.addEventListener("click", () => {
    if (!activeTarget) return;
    const value = `${selectedHour}:${selectedMinute}`;

    if (activeTarget === "start") {
      startHidden.value = value;
      const btn = document.querySelector('.time-display[data-target="start"]');
      btn.textContent = value;
      btn.classList.add("has-value");
    } else {
      endHidden.value = value;
      const btn = document.querySelector('.time-display[data-target="end"]');
      btn.textContent = value;
      btn.classList.add("has-value");
    }

    closePicker();
  });

  // 点弹窗蒙层空白处也可以关闭
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePicker();
    }
  });

  // 提交按钮逻辑
  submitBtn.addEventListener("click", function () {
    const startTime = startHidden.value;
    const endTime = endHidden.value;

    if (!startTime || !endTime) {
      alert("先选好开始和结束时间嘛～");
      return;
    }

    if (endTime <= startTime) {
      alert("结束时间要晚于开始时间哦，再看一眼～");
      return;
    }

    const payload = {
      name: safeUsername || null,
      day: "这个周六",
      start_time: startTime,
      end_time: endTime,
      // 问卷答案先只用于前端展示，不传后端
    };

    fetch(`${API_BASE}/api/save-date`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("网络返回非 2xx");
        }
        return res.json();
      })
      .then(() => {
        // 成功后先进入幸运彩蛋页，再到朋友卡
        showLuckyPage(startTime, endTime);
      })
      .catch((err) => {
        console.error(err);
        alert("提交失败了 T_T 可能是我这边小服务器没开，稍后再试试～");
      });
  });
}

// ================== 创意 4：幸运彩蛋页 ==================
function showLuckyPage(startTime, endTime) {
  appRoot.innerHTML = `
    <div class="quiz-page lucky-page">
      <div class="quiz-header-small">
        时间已经定好了，接下来轮到我随机立一个小 flag ～ 🎲
      </div>

      <h2 class="quiz-title">
        给这次见面加一个<br>小小的「见面彩蛋」
      </h2>

      <section class="quiz-card">
        <div class="quiz-q">
          点一下下面的按钮，抽一个这次见面的「小承诺」：<br>
          （没有压力，只是我单方面对你的好待遇 😆）
        </div>
        <div class="quiz-next-wrap">
          <button class="quiz-next-btn" id="drawLuckyBtn">
            点我抽彩蛋 🎁
          </button>
          <div id="luckyResult" class="quiz-note" style="margin-top:12px;"></div>
        </div>
      </section>

      <div class="quiz-next-wrap">
        <button class="quiz-next-btn" id="toFriendCardBtn" style="display:none;">
          好，就这么约定啦 → 看朋友卡
        </button>
      </div>
    </div>
  `;

  document.body.style.overflow = "auto";

  const drawBtn = document.getElementById("drawLuckyBtn");
  const resultDiv = document.getElementById("luckyResult");
  const nextBtn = document.getElementById("toFriendCardBtn");

  drawBtn.addEventListener("click", () => {
    const idx = Math.floor(Math.random() * luckyList.length);
    const text = luckyList[idx];
    profileAnswers.lucky = text;

    resultDiv.textContent = text;
    nextBtn.style.display = "inline-block";
    drawBtn.textContent = "如果你想换一个，也可以再抽一次 😆";
  });

  nextBtn.addEventListener("click", () => {
    showFriendCard(startTime, endTime);
  });
}

// ================== 最终：朋友卡 ==================
function showFriendCard(startTime, endTime) {
  const displayName = safeUsername || "你";

  // 根据问卷答案生成三行文案
  const vibeText = (() => {
    switch (profileAnswers.q1) {
      case "咖啡聊天":
        return "安静喝一杯咖啡慢慢聊";
      case "散步奶茶":
        return "一边散步一边喝奶茶聊天";
      case "随缘看看":
        return "随缘走走看看，氛围轻松一点";
      default:
        return "你觉得舒服的氛围";
    }
  })();

  const activityText = (() => {
    switch (profileAnswers.q2) {
      case "轻松聊天":
        return "找个地方慢慢聊天，主要是认识彼此";
      case "一起吃好吃的":
        return "一起吃点好吃的，顺便小吐槽生活";
      case "随缘再看":
        return "行程随缘，边走边看心情再决定后续";
      default:
        return "随缘安排一两个小活动";
    }
  })();

  const roleText = (() => {
    switch (profileAnswers.q3) {
      case "不会冷场担当":
        return "负责搞笑，不让场面冷掉";
      case "认真倾听型":
        return "负责认真听你说话";
      case "分享故事型":
        return "负责分享见闻和有趣故事";
      case "自由切换型":
        return "现场看你状态自由切换";
      default:
        return "现场看你状态自由切换";
    }
  })();

  const moodShort = (() => {
    switch (profileAnswers.mood) {
      case "tired":
        return "有点累，那就走轻松路线，不会安排太满。";
      case "calm":
        return "还挺平静的，那就随缘聊天，节奏慢一点。";
      case "nervous":
        return "有一点紧张，那我会负责多说一些话，把气氛撑起来。";
      case "excited":
        return "有点小期待，那我会好好准备，不辜负你的心情。";
      case "complex":
        return "心情比较复杂，那天就顺着你的状态来，完全不用勉强自己。";
      default:
        return "无论你那天是什么心情，都可以做真实的自己就好。";
    }
  })();

  const luckyText =
    profileAnswers.lucky ||
    "我们这次见面就当作一件轻松的小事，有缘就好。";

  appRoot.innerHTML = `
    <div class="friend-card-screen">
      <div class="friend-card">
        <div class="friend-card-header">
          <span class="friend-card-title">「认识你的一小步」朋友卡</span>
          <span class="friend-card-icon">📘</span>
        </div>

        <div class="friend-card-meta">
          <div><span class="fc-meta-label">见面对象：</span><span>${displayName}</span></div>
          <div><span class="fc-meta-label">见面日：</span><span>这个周六</span></div>
          <div><span class="fc-meta-label">时间段：</span><span>${startTime} ~ ${endTime}</span></div>
        </div>

        <div class="friend-card-divider"></div>

        <div class="friend-card-row">
          <span class="fc-label">你想要的氛围：</span>
          <span class="fc-text">${vibeText}</span>
        </div>

        <div class="friend-card-row">
          <span class="fc-label">小小期待的安排：</span>
          <span class="fc-text">${activityText}</span>
        </div>

        <div class="friend-card-row">
          <span class="fc-label">我的出场人设：</span>
          <span class="fc-text">${roleText}</span>
        </div>

        <div class="friend-card-row">
          <span class="fc-label">收到的心情预报：</span>
          <span class="fc-text">${moodShort}</span>
        </div>

        <p class="friend-card-paragraph">
          见面这件事，我会当成一件认真又轻松的小事来对待。<br>
          希望那天你是放松的，不需要勉强自己。
        </p>

        <p class="friend-card-paragraph friend-card-soft">
          小小见面彩蛋：${luckyText}
        </p>

        <p class="friend-card-paragraph friend-card-soft">
          如果那天你临时不太想见，也没关系～<br>
          提前跟我说一声就好，我会真心祝你那天也过得顺顺利利又开心 ✨
        </p>

        <div class="friend-card-img-wrap">
          <img src="images/wozhuangde.jpg" alt="" class="friend-card-img">
        </div>
      </div>
    </div>
  `;

  document.body.style.overflow = "auto";
}
