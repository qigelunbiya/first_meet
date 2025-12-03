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
  bgm.volume = 0.2; // ⭐ 音量在这里调（0 ~ 1）

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

// ========= 一些常量 =========
const DAY_LABEL = "这个周六";

// 阶段枚举（已去掉抽卡 LOTTERY 阶段）
const STAGE = {
  FIRST: "first", // xixi + 耶
  POPUPS: "popups", // 弹窗雨
  QUIZ: "quiz", // 问卷
  INTRO: "intro", // 自我介绍
  TIME: "time", // 选时间
  FRIEND: "friend", // 最终朋友卡
};

// ======= 关键：这里填 ngrok 暴露出来的 HTTPS 地址 =======
const API_BASE =
  "https://supervoluminously-penicillate-malia.ngrok-free.dev";

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
  "会好起来的",
  "很高兴认识你"
];

// ========= 全局状态：一次完整流程的数据 =========
let loveId = null; // 对应 love 表里的 id

let appState = {
  name: safeUsername || null,
  day: DAY_LABEL,

  stage: null, // 当前阶段

  // 问卷相关
  vibe: "", // 氛围
  activity: "", // 你的节奏 / 活动喜好
  role: "", // 你的聊天偏好
  mood_level: null, // 1~5
  mood_note: "", // 对应的描述

  // 自我介绍文案（写给她看的）
  intro_text:
    "平时大部分时间在写代码，属于安静但聊天会慢慢打开的类型。\n" +
    "休息的时候会随便走走、乱拍路边的小动物和天空，也会去找一点好吃的。\n" +
    "整体算是慢热型，但熟了之后会比较话多。\n" +
    "第一次见面主要就是轻松地认识一下你，不会安排特别高压或社恐场景。",

  // 时间
  start_time: "",
  end_time: "",
};

function updateAppState(partial) {
  appState = { ...appState, ...partial };
}

// ========= 首页“不去”逻辑 =========
let clickCount = 0; // 记录点击「不去」的次数

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

noButton.addEventListener("click", function () {
  clickCount++;

  // 让「我同意」按钮越来越大
  const yesSize = 1 + clickCount * 0.6;
  yesButton.style.transform = `scale(${yesSize})`;

  // 把「不去」按钮不断往右挤
  const noOffset = clickCount * 40;
  noButton.style.transform = `translateX(${noOffset}px)`;

  // 图片和文字往上移动一点
  const moveUp = clickCount * 20;
  mainImage.style.transform = `translateY(-${moveUp}px)`;
  questionText.style.transform = `translateY(-${moveUp}px)`;

  // No 文案变化
  if (clickCount <= noTexts.length) {
    noButton.innerText = noTexts[clickCount - 1];
  } else {
    noButton.innerText = noTexts[noTexts.length - 1];
  }

  // 图片变化
  if (clickCount === 1) mainImage.src = "images/nani.jpg";
  if (clickCount === 2) mainImage.src = "images/xinqingbuxing.jpg";
  if (clickCount === 3) mainImage.src = "images/weiqu.jpg";
  if (clickCount >= 4) mainImage.src = "images/stop.jpg";
});

// ========= 后端：love 表接口 =========

// 新建一条 love 记录（只在刚点 YES 的时候调用一次）
function startLoveSession() {
  const payload = {
    name: appState.name,
    day: appState.day,
    stage: STAGE.FIRST,
  };

  return fetch(`${API_BASE}/api/love/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.id) {
        loveId = data.id;
        console.log("love session id =", loveId);
      }
    })
    .catch((err) => {
      console.error("startLoveSession error", err);
    });
}

// 更新 love 记录（某些字段 + 当前阶段）
function saveLove(extra = {}) {
  if (!loveId) return; // 还没拿到 id 就先不存

  const payload = {
    id: loveId,
    name: appState.name,
    day: appState.day,
    vibe: appState.vibe || null,
    activity: appState.activity || null,
    role: appState.role || null,
    mood_level: appState.mood_level || null,
    mood_note: appState.mood_note || null,
    intro_text: appState.intro_text || null,
    start_time: appState.start_time || null,
    end_time: appState.end_time || null,
    stage: appState.stage || null,
    ...extra,
  };

  fetch(`${API_BASE}/api/love/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error("saveLove error", err);
  });
}

