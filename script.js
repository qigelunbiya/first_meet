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
  if (!bgm) return;
  bgm.volume = 0.2;   // ⭐ 音量在这里调小 / 调大（0 ~ 1）

  // 先尝试自动播放；如果被拦截，就在第一次点击时再播
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

// ========= 「不去」相关逻辑（不逃跑版） =========
let clickCount = 0;        // 记录点击「不去」的次数

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
  "遇到烦心事可以跟我说噢",
  "每天都开开心心的😊",
  "能和我多聊聊天吗？",
  "手机别玩太晚啦～",
  "心情会变好",
  "可以休息一下噢",
  "加班也不要饿着",
  "最近工作辛苦了",
  "每天都要元气满满",
  "你已经很棒啦！",
  "久坐不好呀～",
  "早点睡好不好💤",
  "梦想成真",
  "照顾好自己",
  "注意保暖别感冒啦～",
  "会好起来的"
];

// 「哼，不去😤」点击
noButton.addEventListener("click", function () {
  clickCount++;

  // 让「我同意」按钮越来越大
  let yesSize = 1 + clickCount * 0.6;
  yesButton.style.transform = `scale(${yesSize})`;

  // 把「不去」按钮不断往右挤
  let noOffset = clickCount * 40;
  noButton.style.transform = `translateX(${noOffset}px)`;

  // 图片和文字往上移动一点
  let moveUp = clickCount * 20;
  mainImage.style.transform = `translateY(-${moveUp}px)`;
  questionText.style.transform = `translateY(-${moveUp}px)`;

  // No 文案变化
  if (clickCount <= noTexts.length) {
    noButton.innerText = noTexts[clickCount - 1];
  } else {
    noButton.innerText = noTexts[noTexts.length - 1];
  }

  // 图片变化
  if (clickCount === 1) mainImage.src = "images/shocked.png";
  if (clickCount === 2) mainImage.src = "images/think.png";
  if (clickCount === 3) mainImage.src = "images/angry.png";
  if (clickCount >= 4) mainImage.src = "images/crying.png";
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
      <div class="first-message">耶！你选择同意了</div>
      <div class="click-hint first-hint">点击画面继续……</div>
    </div>
  `;
  document.body.style.overflow = "hidden";

  const firstScreen = document.querySelector(".first-screen");
  firstScreen.addEventListener("click", function () {
    showCarePopups();
  });
}

// 第二幕：超多可爱弹窗雨 + 小号提示
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
  const appearDuration = POPUP_COUNT * POPUP_INTERVAL + 2500;

  setTimeout(() => {
    hint.classList.remove("hidden");
    canContinue = true;
  }, appearDuration);

  stage.addEventListener("click", function () {
    if (!canContinue) return;
    showDateForm();
  });
}

// 第三幕：自定义弹窗时间选择器
function showDateForm() {
  appRoot.innerHTML = `
    <div class="date-page">
      <p class="date-tip">
        第一次见面时间就定在 <strong>这个周六</strong> 吧
      </p>
      <p class="date-subtip">
        你选择你觉得舒服的时间段
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
      <p class="form-hint-bottom">我会根据具体时间到达指定地点</p>

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
        appRoot.innerHTML = `
          <div class="yes-screen">
            <h1 class="yes-text">我记下啦！周六见～ ✨</h1>
            <img src="images/hug.png" alt="拥抱" class="yes-image">
          </div>
        `;
      })
      .catch((err) => {
        console.error(err);
        alert("提交失败了 T_T 可能是我这边小服务器没开，稍后再试试～");
      });
  });
}
