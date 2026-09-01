(function (global) {
  "use strict";

  var LEARN_KEY = "mqg-learn";
  var DAILY_KEY = "mqg-daily";

  var LESSONS = [
    { id: "addition", title: "Addition", description: "Add whole numbers quickly and accurately.", difficulty: "Easy", ops: ["+"] },
    { id: "subtraction", title: "Subtraction", description: "Subtract whole numbers, including results that can be negative.", difficulty: "Easy", ops: ["-"] },
    { id: "multiplication", title: "Multiplication", description: "Build fluency with multiplication facts.", difficulty: "Medium", ops: ["*"] },
    { id: "division", title: "Division", description: "Practice whole-number division.", difficulty: "Medium", ops: ["/"] },
    { id: "fractions", title: "Fractions", description: "Work with simple fraction amounts using related whole-number practice.", difficulty: "Medium", ops: ["/", "*"] },
    { id: "percentages", title: "Percentages", description: "Connect percents to multiplication and division.", difficulty: "Medium", ops: ["*", "/"] },
    { id: "mental-math", title: "Mental Math", description: "Mixed short problems to build speed.", difficulty: "Medium", ops: ["+", "-", "*", "/"] },
    { id: "algebra", title: "Algebra Basics", description: "Find a missing number in a simple equation.", difficulty: "Hard", ops: ["+", "-", "*"] },
    { id: "geometry", title: "Geometry Basics", description: "Practice perimeter-style addition and area-style multiplication.", difficulty: "Hard", ops: ["+", "*"] },
    { id: "advanced", title: "Advanced Practice", description: "Larger mixed problems for a tougher round.", difficulty: "Hard", ops: ["+", "-", "*", "/"] }
  ];

  var PDFS = [
    {
      id: "mental-math-guide",
      title: "Secrets of Mental Math",
      topic: "Mental Math",
      difficulty: "Medium",
      time: "Self-paced",
      file: "learn-secrets-of-mental-math.pdf",
      description: "A mental-math guidebook included in this project. Open the original PDF in your browser. This site does not copy the book’s text."
    }
  ];

  var ACHIEVEMENTS = [
    { id: "first-lesson", title: "First Lesson", test: function (s) { return s.completedLessons.length >= 1; } },
    { id: "streak-3", title: "3 Day Streak", test: function (s) { return s.streak >= 3; } },
    { id: "lessons-10", title: "10 Lessons Completed", test: function (s) { return s.completedLessons.length >= 10; } },
    { id: "correct-50", title: "50 Correct Answers", test: function (s) { return s.correctAnswers >= 50; } },
    { id: "streak-7", title: "7 Day Streak", test: function (s) { return s.streak >= 7; } }
  ];

  function todayStamp() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function yesterdayStamp() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function empty() {
    return {
      started: false,
      score: 0,
      streak: 0,
      lastLearningDate: null,
      completedLessons: [],
      lessonProgress: {},
      currentLesson: null,
      completedPdfs: [],
      pdfProgress: {},
      unlockedAchievements: [],
      correctAnswers: 0,
      dailyGoal: 0,
      dailyGoalDate: null,
      dailyGoalTarget: 5,
      dailyChallengeDate: null,
      dailyChallengeCorrect: 0,
      dailyChallengeDone: false
    };
  }

  function loadDaily() {
    try {
      return Object.assign({ lastPlayed: "", streak: 0 }, JSON.parse(localStorage.getItem(DAILY_KEY) || "{}"));
    } catch (e) {
      return { lastPlayed: "", streak: 0 };
    }
  }

  function saveDaily(daily) {
    localStorage.setItem(DAILY_KEY, JSON.stringify(daily));
  }

  function touchStreak() {
    var daily = loadDaily();
    var today = todayStamp();
    if (daily.lastPlayed !== today) {
      daily.streak = daily.lastPlayed === yesterdayStamp() ? (daily.streak || 0) + 1 : 1;
      daily.lastPlayed = today;
      saveDaily(daily);
    }
    return daily.streak || 0;
  }

  function load() {
    var state;
    try {
      state = Object.assign(empty(), JSON.parse(localStorage.getItem(LEARN_KEY) || "{}"));
    } catch (e) {
      state = empty();
    }
    state.streak = loadDaily().streak || 0;
    var today = todayStamp();
    if (state.dailyGoalDate !== today) {
      state.dailyGoal = 0;
      state.dailyGoalDate = today;
    }
    if (state.dailyChallengeDate !== today) {
      state.dailyChallengeDate = today;
      state.dailyChallengeCorrect = 0;
      state.dailyChallengeDone = false;
    }
    return state;
  }

  function save(state) {
    state.streak = loadDaily().streak || state.streak;
    localStorage.setItem(LEARN_KEY, JSON.stringify(state));
    return state;
  }

  function checkAchievements(state) {
    ACHIEVEMENTS.forEach(function (item) {
      if (state.unlockedAchievements.indexOf(item.id) === -1 && item.test(state)) {
        state.unlockedAchievements.push(item.id);
      }
    });
    return state;
  }

  function noteActivity(state, scoreGain, activityCount) {
    state.streak = touchStreak();
    if (scoreGain) state.score += scoreGain;
    if (activityCount) state.dailyGoal = Math.min(state.dailyGoalTarget, state.dailyGoal + activityCount);
    return checkAchievements(state);
  }

  global.MQGLearn = {
    LESSONS: LESSONS,
    PDFS: PDFS,
    ACHIEVEMENTS: ACHIEVEMENTS,
    load: load,
    startJourney: function () {
      var state = load();
      state.started = true;
      if (!state.currentLesson) state.currentLesson = LESSONS[0].id;
      state.streak = touchStreak();
      return save(state);
    },
    setCurrentLesson: function (id) {
      var state = load();
      state.started = true;
      state.currentLesson = id;
      return save(state);
    },
    addCorrect: function (points) {
      var state = load();
      state.correctAnswers += 1;
      return save(noteActivity(state, points || 5, 0));
    },
    completeLesson: function (id) {
      var state = load();
      if (state.completedLessons.indexOf(id) === -1) {
        state.completedLessons.push(id);
        state.lessonProgress[id] = 5;
        var idx = LESSONS.findIndex(function (lesson) { return lesson.id === id; });
        var next = LESSONS[idx + 1];
        state.currentLesson = next ? next.id : id;
        save(noteActivity(state, 40, 1));
      }
      return load();
    },
    setLessonProgress: function (id, answered) {
      var state = load();
      state.lessonProgress[id] = Math.max(state.lessonProgress[id] || 0, answered);
      return save(state);
    },
    completePdf: function (id) {
      var state = load();
      if (state.completedPdfs.indexOf(id) === -1) {
        state.completedPdfs.push(id);
        state.pdfProgress[id] = 100;
        save(noteActivity(state, 60, 1));
      }
      return load();
    },
    markPdfStarted: function (id) {
      var state = load();
      if (!state.pdfProgress[id]) state.pdfProgress[id] = 10;
      state.streak = touchStreak();
      return save(state);
    },
    completeDailyChallenge: function (correctCount) {
      var state = load();
      state.dailyChallengeCorrect = correctCount;
      if (!state.dailyChallengeDone) {
        state.dailyChallengeDone = true;
        save(noteActivity(state, correctCount * 8, 1));
      }
      return load();
    },
    nextLesson: function (state) {
      state = state || load();
      return LESSONS.find(function (lesson) {
        return state.completedLessons.indexOf(lesson.id) === -1;
      }) || LESSONS[LESSONS.length - 1];
    },
    progressPercent: function (state) {
      state = state || load();
      var total = LESSONS.length + PDFS.length;
      var done = state.completedLessons.length + state.completedPdfs.length;
      return Math.round((done / total) * 100);
    },
    levelName: function (state) {
      var n = (state || load()).completedLessons.length;
      if (n >= 10) return "Advanced";
      if (n >= 7) return "Proficient";
      if (n >= 4) return "Developing";
      if (n >= 1) return "Beginner";
      return "New learner";
    }
  };
})(window);