// 切换阶段时统一调用
function gotoStage(newStage) {
  updateAppState({ stage: newStage });
  window.scrollTo(0, 0);
  saveLove({ stage: newStage });
  renderStage();
}

// ========= YES 按钮：开始整个流程 =========
let agreeStarted = false;

yesButton.addEventListener("click", function () {
  if (agreeStarted) return;
  agreeStarted = true;

  const container = document.querySelector(".container");

  const go = () => {
    startLoveSession().finally(() => {
      gotoStage(STAGE.FIRST);
    });
  };

  if (container) {
    container.classList.add("container-fade-out");
    setTimeout(go, 450);
  } else {
    go();
  }
});

// ========= 阶段渲染总调度 =========
function renderStage() {
  const stage = appState.stage;

  document.body.style.overflow = "auto"; // 默认可滚动

  switch (stage) {
    case STAGE.FIRST:
      showFirstScreen();
      break;
    case STAGE.POPUPS:
      showCarePopups();
      break;
    case STAGE.QUIZ:
      showQuestionnaire();
      break;
    case STAGE.INTRO:
      showIntroPage();
      break;
    case STAGE.TIME:
      showDateForm();
      break;
    case STAGE.FRIEND:
      showFriendCardPage();
      break;
    default:
      break;
  }
}

// 通用：给当前页面加左右导航
function attachNavHandlers(options = {}) {
  const { onPrev, onNext } = options;

  const prevBtn = document.querySelector(".nav-arrow-left");
  const nextBtn = document.querySelector(".nav-arrow-right");

  if (prevBtn) {
    if (!onPrev) {
      prevBtn.classList.add("nav-disabled");
    } else {
      prevBtn.classList.remove("nav-disabled");
      const handlerPrev = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onPrev();
      };
      prevBtn.addEventListener("click", handlerPrev);
      prevBtn.addEventListener("touchstart", handlerPrev, { passive: false });
    }
  }

  if (nextBtn) {
    if (!onNext) {
      nextBtn.classList.add("nav-disabled");
    } else {
      nextBtn.classList.remove("nav-disabled");
      const handlerNext = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onNext();
      };
      nextBtn.addEventListener("click", handlerNext);
      nextBtn.addEventListener("touchstart", handlerNext, { passive: false });
    }
  }
}

// ========= 第一幕：xixi.jpg + 耶！ =========
function showFirstScreen() {
  appRoot.innerHTML = `
    <div class="first-screen">
      <img src="images/xixi.jpg" alt="xixi" class="first-image" decoding="async">
      <div class="first-message-line">耶！</div>
      <div class="click-hint first-hint">点击画面继续……</div>
    </div>
  `;
  document.body.style.overflow = "hidden";

  const firstScreen = document.querySelector(".first-screen");
  firstScreen.addEventListener("click", function () {
    gotoStage(STAGE.POPUPS);
  });
}

// ========= 第二幕：弹窗雨 =========
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

  const POPUP_COUNT = 140; // 弹窗数量
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

    const top = 2 + Math.random() * 86;
    const left = 2 + Math.random() * 86;
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

  setTimeout(() => {
    hint.classList.remove("hidden");
    canContinue = true;
  }, appearDuration);

  stage.addEventListener("click", function () {
    if (!canContinue || isFadingOut) return;
    isFadingOut = true;
    hint.classList.add("hidden");

    const boxes = Array.from(document.querySelectorAll(".popup-box"));
    const FADE_INTERVAL = 18;
    const FADE_DURATION = 250;

    boxes.forEach((box, index) => {
      setTimeout(() => {
        box.style.animation = "popupOut 0.3s ease forwards";
      }, index * FADE_INTERVAL);
    });

    const total = boxes.length * FADE_INTERVAL + FADE_DURATION + 150;

    setTimeout(() => {
      gotoStage(STAGE.QUIZ);
    }, total);
  });
}

