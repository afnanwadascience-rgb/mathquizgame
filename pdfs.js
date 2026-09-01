(function () {
  "use strict";
  var L = window.MQGLearn;

  function render() {
    var state = L.load();
    document.getElementById("pdf-list").innerHTML = L.PDFS.map(function (pdf) {
      var done = state.completedPdfs.indexOf(pdf.id) !== -1;
      var started = !!state.pdfProgress[pdf.id];
      var status = done ? "Completed" : started ? "Started" : "Not started";
      var progress = done ? 100 : started ? 10 : 0;
      return (
        '<article class="lesson-card">' +
          "<h2>" + pdf.title + "</h2>" +
          "<p class=\"lede\">" + pdf.description + "</p>" +
          "<p class=\"lede\">Topic: " + pdf.topic + " · Difficulty: " + pdf.difficulty + "</p>" +
          "<p class=\"lede\">Status: " + status + " · Progress: " + progress + "%</p>" +
          '<div class="play-actions">' +
            '<a class="primary-btn" href="' + pdf.file + '" target="_blank" rel="noopener" data-open="' + pdf.id + '">Open PDF</a>' +
            (done
              ? "<p class=\"lede\">Completed</p>"
              : '<button type="button" class="ghost-btn" data-complete="' + pdf.id + '">Mark as Completed</button>') +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  document.getElementById("pdf-list").addEventListener("click", function (event) {
    var open = event.target.closest("[data-open]");
    var complete = event.target.closest("[data-complete]");
    if (open) L.markPdfStarted(open.getAttribute("data-open"));
    if (complete) {
      L.completePdf(complete.getAttribute("data-complete"));
      render();
    }
  });

  render();
})();