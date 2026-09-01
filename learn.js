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

  /*
   * ============================
   * STATS
   * ============================
   */

  function renderStats() {
    var state = L.load();

    if ($("stat-score")) {
      $("stat-score").textContent = String(state.score);
    }

    if ($("stat-streak")) {
      $("stat-streak").textContent =
        state.streak +
        " day" +
        (state.streak === 1 ? "" : "s");
    }

    if ($("stat-progress")) {
      $("stat-progress").textContent =
        L.progressPercent(state) + "%";
    }

    if ($("stat-lessons")) {
      $("stat-lessons").textContent =
        state.completedLessons.length +
        " / " +
        L.LESSONS.length;
    }

    if ($("stat-level")) {
      $("stat-level").textContent =
        L.levelName(state);
    }

    if ($("stat-goal")) {
      $("stat-goal").textContent =
        state.dailyGoal +
        " / " +
        state.dailyGoalTarget;
    }

    /*
     * IMPORTANT:
     * L.nextLesson() always returns a lesson,
     * but we still check for safety.
     */
    var next = L.nextLesson(state);

    if (next && $("continue-card")) {
      var answered =
        state.lessonProgress &&
        typeof state.lessonProgress[next.id] === "number"
          ? state.lessonProgress[next.id]
          : 0;

      var pct = Math.round(
        (Math.min(answered, 5) / 5) * 100
      );

      $("continue-card").textContent =
        next.title +
        " · Progress: " +
        pct +
        "%";
    }

    /*
     * Daily challenge state
     */
    if ($("challenge-start")) {
      $("challenge-start").hidden =
        !!state.dailyChallengeDone;
    }

    if (
      state.dailyChallengeDone &&
      $("challenge-status")
    ) {
      $("challenge-status").textContent =
        "Today's challenge complete · " +
        state.dailyChallengeCorrect +
        " / 5 correct.";
    }

    /*
     * Achievements
     */
    if ($("achievement-list")) {
      $("achievement-list").innerHTML =
        L.ACHIEVEMENTS.map(function (item) {
          var unlocked =
            state.unlockedAchievements.indexOf(
              item.id
            ) !== -1;

          return (
            "<li>" +
            "<span>" +
            item.title +
            "</span>" +
            "<span>" +
            (unlocked
              ? "Unlocked"
              : "Locked") +
            "</span>" +
            "</li>"
          );
        }).join("");
    }
  }

  /*
   * ============================
   * LESSON LIST
   * ============================
   */

  function renderLessons() {
    var list = $("lesson-list");

    if (!list) {
      return;
    }

    var state = L.load();

    list.innerHTML = L.LESSONS.map(function (lesson) {
      var done =
        state.completedLessons.indexOf(
          lesson.id
        ) !== -1;

      var answered =
        state.lessonProgress &&
        typeof state.lessonProgress[lesson.id] ===
          "number"
          ? state.lessonProgress[lesson.id]
          : 0;

      var pct = done
        ? 100
        : Math.round(
            (Math.min(answered, 5) / 5) * 100
          );

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

          '<p class="lede">' +
          "Difficulty: " +
          lesson.difficulty +
          " · Progress: " +
          pct +
          "%" +
          "</p>" +

          '<button type="button" ' +
          'class="primary-btn" ' +
          'data-lesson="' +
          lesson.id +
          '">' +
          label +
          "</button>" +

        "</article>"
      );
    }).join("");
  }

  /*
   * This function is called by learn.html
   * after Start Your Math Journey is clicked.
   */
  window.MQGLearnRender = function () {
    renderStats();
    renderLessons();
  };

  /*
   * ============================
   * QUESTION GENERATION
   * ============================
   */

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
      /*
       * Generate clean whole-number division.
       */
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
      return {
        ok: false
      };
    }

    if (operation === "/") {
      var asFloat = Number(text);

      return {
        ok: Number.isFinite(asFloat),
        value: asFloat
      };
    }

    if (!/^-?\d+$/.test(text)) {
      return {
        ok: false
      };
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
        Math.abs(
          parsed.value - question.answer
        ) < 0.01
      );
    }

    return (
      parsed.value === question.answer
    );
  }

  /*
   * ============================
   * LESSON PRACTICE
   * ============================
   */

  function showPractice(show) {
    if ($("lesson-practice")) {
      $("lesson-practice").hidden = !show;
    }

    if ($("lesson-list")) {
      $("lesson-list").hidden = show;
    }
  }

  function nextPracticeQuestion() {
    if (
      !practice.lesson ||
      !practice.lesson.ops
    ) {
      return;
    }

    practice.question =
      generateQuestion(
        practice.lesson.ops,
        practice.lesson.difficulty === "Hard"
      );

    if ($("lesson-problem")) {
      $("lesson-problem").textContent =
        practice.question.text + " =";
    }

    if ($("lesson-practice-meta")) {
      $("lesson-practice-meta").textContent =
        "Question " +
        (practice.index + 1) +
        " / " +
        practice.total;
    }

    if ($("lesson-input")) {
      $("lesson-input").value = "";
      $("lesson-input").focus();
    }
  }

  function startLesson(id) {
    var lesson =
      L.LESSONS.find(function (item) {
        return item.id === id;
      });

    if (!lesson) {
      console.error(
        "Lesson not found:",
        id
      );
      return;
    }

    L.setCurrentLesson(id);

    practice.active = true;
    practice.lesson = lesson;
    practice.index = 0;
    practice.correct = 0;

    if ($("lesson-practice-title")) {
      $("lesson-practice-title").textContent =
        lesson.title;
    }

    if ($("lesson-feedback")) {
      $("lesson-feedback").textContent = "";
      $("lesson-feedback").dataset.state = "";
    }

    showPractice(true);

    nextPracticeQuestion();
    renderStats();

    if ($("lesson-practice")) {
      $("lesson-practice").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  /*
   * Continue Learning button
   */
  on(
    "continue-learning",
    "click",
    function () {
      var next = L.nextLesson(
        L.load()
      );

      if (next) {
        startLesson(next.id);
      }
    }
  );

  /*
   * Lesson Start / Continue buttons
   */
  on(
    "lesson-list",
    "click",
    function (event) {
      var target = event.target;

      if (!target) {
        return;
      }

      var btn =
        target.closest("[data-lesson]");

      if (btn) {
        startLesson(
          btn.getAttribute(
            "data-lesson"
          )
        );
      }
    }
  );

  /*
   * Exit lesson
   */
  on(
    "lesson-exit",
    "click",
    function () {
      practice.active = false;
      practice.lesson = null;
      practice.question = null;

      showPractice(false);

      renderLessons();
      renderStats();
    }
  );

  /*
   * Submit lesson answer
   */
  on(
    "lesson-form",
    "submit",
    function (event) {
      event.preventDefault();

      if (
        !practice.active ||
        !practice.question ||
        !$("lesson-input")
      ) {
        return;
      }

      var parsed =
        parseAnswer(
          $("lesson-input").value,
          practice.question.operation
        );

      var ok =
        isCorrect(
          parsed,
          practice.question
        );

      if ($("lesson-feedback")) {
        $("lesson-feedback").textContent =
          ok
            ? "Correct"
            : "Incorrect · " +
              practice.question.answer;

        $("lesson-feedback").dataset.state =
          ok
            ? "correct"
            : "incorrect";
      }

      if (ok) {
        practice.correct += 1;
        L.addCorrect(5);
      }

      practice.index += 1;

      L.setLessonProgress(
        practice.lesson.id,
        practice.index
      );

      /*
       * Finish lesson
       */
      if (
        practice.index >=
        practice.total
      ) {
        if (practice.correct >= 3) {
          L.completeLesson(
            practice.lesson.id
          );
        }

        practice.active = false;
        practice.question = null;

        showPractice(false);

        renderLessons();
      } else {
        nextPracticeQuestion();
      }

      renderStats();
    }
  );

  /*
   * ============================
   * DAILY CHALLENGE
   * ============================
   */

  function nextChallengeQuestion() {
    challenge.question =
      generateQuestion(
        ["+", "-", "*", "/"],
        false
      );

    if ($("challenge-problem")) {
      $("challenge-problem").textContent =
        challenge.question.text + " =";
    }

    if ($("challenge-input")) {
      $("challenge-input").value = "";
    }

    if ($("challenge-status")) {
      $("challenge-status").textContent =
        "Question " +
        (challenge.index + 1) +
        " / " +
        challenge.total;
    }
  }

  /*
   * Start daily challenge
   */
  on(
    "challenge-start",
    "click",
    function () {
      if (
        L.load().dailyChallengeDone
      ) {
        return;
      }

      challenge.active = true;
      challenge.index = 0;
      challenge.correct = 0;

      if ($("challenge-problem")) {
        $("challenge-problem").hidden =
          false;
      }

      if ($("challenge-form")) {
        $("challenge-form").hidden =
          false;
      }

      if ($("challenge-start")) {
        $("challenge-start").hidden =
          true;
      }

      if ($("challenge-feedback")) {
        $("challenge-feedback").textContent =
          "";
      }

      nextChallengeQuestion();

      if ($("challenge-input")) {
        $("challenge-input").focus();
      }
    }
  );

  /*
   * Submit daily challenge answer
   */
  on(
    "challenge-form",
    "submit",
    function (event) {
      event.preventDefault();

      if (
        !challenge.active ||
        !challenge.question ||
        !$("challenge-input")
      ) {
        return;
      }

      var parsed =
        parseAnswer(
          $("challenge-input").value,
          challenge.question.operation
        );

      var ok =
        isCorrect(
          parsed,
          challenge.question
        );

      if ($("challenge-feedback")) {
        $("challenge-feedback").textContent =
          ok
            ? "Correct"
            : "Incorrect · " +
              challenge.question.answer;

        $("challenge-feedback").dataset.state =
          ok
            ? "correct"
            : "incorrect";
      }

      if (ok) {
        challenge.correct += 1;
        L.addCorrect(5);
      }

      challenge.index += 1;

      /*
       * Challenge finished
       */
      if (
        challenge.index >=
        challenge.total
      ) {
        challenge.active = false;
        challenge.question = null;

        L.completeDailyChallenge(
          challenge.correct
        );

        if ($("challenge-form")) {
          $("challenge-form").hidden =
            true;
        }

        if ($("challenge-problem")) {
          $("challenge-problem").hidden =
            true;
        }

        if ($("challenge-start")) {
          $("challenge-start").hidden =
            true;
        }
      } else {
        nextChallengeQuestion();
      }

      renderStats();
    }
  );

  /*
   * ============================
   * INITIALIZATION
   * ============================
   *
   * Do NOT handle the Start Your Math
   * Journey button here.
   *
   * learn.html already handles it with:
   * startMathJourney()
   *
   * This file only exposes:
   * window.MQGLearnRender()
   */

  function initialize() {
    try {
      renderStats();
      renderLessons();
    } catch (error) {
      console.error(
        "Math Quiz Learn initialization error:",
        error
      );
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );
  } else {
    initialize();
  }
})();
```