// ========= 第三幕：问卷（花式问题 + 心情温度计） =========
function showQuestionnaire() {
  appRoot.innerHTML = `
    <div class="quiz-page">
      <div class="quiz-header-small">
        在见面之前，先简单对一下频道 ☁️
      </div>

      <h2 class="quiz-title">
        这些小问题没有标准答案，<br>
        只是想在见你之前，慢慢靠近你的节奏～
      </h2>

      <!-- Q1：氛围 -->
      <section class="quiz-card" data-q="vibe">
        <div class="quiz-q">Q1 你比较喜欢什么样的氛围？</div>
        <div class="quiz-options">
          <button class="quiz-pill" data-q="vibe" data-value="偏安静一点">
            <span class="emoji">🌙</span><span>偏安静一点，慢慢把话题打开</span>
          </button>
          <button class="quiz-pill" data-q="vibe" data-value="轻松有点小开心">
            <span class="emoji">🙂</span><span>整体轻松，有一点小开心就好</span>
          </button>
          <button class="quiz-pill" data-q="vibe" data-value="活泼一点也没问题">
            <span class="emoji">🎈</span><span>氛围可以活泼一点</span>
          </button>
          <button class="quiz-pill" data-q="vibe" data-value="看当天状态随缘">
            <span class="emoji">🍃</span><span>看当天状态，舒服最重要</span>
          </button>
        </div>
      </section>

      <!-- Q2：你自己的节奏 -->
      <section class="quiz-card" data-q="activity">
        <div class="quiz-q">Q2 和朋友出去时，你整体属于哪种节奏？</div>
        <div class="quiz-options">
          <button class="quiz-pill" data-q="activity" data-value="先慢慢熟络型">
            <span class="emoji">🐢</span><span>刚开始会稍微慢热一点，需要一点时间放松</span>
          </button>
          <button class="quiz-pill" data-q="activity" data-value="边走边慢慢放松型">
            <span class="emoji">🚶‍♀️</span><span>边走边聊、慢慢就能放松下来</span>
          </button>
          <button class="quiz-pill" data-q="activity" data-value="到哪都能聊得挺开型">
            <span class="emoji">🌟</span><span>只要氛围还行，基本都能聊得很开</span>
          </button>
        </div>
      </section>

      <!-- Q3：你比较喜欢怎样聊天 -->
      <section class="quiz-card" data-q="role">
        <div class="quiz-q">Q3 平时聊天时，你比较喜欢哪种感觉？</div>
        <div class="quiz-options">
          <button class="quiz-pill" data-q="role" data-value="先听听对方，再慢慢分享">
            <span class="emoji">👂</span><span>先听听对方在想什么，再慢慢接着聊</span>
          </button>
          <button class="quiz-pill" data-q="role" data-value="一来一回比较均衡的聊天">
            <span class="emoji">🤝</span><span>一来一回比较均衡的聊天</span>
          </button>
          <button class="quiz-pill" data-q="role" data-value="想到什么就自由发挥">
            <span class="emoji">🌀</span><span>想到什么就自由发挥，话题可以乱飞</span>
          </button>
        </div>
      </section>

      <!-- Q4：心情温度计 -->
      <section class="quiz-card" data-q="mood">
        <div class="quiz-q">Q4 那你现在的大概心情？</div>
        <div class="mood-thermo">
          <div class="mood-slider-wrap">
            <div class="mood-slider-bg"></div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              class="mood-slider"
              id="moodSlider"
            />
          </div>
          <div class="mood-text" id="moodText"></div>
        </div>
      </section>

      <div class="quiz-next-wrap">
        <button class="quiz-next-btn" id="quizNextBtn">
          好～那我先简单自我介绍一下 →
        </button>
        <div class="quiz-note">
          怎么选都没关系，只是想在见面前多了解一点点你，<br>
          也方便我别把第一次见面弄得太尴尬～
        </div>
      </div>

      <button class="nav-arrow nav-arrow-left" type="button"></button>
      <button class="nav-arrow nav-arrow-right" type="button"></button>
    </div>
  `;

  document.body.style.overflow = "auto";

  // 恢复之前的选择（如果有的话）
  const pills = document.querySelectorAll(".quiz-pill");
  pills.forEach((pill) => {
    const q = pill.dataset.q;
    const value = pill.dataset.value;

    if (
      (q === "vibe" && appState.vibe === value) ||
      (q === "activity" && appState.activity === value) ||
      (q === "role" && appState.role === value)
    ) {
      pill.classList.add("active");
    }

    pill.addEventListener("click", () => {
      document
        .querySelectorAll(`.quiz-pill[data-q="${q}"]`)
        .forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      if (q === "vibe") updateAppState({ vibe: value });
      if (q === "activity") updateAppState({ activity: value });
      if (q === "role") updateAppState({ role: value });
    });
  });

  // 心情温度计：0~100 映射到 5 个区间
  const moodSlider = document.getElementById("moodSlider");
  const moodText = document.getElementById("moodText");

  const moodRanges = [
    {
      level: 1,
      min: 0,
      max: 20,
      note: "看样子最近事情不少，有点不开心，如果哪天想吐槽我可以当垃圾桶😔",
    },
    {
      level: 2,
      min: 20,
      max: 40,
      note: "好像有点累，但还撑着。如果那天你只想轻松走走，我也完全 OK。",
    },
    {
      level: 3,
      min: 40,
      max: 60,
      note: "整体还可以，在慢慢往上爬 🙂",
    },
    {
      level: 4,
      min: 60,
      max: 80,
      note: "今天状态不错，感觉挺轻松的 😄",
    },
    {
      level: 5,
      min: 80,
      max: 100,
      note: "好像最近还挺开心的，希望这小小的约见不要给你添烦恼 ✨",
    },
  ];

  function getMoodEntryFromValue(value) {
    const v = Number(value);
    for (const item of moodRanges) {
      if (v >= item.min && (v <= item.max || item.level === 5)) {
        return item;
      }
    }
    return moodRanges[2]; // 默认第 3 档
  }

  function updateMoodUIFromSlider(value) {
    const entry = getMoodEntryFromValue(value);
    moodText.textContent = entry.note;
    updateAppState({
      mood_level: entry.level,
      mood_note: entry.note,
    });
  }

  // 默认值：如果有历史 level，用该区间正中；否则第 3 档
  const initialLevel = appState.mood_level || 3;
  const initialRange = moodRanges[initialLevel - 1] || moodRanges[2];
  const initialSliderValue = (initialRange.min + initialRange.max) / 2;

  moodSlider.value = initialSliderValue;
  updateMoodUIFromSlider(initialSliderValue);

  moodSlider.addEventListener("input", () => {
    updateMoodUIFromSlider(moodSlider.value);
  });

  const nextBtn = document.getElementById("quizNextBtn");
  const goNext = () => {
    gotoStage(STAGE.INTRO);
  };
  nextBtn.addEventListener("click", goNext);

  attachNavHandlers({
    onPrev: null,
    onNext: goNext,
  });
}

