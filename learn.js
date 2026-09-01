```javascript
(function () {
  "use strict";

  /*
   * MathQuizGame - Learn Math
   *
   * This file is designed to work with the CURRENT:
   *   learn.html
   *   learn-store.js
   *
   * It does not replace or duplicate the store.
   */

  var L = window.MQGLearn;

  if (!L) {
    console.error(
      "MathQuizGame Learn: learn-store.js was not loaded."
    );
    return;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function on(id, eventName, handler) {
    var element = $(id);

    if (!element) {
      return;
    }

    element.addEventListener(
      eventName,
      handler
    );
  }


  /* =========================================================
     PRACTICE STATE
     ========================================================= */

  var practice = {
    active: false,
    lesson: null,
    index: 0,
    correct: 0,
    question: null,
    total: 5
  };


  /* =========================================================
     DAILY CHALLENGE STATE
     ========================================================= */

  var challenge = {
    active: false,
    index: 0,
    correct: 0,
    question: null,
    total: 5
  };


  /* =========================================================
     SAFE RENDER
     ========================================================= */

  function renderStats() {
    var state;

    try {
      state = L.load();
    } catch (error) {
      console.error(
        "Learn Math: unable to load state.",
        error
      );
      return;
    }

    if (!state) {
      return;
    }


    /* Score */

    var score = $("stat-score");

    if (score) {
      score.textContent =
        String(state.score || 0);
    }


    /* Streak */

    var streak = $("stat-streak");

    if (streak) {
      var streakNumber =
        Number(state.streak || 0);

      streak.textContent =
        streakNumber +
        " day" +
        (
          streakNumber === 1
            ? ""
            : "s"
        );
    }


    /* Overall progress */

    var progress = $("stat-progress");

    if (progress) {
      try {
        progress.textContent =
          L.progressPercent(state) +
          "%";
      } catch (error) {
        progress.textContent = "0%";
      }
    }


    /* Lessons */

    var lessons = $("stat-lessons");

    if (lessons) {
      lessons.textContent =
        state.completedLessons.length +
        " / " +
        L.LESSONS.length;
    }


    /* Level */

    var level = $("stat-level");

    if (level) {
      try {
        level.textContent =
          L.levelName(state);
      } catch (error) {
        level.textContent =
          "New learner";
      }
    }


    /* Daily goal */

    var goal = $("stat-goal");

    if (goal) {
      goal.textContent =
        (state.dailyGoal || 0) +
        " / " +
        (state.dailyGoalTarget || 5);
    }


    /* Continue card */

    var continueCard =
      $("continue-card");

    if (continueCard) {
      try {
        var next =
          L.nextLesson(state);

        if (next) {
          var answered =
            Number(
              state.lessonProgress[next.id] ||
              0
            );

          var pct =
            Math.round(
              (
                Math.min(
                  answered,
                  5
                ) / 5
              ) * 100
            );

          continueCard.textContent =
            next.title +
            " · Progress: " +
            pct +
            "%";
        }
      } catch (error) {
        continueCard.textContent =
          "Start your first lesson";
      }
    }


    /* Daily challenge button */

    var challengeStart =
      $("challenge-start");

    if (challengeStart) {
      challengeStart.hidden =
        state.dailyChallengeDone === true;
    }


    /* Daily challenge status */

    var challengeStatus =
      $("challenge-status");

    if (
      challengeStatus &&
      state.dailyChallengeDone
    ) {
      challengeStatus.textContent =
        "Today's challenge complete · " +
        (state.dailyChallengeCorrect || 0) +
        " / 5 correct.";
    }


    /* Achievements */

    var achievementList =
      $("achievement-list");

    if (
      achievementList &&
      Array.isArray(L.ACHIEVEMENTS)
    ) {

      achievementList.innerHTML = "";

      L.ACHIEVEMENTS.forEach(
        function (item) {

          var li =
            document.createElement(
              "li"
            );

          var title =
            document.createElement(
              "span"
            );

          var status =
            document.createElement(
              "span"
            );

          var unlocked =
            Array.isArray(
              state.unlockedAchievements
            ) &&
            state.unlockedAchievements.indexOf(
              item.id
            ) !== -1;

          title.textContent =
            item.title;

          status.textContent =
            unlocked
              ? "Unlocked"
              : "Locked";

          li.appendChild(title);
          li.appendChild(status);

          achievementList.appendChild(
            li
          );

        }
      );
    }
  }


  /* =========================================================
     LESSON RENDERING
     ========================================================= */

  function renderLessons() {
    var list =
      $("lesson-list");

    if (!list) {
      return;
    }

    var state;

    try {
      state = L.load();
    } catch (error) {
      console.error(
        "Learn Math: unable to load lesson state.",
        error
      );
      return;
    }


    if (
      !Array.isArray(L.LESSONS)
    ) {
      list.innerHTML = "";
      return;
    }


    list.innerHTML = "";


    L.LESSONS.forEach(
      function (lesson) {

        var card =
          document.createElement(
            "article"
          );

        card.className =
          "lesson-card";


        var heading =
          document.createElement(
            "h3"
          );

        heading.textContent =
          lesson.title;


        var description =
          document.createElement(
            "p"
          );

        description.className =
          "lede";

        description.textContent =
          lesson.description;


        var progress =
          document.createElement(
            "p"
          );

        progress.className =
          "lede";


        var done =
          state.completedLessons.indexOf(
            lesson.id
          ) !== -1;


        var answered =
          Number(
            state.lessonProgress[
              lesson.id
            ] || 0
          );


        var percentage =
          done
            ? 100
            : Math.round(
                (
                  Math.min(
                    answered,
                    5
                  ) / 5
                ) * 100
              );


        progress.textContent =
          "Difficulty: " +
          lesson.difficulty +
          " · Progress: " +
          percentage +
          "%";


        var button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.className =
          "primary-btn";

        button.setAttribute(
          "data-lesson",
          lesson.id
        );

        button.textContent =
          done
            ? "Completed"
            : answered
              ? "Continue"
              : "Start";


        card.appendChild(
          heading
        );

        card.appendChild(
          description
        );

        card.appendChild(
          progress
        );

        card.appendChild(
          button
        );

        list.appendChild(
          card
        );

      }
    );
  }


  /*
   * Public render function used by
   * the existing learn.html.
   */
  window.MQGLearnRender =
    function () {

      try {
        renderStats();
      } catch (error) {
        console.error(
          "Learn Math: stats rendering failed.",
          error
        );
      }

      try {
        renderLessons();
      } catch (error) {
        console.error(
          "Learn Math: lesson rendering failed.",
          error
        );
      }
    };


  /* =========================================================
     QUESTION GENERATION
     ========================================================= */

  function randInt(min, max) {
    return Math.floor(
      Math.random() *
      (max - min + 1)
    ) + min;
  }


  function generateQuestion(
    operations,
    hard
  ) {

    if (
      !Array.isArray(operations) ||
      operations.length === 0
    ) {
      operations = ["+"];
    }


    var operation =
      operations[
        randInt(
          0,
          operations.length - 1
        )
      ];


    var max =
      hard
        ? 20
        : 12;


    var a =
      randInt(1, max);

    var b =
      randInt(1, max);

    var answer;


    if (operation === "+") {

      answer =
        a + b;

    } else if (
      operation === "-"
    ) {

      answer =
        a - b;

    } else if (
      operation === "*"
    ) {

      answer =
        a * b;

    } else {

      /*
       * Always generate exact
       * whole-number division.
       */

      b =
        randInt(1, max);

      answer =
        randInt(1, 10);

      a =
        b * answer;

    }


    return {
      text:
        a +
        " " +
        operation +
        " " +
        b,

      answer:
        answer,

      operation:
        operation
    };
  }


  /* =========================================================
     ANSWER PARSING
     ========================================================= */

  function parseAnswer(
    raw,
    operation
  ) {

    var text =
      String(raw == null ? "" : raw)
        .trim();


    if (!text) {
      return {
        ok: false
      };
    }


    if (
      operation === "/"
    ) {

      var decimal =
        Number(text);

      return {
        ok:
          Number.isFinite(
            decimal
          ),

        value:
          decimal
      };
    }


    if (
      !/^-?\d+$/.test(text)
    ) {

      return {
        ok: false
      };

    }


    return {
      ok: true,
      value: parseInt(
        text,
        10
      )
    };
  }


  function isCorrect(
    parsed,
    question
  ) {

    if (
      !parsed ||
      !parsed.ok ||
      !question
    ) {
      return false;
    }


    if (
      question.operation === "/"
    ) {

      return (
        Math.abs(
          parsed.value -
          question.answer
        ) < 0.01
      );

    }


    return (
      parsed.value ===
      question.answer
    );
  }


  /* =========================================================
     PRACTICE VISIBILITY
     ========================================================= */

  function showPractice(
    show
  ) {

    var practicePanel =
      $("lesson-practice");

    var lessonList =
      $("lesson-list");


    if (practicePanel) {
      practicePanel.hidden =
        !show;
    }


    if (lessonList) {
      lessonList.hidden =
        show;
    }
  }


  /* =========================================================
     NEXT LESSON QUESTION
     ========================================================= */

  function nextPracticeQuestion() {

    if (
      !practice.lesson
    ) {
      return;
    }


    practice.question =
      generateQuestion(
        practice.lesson.ops,
        practice.lesson.difficulty ===
          "Hard"
      );


    var problem =
      $("lesson-problem");

    if (problem) {
      problem.textContent =
        practice.question.text +
        " =";
    }


    var meta =
      $("lesson-practice-meta");

    if (meta) {
      meta.textContent =
        "Question " +
        (practice.index + 1) +
        " / " +
        practice.total;
    }


    var input =
      $("lesson-input");

    if (input) {
      input.value = "";

      try {
        input.focus();
      } catch (error) {}
    }
  }


  /* =========================================================
     START LESSON
     ========================================================= */

  function startLesson(
    id
  ) {

    if (
      !Array.isArray(L.LESSONS)
    ) {
      return;
    }


    var lesson =
      L.LESSONS.find(
        function (item) {
          return item.id === id;
        }
      );


    if (!lesson) {
      return;
    }


    try {
      L.setCurrentLesson(
        id
      );
    } catch (error) {
      console.error(
        "Learn Math: could not set current lesson.",
        error
      );
      return;
    }


    practice.active =
      true;

    practice.lesson =
      lesson;

    practice.index =
      0;

    practice.correct =
      0;


    var title =
      $("lesson-practice-title");

    if (title) {
      title.textContent =
        lesson.title;
    }


    var feedback =
      $("lesson-feedback");

    if (feedback) {
      feedback.textContent =
        "";

      feedback.dataset.state =
        "";
    }


    showPractice(true);

    nextPracticeQuestion();

    renderStats();
  }


  /* =========================================================
     CONTINUE LEARNING
     ========================================================= */

  on(
    "continue-learning",
    "click",
    function () {

      try {

        var state =
          L.load();

        var next =
          L.nextLesson(state);

        if (next) {
          startLesson(
            next.id
          );
        }

      } catch (error) {

        console.error(
          "Learn Math: Continue Learning failed.",
          error
        );

      }

    }
  );


  /* =========================================================
     LESSON BUTTONS
     ========================================================= */

  on(
    "lesson-list",
    "click",
    function (event) {

      var target =
        event.target;


      /*
       * closest() is not assumed to exist.
       */
      while (
        target &&
        target !== event.currentTarget
      ) {

        if (
          target.hasAttribute &&
          target.hasAttribute(
            "data-lesson"
          )
        ) {

          startLesson(
            target.getAttribute(
              "data-lesson"
            )
          );

          return;
        }


        target =
          target.parentElement;
      }

    }
  );


  /* =========================================================
     EXIT LESSON
     ========================================================= */

  on(
    "lesson-exit",
    "click",
    function () {

      practice.active =
        false;

      practice.lesson =
        null;

      practice.question =
        null;

      showPractice(false);

      renderLessons();

      renderStats();

    }
  );


  /* =========================================================
     LESSON ANSWER
     ========================================================= */

  on(
    "lesson-form",
    "submit",
    function (event) {

      event.preventDefault();


      if (
        !practice.active ||
        !practice.question
      ) {
        return;
      }


      var input =
        $("lesson-input");


      var parsed =
        parseAnswer(
          input
            ? input.value
            : "",
          practice.question.operation
        );


      var correct =
        isCorrect(
          parsed,
          practice.question
        );


      var feedback =
        $("lesson-feedback");


      if (feedback) {

        feedback.textContent =
          correct
            ? "Correct"
            : "Incorrect · " +
              practice.question.answer;

        feedback.dataset.state =
          correct
            ? "correct"
            : "incorrect";
      }


      if (correct) {

        practice.correct += 1;


        try {
          L.addCorrect(5);
        } catch (error) {
          console.error(
            "Learn Math: could not save correct answer.",
            error
          );
        }

      }


      practice.index += 1;


      try {

        L.setLessonProgress(
          practice.lesson.id,
          practice.index
        );

      } catch (error) {

        console.error(
          "Learn Math: could not save lesson progress.",
          error
        );

      }


      if (
        practice.index >=
        practice.total
      ) {

        /*
         * 3/5 or better completes a lesson.
         */

        if (
          practice.correct >= 3
        ) {

          try {
            L.completeLesson(
              practice.lesson.id
            );
          } catch (error) {
            console.error(
              "Learn Math: could not complete lesson.",
              error
            );
          }

        }


        practice.active =
          false;

        practice.lesson =
          null;

        practice.question =
          null;


        showPractice(false);

        renderLessons();

      } else {

        nextPracticeQuestion();

      }


      renderStats();

    }
  );


  /* =========================================================
     DAILY CHALLENGE
     ========================================================= */

  function nextChallengeQuestion() {

    challenge.question =
      generateQuestion(
        ["+", "-", "*", "/"],
        false
      );


    var problem =
      $("challenge-problem");

    if (problem) {
      problem.textContent =
        challenge.question.text +
        " =";
    }


    var input =
      $("challenge-input");

    if (input) {
      input.value = "";
    }


    var status =
      $("challenge-status");

    if (status) {
      status.textContent =
        "Question " +
        (challenge.index + 1) +
        " / " +
        challenge.total;
    }


    if (input) {
      try {
        input.focus();
      } catch (error) {}
    }

  }


  /* =========================================================
     START DAILY CHALLENGE
     ========================================================= */

  on(
    "challenge-start",
    "click",
    function () {

      try {

        var state =
          L.load();


        if (
          state.dailyChallengeDone
        ) {
          return;
        }


        challenge.active =
          true;

        challenge.index =
          0;

        challenge.correct =
          0;


        var problem =
          $("challenge-problem");

        if (problem) {
          problem.hidden =
            false;
        }


        var form =
          $("challenge-form");

        if (form) {
          form.hidden =
            false;
        }


        var button =
          $("challenge-start");

        if (button) {
          button.hidden =
            true;
        }


        var feedback =
          $("challenge-feedback");

        if (feedback) {
          feedback.textContent =
            "";

          feedback.dataset.state =
            "";
        }


        nextChallengeQuestion();

      } catch (error) {

        console.error(
          "Learn Math: daily challenge could not start.",
          error
        );

      }

    }
  );


  /* =========================================================
     DAILY CHALLENGE ANSWER
     ========================================================= */

  on(
    "challenge-form",
    "submit",
    function (event) {

      event.preventDefault();


      if (
        !challenge.active ||
        !challenge.question
      ) {
        return;
      }


      var input =
        $("challenge-input");


      var parsed =
        parseAnswer(
          input
            ? input.value
            : "",
          challenge.question.operation
        );


      var correct =
        isCorrect(
          parsed,
          challenge.question
        );


      var feedback =
        $("challenge-feedback");


      if (feedback) {

        feedback.textContent =
          correct
            ? "Correct"
            : "Incorrect · " +
              challenge.question.answer;

        feedback.dataset.state =
          correct
            ? "correct"
            : "incorrect";

      }


      if (correct) {
        challenge.correct += 1;

        try {
          L.addCorrect(5);
        } catch (error) {
          console.error(
            "Learn Math: could not save challenge answer.",
            error
          );
        }
      }


      challenge.index += 1;


      if (
        challenge.index >=
        challenge.total
      ) {

        challenge.active =
          false;


        try {

          L.completeDailyChallenge(
            challenge.correct
          );

        } catch (error) {

          console.error(
            "Learn Math: could not complete daily challenge.",
            error
          );

        }


        var form =
          $("challenge-form");

        if (form) {
          form.hidden =
            true;
        }


        var problem =
          $("challenge-problem");

        if (problem) {
          problem.hidden =
            true;
        }


        var status =
          $("challenge-status");

        if (status) {
          status.textContent =
            "Today's challenge complete · " +
            challenge.correct +
            " / 5 correct.";
        }

      } else {

        nextChallengeQuestion();

      }


      renderStats();

    }
  );


  /* =========================================================
     INITIAL RENDER
     ========================================================= */

  function initialize() {

    /*
     * Do not change the welcome screen here.
     *
     * learn.html already controls whether the
     * welcome screen or learning app is visible.
     */

    try {
      window.MQGLearnRender();
    } catch (error) {
      console.error(
        "Learn Math: initial render failed.",
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
