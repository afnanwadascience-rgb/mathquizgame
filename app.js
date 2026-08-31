(function () {
  "use strict";

  var STORAGE_KEYS = {
    settings: "mqg-settings",
    theme: "mqg-theme",
    stats: "mqg-stats",
    daily: "mqg-daily"
  };

  var DIFFICULTY = {
    easy: { min: 1, max: 10 },
    medium: { min: 1, max: 100 },
    hard: { min: 1, max: 1000 }
  };

  var OP_LABELS = {
    "+": "Addition",
    "-": "Subtraction",
    "*": "Multiplication",
    "/": "Division"
  };

  var state = {
    difficulty: "easy",
    min: 1,
    max: 10,
    operation: "mixed",
    mode: "timed",
    duration: 60,
    status: "setup",
    score: 0,
    streak: 0,
    wrong: 0,
    answered: 0,
    question: null,
    remainingMs: 0,
    totalMs: 0,
    timerId: null,
    lastTick: 0,
    sessionStats: emptyStats()
  };

  var els = {
    setup: document.getElementById("setup-screen"),
    play: document.getElementById("play-screen"),
    result: document.getElementById("result-screen"),
    customRange: document.getElementById("custom-range"),
    minNumber: document.getElementById("min-number"),
    maxNumber: document.getElementById("max-number"),
    rangeError: document.getElementById("range-error"),
    durationRow: document.getElementById("duration-row"),
    startBtn: document.getElementById("start-btn"),
    themeSelect: document.getElementById("theme-select"),
    daily: document.getElementById("daily-indicator"),
    modeBadge: document.getElementById("mode-badge"),
    score: document.getElementById("score"),
    streak: document.getElementById("streak-display"),
    multiplier: document.getElementById("multiplier"),
    timerWrap: document.getElementById("timer-wrap"),
    timeLabel: document.getElementById("time-label"),
    progressBar: document.getElementById("progress-bar"),
    progressFill: document.getElementById("progress-fill"),
    misses: document.getElementById("misses-label"),
    problem: document.getElementById("problem"),
    form: document.getElementById("answer-form"),
    input: document.getElementById("answer-input"),
    feedback: document.getElementById("feedback"),
    feedbackMark: document.getElementById("feedback-mark"),
    feedbackText: document.getElementById("feedback-text"),
    feedbackLive: document.getElementById("feedback-live"),
    restartBtn: document.getElementById("restart-btn"),
    setupBtn: document.getElementById("setup-btn"),
    resultSummary: document.getElementById("result-summary"),
    statsList: document.getElementById("stats-list"),
    playAgainBtn: document.getElementById("play-again-btn"),
    resultSetupBtn: document.getElementById("result-setup-btn")
  };

  function emptyStats() {
    return {
      "+": { correct: 0, total: 0 },
      "-": { correct: 0, total: 0 },
      "*": { correct: 0, total: 0 },
      "/": { correct: 0, total: 0 }
    };
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function multiplierFor(streak) {
    if (streak >= 50) return 10;
    if (streak >= 25) return 5;
    if (streak >= 10) return 3;
    if (streak >= 5) return 2;
    return 1;
  }

  function selectedOps() {
    if (state.operation === "mixed") return ["+", "-", "*", "/"];
    return [state.operation];
  }

  function generateQuestion() {
    var min = state.min;
    var max = state.max;
    var ops = selectedOps();
    var operation = ops[randInt(0, ops.length - 1)];
    var a = randInt(min, max);
    var b = randInt(min, max);
    var answer;

    if (operation === "+") {
      answer = a + b;
    } else if (operation === "-") {
      answer = a - b;
    } else if (operation === "*") {
      answer = a * b;
    } else {
      b = randInt(Math.max(min, 1), Math.max(max, 1));
      var maxQuotient = Math.max(1, Math.floor(Math.max(max, b) / b));
      answer = randInt(1, maxQuotient);
      a = b * answer;
    }

    return {
      text: a + " " + operation + " " + b,
      answer: answer,
      operation: operation
    };
  }

  function parseAnswer(raw, operation) {
    var text = String(raw).trim();
    if (!text) return { ok: false };
    if (operation === "/") {
      var asFloat = Number(text);
      if (!Number.isFinite(asFloat)) return { ok: false };
      return { ok: true, value: asFloat, isFloat: true };
    }
    if (!/^-?\d+$/.test(text)) return { ok: false };
    return { ok: true, value: parseInt(text, 10), isFloat: false };
  }

  function answersMatch(parsed, correct, operation) {
    if (!parsed.ok) return false;
    if (operation === "/") return Math.abs(parsed.value - correct) < 0.01;
    return parsed.value === correct;
  }

  function loadJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function todayStamp() {
    var d = new Date();
    var month = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + month + "-" + day;
  }

  function yesterdayStamp() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    var month = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + month + "-" + day;
  }

  function updateDailyStreak() {
    var daily = loadJson(STORAGE_KEYS.daily, { lastPlayed: "", streak: 0 });
    var today = todayStamp();
    if (daily.lastPlayed === today) {
      return daily.streak;
    }
    if (daily.lastPlayed === yesterdayStamp()) {
      daily.streak += 1;
    } else {
      daily.streak = 1;
    }
    daily.lastPlayed = today;
    saveJson(STORAGE_KEYS.daily, daily);
    return daily.streak;
  }

  function renderDaily() {
    var daily = loadJson(STORAGE_KEYS.daily, { lastPlayed: "", streak: 0 });
    var suffix = daily.lastPlayed === todayStamp() ? " (played today)" : "";
    els.daily.textContent = "Daily streak: " + (daily.streak || 0) + suffix;
  }

  function applyTheme(pref) {
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved = pref === "system" ? (prefersDark ? "dark" : "light") : pref;
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-pref", pref);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, pref);
    } catch (e) {}
    els.themeSelect.value = pref;
  }

  function readSetupFromDom() {
    state.difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    state.operation = document.querySelector('input[name="operation"]:checked').value;
    state.mode = document.querySelector('input[name="mode"]:checked').value;
    state.duration = Number(document.querySelector('input[name="duration"]:checked').value);

    if (state.difficulty === "custom") {
      state.min = Number(els.minNumber.value);
      state.max = Number(els.maxNumber.value);
    } else {
      state.min = DIFFICULTY[state.difficulty].min;
      state.max = DIFFICULTY[state.difficulty].max;
    }
  }

  function validateRange() {
    if (state.difficulty !== "custom") {
      els.rangeError.textContent = "";
      return true;
    }
    if (!Number.isFinite(state.min) || !Number.isFinite(state.max)) {
      els.rangeError.textContent = "Enter valid numbers for min and max.";
      return false;
    }
    if (state.min < 0 || state.max < 1) {
      els.rangeError.textContent = "Min must be 0 or greater and max must be at least 1.";
      return false;
    }
    if (state.max > 10000 || state.min > 10000) {
      els.rangeError.textContent = "Keep numbers at 10000 or below.";
      return false;
    }
    if (state.min >= state.max) {
      els.rangeError.textContent = "Max must be greater than min.";
      return false;
    }
    els.rangeError.textContent = "";
    return true;
  }

  function persistSettings() {
    saveJson(STORAGE_KEYS.settings, {
      difficulty: state.difficulty,
      min: state.min,
      max: state.max,
      operation: state.operation,
      mode: state.mode,
      duration: state.duration
    });
  }

  function restoreSettings() {
    var saved = loadJson(STORAGE_KEYS.settings, null);
    if (!saved) return;
    var diff = document.querySelector('input[name="difficulty"][value="' + saved.difficulty + '"]');
    var op = document.querySelector('input[name="operation"][value="' + saved.operation + '"]');
    var mode = document.querySelector('input[name="mode"][value="' + saved.mode + '"]');
    var dur = document.querySelector('input[name="duration"][value="' + saved.duration + '"]');
    if (diff) diff.checked = true;
    if (op) op.checked = true;
    if (mode) mode.checked = true;
    if (dur) dur.checked = true;
    if (Number.isFinite(saved.min)) els.minNumber.value = saved.min;
    if (Number.isFinite(saved.max)) els.maxNumber.value = saved.max;
    toggleSetupExtras();
  }

  function toggleSetupExtras() {
    var difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    var mode = document.querySelector('input[name="mode"]:checked').value;
    els.customRange.hidden = difficulty !== "custom";
    els.durationRow.hidden = mode !== "timed";
  }

  function showScreen(name) {
    els.setup.hidden = name !== "setup";
    els.play.hidden = name !== "play";
    els.result.hidden = name !== "result";
  }

  function setFeedback(kind, text, spoken) {
    els.feedback.dataset.state = kind || "";
    els.feedbackMark.textContent = kind === "correct" ? "✓" : kind === "incorrect" ? "✕" : "";
    els.feedbackText.textContent = text || "";
    els.feedback.setAttribute("aria-hidden", kind ? "false" : "true");
    els.feedbackLive.textContent = spoken || text || "";
    els.problem.classList.toggle("is-shake", kind === "incorrect");
  }

  function renderPlayHud() {
    var multi = multiplierFor(state.streak);
    els.score.textContent = String(state.score);
    els.streak.textContent = "🔥 Streak: " + state.streak;
    els.streak.classList.toggle("is-milestone", state.streak === 5 || state.streak === 10 || state.streak === 25);
    els.multiplier.textContent = multi + "×";
    els.modeBadge.textContent = state.mode === "timed" ? ("Timed · " + state.duration + "s") : "Endless · 3 misses";
    els.timerWrap.hidden = state.mode !== "timed";
    els.misses.hidden = state.mode !== "endless";
    els.misses.textContent = "Misses: " + state.wrong + " / 3";
  }

  function renderTimer() {
    if (state.mode !== "timed") return;
    var ratio = state.totalMs <= 0 ? 0 : Math.max(0, state.remainingMs / state.totalMs);
    var seconds = Math.max(0, Math.ceil(state.remainingMs / 1000));
    els.timeLabel.textContent = seconds + "s";
    els.progressFill.style.transform = "scaleX(" + ratio + ")";
    els.progressBar.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    els.progressBar.classList.toggle("is-urgent", ratio <= 0.2);
  }

  function nextQuestion() {
    state.question = generateQuestion();
    els.problem.textContent = state.question.text + " =";
    els.input.value = "";
    renderPlayHud();
  }

  function stopTimer() {
    if (state.timerId) {
      cancelAnimationFrame(state.timerId);
      state.timerId = null;
    }
  }

  function tick(now) {
    if (state.status !== "playing" || state.mode !== "timed") return;
    var delta = now - state.lastTick;
    state.lastTick = now;
    state.remainingMs = Math.max(0, state.remainingMs - delta);
    renderTimer();
    if (state.remainingMs <= 0) {
      endGame("Time is up.");
      return;
    }
    state.timerId = requestAnimationFrame(tick);
  }

  function startTimer() {
    stopTimer();
    if (state.mode !== "timed") return;
    state.totalMs = state.duration * 1000;
    state.remainingMs = state.totalMs;
    state.lastTick = performance.now();
    renderTimer();
    state.timerId = requestAnimationFrame(tick);
  }

  function mergeStats(target, source) {
    Object.keys(source).forEach(function (op) {
      target[op].correct += source[op].correct;
      target[op].total += source[op].total;
    });
  }

  function renderStats(stats) {
    var hasData = Object.keys(stats).some(function (op) { return stats[op].total > 0; });
    if (!hasData) {
      els.statsList.innerHTML = "<li>Play a few questions to see accuracy by operation.</li>";
      return;
    }
    els.statsList.innerHTML = Object.keys(OP_LABELS).map(function (op) {
      var item = stats[op];
      var label = item.total ? Math.round((item.correct / item.total) * 100) + "% (" + item.correct + "/" + item.total + ")" : "No data yet";
      return "<li><span>" + OP_LABELS[op] + "</span><span>" + label + "</span></li>";
    }).join("");
  }

  function startGame() {
    readSetupFromDom();
    if (!validateRange()) return;
    persistSettings();
    updateDailyStreak();
    renderDaily();
    state.status = "playing";
    state.score = 0;
    state.streak = 0;
    state.wrong = 0;
    state.answered = 0;
    state.sessionStats = emptyStats();
    setFeedback("", "");
    showScreen("play");
    nextQuestion();
    startTimer();
    els.input.focus();
  }

  function restartGame() {
    if (state.status === "setup") return startGame();
    startGame();
  }

  function endGame(reason) {
    stopTimer();
    state.status = "ended";
    showScreen("result");
    var lifetime = loadJson(STORAGE_KEYS.stats, emptyStats());
    mergeStats(lifetime, state.sessionStats);
    saveJson(STORAGE_KEYS.stats, lifetime);
    els.resultSummary.textContent = reason + " Score: " + state.score + " from " + state.answered + " answered question" + (state.answered === 1 ? "" : "s") + ".";
    renderStats(lifetime);
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (state.status !== "playing" || !state.question) return;
    var parsed = parseAnswer(els.input.value, state.question.operation);
    var correct = answersMatch(parsed, state.question.answer, state.question.operation);
    var op = state.question.operation;
    state.answered += 1;
    state.sessionStats[op].total += 1;

    if (correct) {
      state.streak += 1;
      var multi = multiplierFor(state.streak);
      state.score += multi;
      state.sessionStats[op].correct += 1;
      setFeedback("correct", "Correct · +" + multi, "Correct. Score plus " + multi);
    } else {
      state.streak = 0;
      state.wrong += 1;
      setFeedback(
        "incorrect",
        "Incorrect · " + state.question.answer,
        "Incorrect. The correct answer was " + state.question.answer
      );
    }

    renderPlayHud();

    if (state.mode === "endless" && state.wrong >= 3) {
      endGame("You reached 3 incorrect answers.");
      return;
    }

    nextQuestion();
    els.input.focus();
  }

  function goToSetup() {
    stopTimer();
    state.status = "setup";
    showScreen("setup");
    els.startBtn.focus();
  }

  document.querySelectorAll('input[name="difficulty"], input[name="mode"]').forEach(function (input) {
    input.addEventListener("change", toggleSetupExtras);
  });

  els.startBtn.addEventListener("click", startGame);
  els.restartBtn.addEventListener("click", restartGame);
  els.playAgainBtn.addEventListener("click", restartGame);
  els.setupBtn.addEventListener("click", goToSetup);
  els.resultSetupBtn.addEventListener("click", goToSetup);
  els.form.addEventListener("submit", submitAnswer);

  els.themeSelect.addEventListener("change", function () {
    applyTheme(els.themeSelect.value);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (state.status !== "setup") goToSetup();
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    var pref = document.documentElement.getAttribute("data-theme-pref") || "system";
    if (pref === "system") applyTheme("system");
  });

  window.addEventListener("beforeunload", stopTimer);

  applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || "system");
  restoreSettings();
  renderDaily();
  renderStats(loadJson(STORAGE_KEYS.stats, emptyStats()));
})();