// ========= 第四幕：自我介绍页 =========
function showIntroPage() {
  appRoot.innerHTML = `
    <div class="intro-page">
      <div class="intro-card">
        <h2 class="intro-title">那我也简单自我介绍一下 🙂</h2>

        <!-- 开场两段自我介绍文字 -->
        <div class="intro-text">
          <p>
            咳咳，我其实是一个比较沉闷的程序员，但是内心世界很丰富🤗
            属于安静但聊天会慢慢打开的类型。
          </p>
          <p>
            偶尔会在城市里随便走走，看到好看的天空🌅、路边的小动物😸，或者有趣的事情🌇，
            就会忍不住拍几张照片📸。
          </p>
        </div>

        <!-- 研究生生活，两张图，水平居中 -->
        <section class="intro-section">
          <div class="intro-section-title">下面是我丰富的生活</div>
          <p class="intro-section-desc">
            研一时经常忙到晚上十点就和同门去校门口吃东西唠嗑
          </p>
          <div class="intro-media-row">
            <div class="intro-photo-slot intro-photo-large">
              <img src="images/yanjiusheng_1.jpg" alt="研究生生活 1" loading="lazy" decoding="async">
            </div>
          </div>
        </section>

        <!-- 毕业答辩视频 -->
        <section class="intro-section">
          <p class="intro-section-desc">
            然后下面是今年五月份毕业答辩时录下来的，人生非常重要的时刻，意味着要顺利毕业啦～
          </p>
          <div class="intro-video-wrap">
            <!-- 这里把 src 换成你自己的 mp4 路径 -->
            <video
              class="intro-video"
              src="images/dabian_1.mp4"
              playsinline
              muted
              autoplay
              loop
              controls
            ></video>
          </div>
        </section>

        <!-- 谢师宴两张图，水平居中 -->
        <section class="intro-section">
          <p class="intro-section-desc">
            然后下面是五月底谢师宴人生第一次喝的烂醉被记录了下来（从此之后再也没有碰过酒……）
          </p>
          <div class="intro-media-row">
            <div class="intro-photo-slot intro-photo-large">
              <img src="images/xieshiyan_1.jpg" alt="谢师宴 1" loading="lazy" decoding="async">
            </div>
            <div class="intro-photo-slot intro-photo-large">
              <img src="images/xieshiyan_2.jpg" alt="谢师宴 2" loading="lazy" decoding="async">
            </div>
          </div>
        </section>

        <!-- 收尾一段话 -->
        <div class="intro-text intro-text-bottom">
          <p>
            其实我很少特地拍自己😂……
            然后对这种形式的第一次见面我会重视，但是第一次经历我又不知道处理这种事😔
            不需要刻意拉近关系，只是希望气氛能够轻松一点、真诚一点，互相认识☺️
          </p>
        </div>

        <button class="quiz-next-btn intro-next-btn" id="introNextBtn">
          好啦～那我们约个时间吧 →
        </button>

        <button class="nav-arrow nav-arrow-left" type="button"></button>
        <button class="nav-arrow nav-arrow-right" type="button"></button>
      </div>
    </div>
  `;

  document.body.style.overflow = "auto";

  const goPrev = () => {
    gotoStage(STAGE.QUIZ);
  };
  const goNext = () => {
    gotoStage(STAGE.TIME);
  };

  document.getElementById("introNextBtn").addEventListener("click", goNext);

  attachNavHandlers({
    onPrev: goPrev,
    onNext: goNext,
  });
}


