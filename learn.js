```javascript
(function () {
  "use strict";

  var L = window.MQGLearn;

  if (!L) {
    console.error("learn-store.js did not load");
    return;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function on(id, eventName, handler) {
    var el = $(id);
    if (el) {
      el.addEventListener(eventName, handler);
    }
  }

  var practice = {
    active: false,
    lesson: null,
    index: 0,
    correct: 0,
    question: null,
    total: 5
  };

  var challenge = {
    active: false,
    index: 0,
    correct: 0,
    question: null,
    total: 5
  };

  function renderStats() {
    var state = L.load();

    if ($("stat-score")) {
      $("stat-score").textContent = String(state.score);
    }

    if ($("stat-streak")) {
      $("stat-streak").textContent =
        state.streak + " day" + (state.streak === 1 ? "" : "s");
    }

    if ($("stat-progress")) {
      $("stat-progress").textContent = L.progressPercent(state) + "%";
    }

    if ($("stat-lessons")) {
      $("stat-lessons").textContent =
        state.completedLessons.length + " / " + L.LESSONS.length;
    }

    if ($("stat-level")) {
      $("stat-level").textContent = L.levelName(state);
    }

    if ($("stat-goal")) {
      $("stat-goal").textContent =
        state.dailyGoal + " / " + state.dailyGoalTarget;
    }

    var next = L.nextLesson(state);

    if (next) {
      var pct = Math.round(
        ((state.lessonProgress[next.id] || 0) / 5) * 100
      );

      if ($("continue-card")) {
        $("continue-card").textContent =
          next.title + " · Progress: " + pct + "%";
      }
    }

    if ($("challenge-start")) {
      $("challenge-start").hidden = state.dailyChallengeDone;
    }

    if (state.dailyChallengeDone && $("challenge-status")) {
      $("challenge-status").textContent =
        "Today’s challenge complete · " +
        state.dailyChallengeCorrect +
        " / 5 correct.";
    }

    if ($("achievement-list")) {
      $("achievement-list").innerHTML = L.ACHIEVEMENTS.map(function (item) {
        var unlocked =
          state.unlockedAchievements.indexOf(item.id) !== -1;

        return (
          "<li>" +
          "<span>" +
          item.title +
          "</span>" +
          "<span>" +
          (unlocked ? "Unlocked" : "Locked") +
          "</span>" +
          "</li>"
        );
      }).join("");
    }
  }

  function renderLessons() {
    var list = $("lesson-list");

    if (!list) {
      return;
    }

    var state = L.load();

    list.innerHTML = L.LESSONS.map(function (lesson) {
      var done =
        state.completedLessons.indexOf(lesson.id) !== -1;

      var answered =
        state.lessonProgress[lesson.id] || 0;

      var pct = done
        ? 100
        : Math.round((answered / 5) * 100);

      var label = done
        ? "Completed"
        : answered
          ? "Continue"
          : "Start";

      return (
        '<article class="lesson-card">' +
        "<h3>" +
        lesson.title +
        "</h3>" +
        '<p class="lede">' +
        lesson.description +
        "</p>" +
        '<p class="lede">Difficulty: ' +
        lesson.difficulty +
        " · Progress: " +
        pct +
        "%</p>" +
        '<button type="button" class="primary-btn" data-lesson="' +
        lesson.id +
        '">' +
        label +
        "</button>" +
        "</article>"
      );
    }).join("");
  }

  window.MQGLearnRender = function () {
    renderStats();
    renderLessons();
  };

  function randInt(min, max) {
    return Math.floor(
      Math.random() * (max - min + 1)
    ) + min;
  }

  function generateQuestion(ops, hard) {
    var operation =
      ops[randInt(0, ops.length - 1)];

    var max = hard ? 20 : 12;

    var a = randInt(1, max);
    var b = randInt(1, max);
    var answer;

    if (operation === "+") {
      answer = a + b;
    } else if (operation === "-") {
      answer = a - b;
    } else if (operation === "*") {
      answer = a * b;
    } else {
      b = randInt(1, max);
      answer = randInt(1, 10);
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

    if (!text) {
      return { ok: false };
    }

    if (operation === "/") {
      var asFloat = Number(text);

      return {
        ok: Number.isFinite(asFloat),
        value: asFloat
      };
    }

    if (!/^-?\d+$/.test(text)) {
      return { ok: false };
    }

    return {
      ok: true,
      value: parseInt(text, 10)
    };
  }

  function isCorrect(parsed, question) {
    if (!parsed.ok) {
      return false;
    }

    if (question.operation === "/") {
      return (
        Math.abs(parsed.value - question.answer) < 0.01
      );
    }

    return parsed.value === question.answer;
  }

  function showPractice(show) {
    if ($("lesson-practice")) {
      $("lesson-practice").hidden = !show;
    }

    if ($("lesson-list")) {
      $("lesson-list").hidden = show;
    }
  }

  function nextPracticeQuestion() {
    practice.question = generateQuestion(
      practice.lesson.ops,
      practice.lesson.difficulty === "Hard"
    );

    $("lesson-problem").textContent =
      practice.question.text + " =";

    $("lesson-practice-meta").textContent =
      "Question " +
      (practice.index + 1) +
      " / " +
      practice.total;

    $("lesson-input").value = "";
    $("lesson-input").focus();
  }

  function startLesson(id) {
    var lesson = L.LESSONS.find(function (item) {
      return item.id === id;
    });

    if (!lesson) {
      return;
    }

    L.setCurrentLesson(id);

    practice.active = true;
    practice.lesson = lesson;
    practice.index = 0;
    practice.correct = 0;

    $("lesson-practice-title").textContent =
      lesson.title;

    $("lesson-feedback").textContent = "";

    showPractice(true);
    nextPracticeQuestion();
    renderStats();
  }

  /*
   * START YOUR MATH JOURNEY
   *
   * This was missing from the previous version.
   * It hides the welcome screen and opens the learning app.
   */
  on("start-learning", "click", function () {
    var welcomeScreen = $("welcome-screen");
    var learnApp = $("learn-app");

    if (welcomeScreen) {
      welcomeScreen.hidden = true;
    }

    if (learnApp) {
      learnApp.hidden = false;
    }

    renderStats();
    renderLessons();

    if (learnApp) {
      learnApp.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });

  on("continue-learning", "click", function () {
    var next = L.nextLesson(L.load());

    if (next) {
      startLesson(next.id);
    }
  });

  on("lesson-list", "click", function (event) {
    var btn = event.target.closest("[data-lesson]");

    if (btn) {
      startLesson(
        btn.getAttribute("data-lesson")
      );
    }
  });

  on("lesson-exit", "click", function () {
    practice.active = false;

    showPractice(false);
    renderLessons();
    renderStats();
  });

  on("lesson-form", "submit", function (event) {
    event.preventDefault();

    if (!practice.active || !practice.question) {
      return;
    }

    var parsed = parseAnswer(
      $("lesson-input").value,
      practice.question.operation
    );

    var ok = isCorrect(
      parsed,
      practice.question
    );

    $("lesson-feedback").textContent = ok
      ? "Correct"
      : "Incorrect · " + practice.question.answer;

    $("lesson-feedback").dataset.state =
      ok ? "correct" : "incorrect";

    if (ok) {
      practice.correct += 1;
      L.addCorrect(5);
    }

    practice.index += 1;

    L.setLessonProgress(
      practice.lesson.id,
      practice.index
    );

    if (practice.index >= practice.total) {
      if (practice.correct >= 3) {
        L.completeLesson(
          practice.lesson.id
        );
      }

      practice.active = false;
      showPractice(false);
      renderLessons();
    } else {
      nextPracticeQuestion();
    }

    renderStats();
  });

  function nextChallengeQuestion() {
    challenge.question = generateQuestion(
      ["+", "-", "*", "/"],
      false
    );

    $("challenge-problem").textContent =
      challenge.question.text + " =";

    $("challenge-input").value = "";

    $("challenge-status").textContent =
      "Question " +
      (challenge.index + 1) +
      " / " +
      challenge.total;
  }

  on("challenge-start", "click", function () {
    if (L.load().dailyChallengeDone) {
      return;
    }

    challenge.active = true;
    challenge.index = 0;
    challenge.correct = 0;

    $("challenge-problem").hidden = false;
    $("challenge-form").hidden = false;
    $("challenge-start").hidden = true;

    nextChallengeQuestion();
    $("challenge-input").focus();
  });

  on("challenge-form", "submit", function (event) {
    event.preventDefault();

    if (!challenge.active || !challenge.question) {
      return;
    }

    var parsed = parseAnswer(
      $("challenge-input").value,
      challenge.question.operation
    );

    var ok = isCorrect(
      parsed,
      challenge.question
    );

    $("challenge-feedback").textContent = ok
      ? "Correct"
      : "Incorrect · " + challenge.question.answer;

    $("challenge-feedback").dataset.state =
      ok ? "correct" : "incorrect";

    if (ok) {
      challenge.correct += 1;
      L.addCorrect(5);
    }

    challenge.index += 1;

    if (challenge.index >= challenge.total) {
      challenge.active = false;

      L.completeDailyChallenge(
        challenge.correct
      );

      $("challenge-form").hidden = true;
      $("challenge-problem").hidden = true;
    } else {
      nextChallengeQuestion();
    }

    renderStats();
  });

  /*
   * Initial render.
   *
   * Only render the learning content if the page
   * elements already exist.
   */
  function initialize() {
    renderStats();
    renderLessons();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );
  } else {
    initialize();
  }
})();
```
