(function () {
  "use strict";

  var L = window.MQGLearn;
  if (!L) {
    console.error("learn-store.js did not load");
    return;
  }

  var welcomeEl = document.getElementById("welcome-screen");
  var appEl = document.getElementById("learn-app");
  var startBtn = document.getElementById("start-learning");
  var continueBtn = document.getElementById("continue-learning");

  var practice = { active: false, lesson: null, index: 0, correct: 0, question: null, total: 5 };
  var challenge = { active: false, index: 0, correct: 0, question: null, total: 5 };

  function hasStarted() {
    var state = L.load();
    return !!(state.started || (state.completedLessons && state.completedLessons.length) || state.correctAnswers);
  }

  function showWelcome() {
    document.body.classList.add("welcome-active");
    if (welcomeEl) welcomeEl.hidden = false;
    if (appEl) appEl.hidden = true;
  }

  function showTraining(animate) {
    document.body.classList.remove("welcome-active");
    if (welcomeEl) welcomeEl.hidden = true;
    if (appEl) {
      appEl.hidden = false;
      appEl.removeAttribute("hidden");
      appEl.style.display = "";
      if (animate) {
        appEl.classList.remove("learn-enter");
        void appEl.offsetWidth;
        appEl.classList.add("learn-enter");
      }
    }
    renderStats();
    renderLessons();
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generateQuestion(ops, hard) {
    var operation = ops[randInt(0, ops.length - 1)];
    var max = hard ? 20 : 12;
    var a = randInt(1, max);
    var b = randInt(1, max);
    var answer;
    if (operation === "+") answer = a + b;
    else if (operation === "-") answer = a - b;
    else if (operation === "*") answer = a * b;
    else {
      b = randInt(1, max);
      answer = randInt(1, 10);
      a = b * answer;
    }
    return { text: a + " " + operation + " " + b, answer: answer, operation: operation };
  }

  function parseAnswer(raw, operation) {
    var text = String(raw).trim();
    if (!text) return { ok: false };
    if (operation === "/") {
      var asFloat = Number(text);
      return { ok: Number.isFinite(asFloat), value: asFloat };
    }
    if (!/^-?\d+$/.test(text)) return { ok: false };
    return { ok: true, value: parseInt(text, 10) };
  }

  function isCorrect(parsed, question) {
    if (!parsed.ok) return false;
    if (question.operation === "/") return Math.abs(parsed.value - question.answer) < 0.01;
    return parsed.value === question.answer;
  }

  function renderStats() {
    var state = L.load();
    document.getElementById("stat-score").textContent = String(state.score);
    document.getElementById("stat-streak").textContent = state.streak + " day" + (state.streak === 1 ? "" : "s");
    document.getElementById("stat-progress").textContent = L.progressPercent(state) + "%";
    document.getElementById("stat-lessons").textContent = state.completedLessons.length + " / " + L.LESSONS.length;
    document.getElementById("stat-level").textContent = L.levelName(state);
    document.getElementById("stat-goal").textContent = state.dailyGoal + " / " + state.dailyGoalTarget;

    var next = L.nextLesson(state);
    var pct = Math.round(((state.lessonProgress[next.id] || 0) / 5) * 100);
    var card = document.getElementById("continue-card");
    if (card) card.textContent = next.title + " · Progress: " + pct + "%";

    var challengeStart = document.getElementById("challenge-start");
    if (challengeStart) challengeStart.hidden = state.dailyChallengeDone;
    if (state.dailyChallengeDone) {
      document.getElementById("challenge-status").textContent = "Today’s challenge complete · " + state.dailyChallengeCorrect + " / 5 correct.";
    }

    document.getElementById("achievement-list").innerHTML = L.ACHIEVEMENTS.map(function (item) {
      var unlocked = state.unlockedAchievements.indexOf(item.id) !== -1;
      return "<li><span>" + item.title + "</span><span>" + (unlocked ? "Unlocked" : "Locked") + "</span></li>";
    }).join("");
  }

  function renderLessons() {
    var list = document.getElementById("lesson-list");
    if (!list) return;
    var state = L.load();
    list.innerHTML = L.LESSONS.map(function (lesson) {
      var done = state.completedLessons.indexOf(lesson.id) !== -1;
      var answered = state.lessonProgress[lesson.id] || 0;
      var pct = done ? 100 : Math.round((answered / 5) * 100);
      var label = done ? "Completed" : answered ? "Continue" : "Start";
      return (
        '<article class="lesson-card">' +
          "<h3>" + lesson.title + "</h3>" +
          "<p class=\"lede\">" + lesson.description + "</p>" +
          "<p class=\"lede\">Difficulty: " + lesson.difficulty + " · Progress: " + pct + "%</p>" +
          '<button type="button" class="primary-btn" data-lesson="' + lesson.id + '">' + label + "</button>" +
        "</article>"
      );
    }).join("");
  }

  function showPractice(show) {
    document.getElementById("lesson-practice").hidden = !show;
    document.getElementById("lesson-list").hidden = show;
  }

  function nextPracticeQuestion() {
    practice.question = generateQuestion(practice.lesson.ops, practice.lesson.difficulty === "Hard");
    document.getElementById("lesson-problem").textContent = practice.question.text + " =";
    document.getElementById("lesson-practice-meta").textContent = "Question " + (practice.index + 1) + " / " + practice.total;
    document.getElementById("lesson-input").value = "";
    document.getElementById("lesson-input").focus();
  }

  function startLesson(id) {
    var lesson = L.LESSONS.find(function (item) { return item.id === id; });
    if (!lesson) return;
    L.setCurrentLesson(id);
    practice.active = true;
    practice.lesson = lesson;
    practice.index = 0;
    practice.correct = 0;
    document.getElementById("lesson-practice-title").textContent = lesson.title;
    document.getElementById("lesson-feedback").textContent = "";
    showPractice(true);
    nextPracticeQuestion();
    renderStats();
  }

  if (startBtn) {
    startBtn.addEventListener("click", function (event) {
      event.preventDefault();
      L.startJourney();
      showTraining(true);
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", function () {
      startLesson(L.nextLesson().id);
    });
  }

  document.getElementById("lesson-list").addEventListener("click", function (event) {
    var btn = event.target.closest("[data-lesson]");
    if (btn) startLesson(btn.getAttribute("data-lesson"));
  });

  document.getElementById("lesson-exit").addEventListener("click", function () {
    practice.active = false;
    showPractice(false);
    renderLessons();
    renderStats();
  });

  document.getElementById("lesson-form").addEventListener("submit", function (event) {
    event.preventDefault();
    if (!practice.active || !practice.question) return;
    var parsed = parseAnswer(document.getElementById("lesson-input").value, practice.question.operation);
    var ok = isCorrect(parsed, practice.question);
    document.getElementById("lesson-feedback").textContent = ok ? "Correct" : ("Incorrect · " + practice.question.answer);
    document.getElementById("lesson-feedback").dataset.state = ok ? "correct" : "incorrect";
    if (ok) {
      practice.correct += 1;
      L.addCorrect(5);
    }
    practice.index += 1;
    L.setLessonProgress(practice.lesson.id, practice.index);
    if (practice.index >= practice.total) {
      if (practice.correct >= 3) L.completeLesson(practice.lesson.id);
      practice.active = false;
      showPractice(false);
      renderLessons();
    } else {
      nextPracticeQuestion();
    }
    renderStats();
  });

  function nextChallengeQuestion() {
    challenge.question = generateQuestion(["+", "-", "*", "/"], false);
    document.getElementById("challenge-problem").textContent = challenge.question.text + " =";
    document.getElementById("challenge-input").value = "";
    document.getElementById("challenge-status").textContent = "Question " + (challenge.index + 1) + " / " + challenge.total;
  }

  document.getElementById("challenge-start").addEventListener("click", function () {
    if (L.load().dailyChallengeDone) return;
    challenge.active = true;
    challenge.index = 0;
    challenge.correct = 0;
    document.getElementById("challenge-problem").hidden = false;
    document.getElementById("challenge-form").hidden = false;
    document.getElementById("challenge-start").hidden = true;
    nextChallengeQuestion();
    document.getElementById("challenge-input").focus();
  });

  document.getElementById("challenge-form").addEventListener("submit", function (event) {
    event.preventDefault();
    if (!challenge.active || !challenge.question) return;
    var parsed = parseAnswer(document.getElementById("challenge-input").value, challenge.question.operation);
    var ok = isCorrect(parsed, challenge.question);
    document.getElementById("challenge-feedback").textContent = ok ? "Correct" : ("Incorrect · " + challenge.question.answer);
    document.getElementById("challenge-feedback").dataset.state = ok ? "correct" : "incorrect";
    if (ok) {
      challenge.correct += 1;
      L.addCorrect(5);
    }
    challenge.index += 1;
    if (challenge.index >= challenge.total) {
      challenge.active = false;
      L.completeDailyChallenge(challenge.correct);
      document.getElementById("challenge-form").hidden = true;
      document.getElementById("challenge-problem").hidden = true;
    } else {
      nextChallengeQuestion();
    }
    renderStats();
  });

  if (hasStarted()) showTraining(false);
  else showWelcome();
})();