// ========= 第五幕：自定义弹窗时间选择器（兼容手机 + 状态保存） =========
function showDateForm() {
  appRoot.innerHTML = `
    <div class="date-page">
      <p class="date-tip">
        第一次见面时间就定在 <strong>${DAY_LABEL}</strong> 吧
      </p>
      <p class="date-subtip">
        你选一个自己舒服的时间段就好 🌱
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

      <input type="hidden" id="startTime">
      <input type="hidden" id="endTime">

      <button id="submitDate" class="submit-btn">锁定这个时间</button>
      <p class="form-hint-bottom">
        我会准时到达 🕒
      </p>

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

      <button class="nav-arrow nav-arrow-left" type="button"></button>
      <button class="nav-arrow nav-arrow-right" type="button"></button>
    </div>
  `;

  document.body.style.overflow = "auto";

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

  let activeTarget = null; // 'start' or 'end'
  let selectedHour = "19";
  let selectedMinute = "00";

  function markSelected() {
    document.querySelectorAll(".tp-hour").forEach((el) => {
      el.classList.toggle("selected", el.dataset.value === selectedHour);
    });
    document.querySelectorAll(".tp-min").forEach((el) => {
      el.classList.toggle("selected", el.dataset.value === selectedMinute);
    });
  }

  function openPicker(target) {
    activeTarget = target;
    const currentValue =
      target === "start" ? startHidden.value : endHidden.value;

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
      const t = btn.dataset.target; // 'start' or 'end'
      openPicker(t);
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

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePicker();
    }
  });

  // 如果之前已经选过，恢复
  if (appState.start_time) {
    startHidden.value = appState.start_time;
    const btn = document.querySelector('.time-display[data-target="start"]');
    btn.textContent = appState.start_time;
    btn.classList.add("has-value");
  }
  if (appState.end_time) {
    endHidden.value = appState.end_time;
    const btn = document.querySelector('.time-display[data-target="end"]');
    btn.textContent = appState.end_time;
    btn.classList.add("has-value");
  }

  const handleSubmit = () => {
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

    updateAppState({
      start_time: startTime,
      end_time: endTime,
    });

    saveLove({
      start_time: startTime,
      end_time: endTime,
    });

    // 直接进入朋友卡页面（不再经过抽卡）
    gotoStage(STAGE.FRIEND);
  };

  submitBtn.addEventListener("click", handleSubmit);

  // 导航：上一页回自我介绍，下一页等同于“锁定这个时间”
  const goPrev = () => {
    gotoStage(STAGE.INTRO);
  };

  attachNavHandlers({
    onPrev: goPrev,
    onNext: handleSubmit,
  });
}

// ========= 最后一幕：朋友卡 =========
function showFriendCardPage() {
  const displayName = appState.name || "你";
  const startTime = appState.start_time || "--:--";
  const endTime = appState.end_time || "--:--";

  const vibeText = appState.vibe || "你觉得舒服的氛围";
  const activityText = appState.activity || "你习惯的相处节奏";
  const roleText = appState.role || "你喜欢的聊天方式";
  const moodNote = appState.mood_note || "";

  appRoot.innerHTML = `
    <div class="friend-card-screen">
      <div class="friend-card">
        <div class="friend-card-header">
          <span class="friend-card-title">「朋友卡」</span>
          <span class="friend-card-icon">📘</span>
        </div>

        <div class="friend-card-meta">
          <div><span class="fc-meta-label">见面对象：</span><span>${displayName}</span></div>
          <div><span class="fc-meta-label">见面日：</span><span>${DAY_LABEL}</span></div>
          <div><span class="fc-meta-label">时间段：</span><span>${startTime} ~ ${endTime}</span></div>
        </div>

        <div class="friend-card-divider"></div>

        <div class="friend-card-row">
          <span class="fc-label">你喜欢的氛围：</span>
          <span class="fc-text">${vibeText}</span>
        </div>

        <div class="friend-card-row">
          <span class="fc-label">你习惯的相处节奏：</span>
          <span class="fc-text">${activityText}</span>
        </div>

        <div class="friend-card-row">
          <span class="fc-label">你舒服的聊天方式：</span>
          <span class="fc-text">${roleText}</span>
        </div>

        ${
          moodNote
            ? `<div class="friend-card-row">
                 <span class="fc-label">你现在的心情备注：</span>
                 <span class="fc-text">${moodNote}</span>
               </div>`
            : ""
        }

        <p class="friend-card-paragraph">
          <br>
          希望那天你是放松的。
        </p>

        <div class="friend-card-img-wrap">
          <img src="images/xixi.jpg" alt="可爱猫猫" class="friend-card-img" loading="lazy" decoding="async">
        </div>

        <button class="nav-arrow nav-arrow-left" type="button"></button>
        <button class="nav-arrow nav-arrow-right" type="button"></button>
      </div>
    </div>
  `;

  document.body.style.overflow = "auto";

  const goPrev = () => {
    // 从朋友卡返回上一页就是选时间页
    gotoStage(STAGE.TIME);
  };

  attachNavHandlers({
    onPrev: goPrev,
    onNext: null,
  });
}
