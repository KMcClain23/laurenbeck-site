/* =====================================================================
   Lauren Beck | Narrator — interactions
   - mobile nav toggle
   - scroll reveal
   - custom audio players (single-play, seek, time)
   ===================================================================== */
(function () {
  "use strict";

  /* ---- mark JS active so reveal styles apply (no-JS shows all content) ---- */
  document.documentElement.classList.add("js");

  /* ---- current year ---- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- mobile nav ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- expandable testimonials ---- */
  document.querySelectorAll(".quote-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var q = btn.closest(".quote");
      var short = q.querySelector(".quote-short");
      var full = q.querySelector(".quote-full");
      var label = btn.querySelector(".label");
      var expanded = btn.getAttribute("aria-expanded") === "true";
      if (expanded) {
        full.hidden = true;
        short.hidden = false;
        btn.setAttribute("aria-expanded", "false");
        if (label) label.textContent = "Read full testimony";
      } else {
        short.hidden = true;
        full.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        if (label) label.textContent = "Show less";
      }
    });
  });

  /* ---- custom audio players ---- */
  var PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  var audios = [];

  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  document.querySelectorAll(".player").forEach(function (p) {
    var src = p.getAttribute("data-src");
    var audio = new Audio();
    audio.preload = "metadata";
    audio.src = src;
    audios.push(audio);

    p.innerHTML =
      '<button class="play" aria-label="Play sample" type="button">' + PLAY + '</button>' +
      '<div class="bar">' +
        '<div class="track" role="slider" aria-label="Seek" tabindex="0"><div class="fill"></div></div>' +
        '<div class="time"><span class="cur">0:00</span><span class="dur">0:00</span></div>' +
      '</div>';

    var btn = p.querySelector(".play");
    var track = p.querySelector(".track");
    var fill = p.querySelector(".fill");
    var cur = p.querySelector(".cur");
    var dur = p.querySelector(".dur");

    audio.addEventListener("loadedmetadata", function () { dur.textContent = fmt(audio.duration); });
    audio.addEventListener("timeupdate", function () {
      var pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      fill.style.width = pct + "%";
      cur.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener("ended", function () {
      p.classList.remove("playing");
      btn.innerHTML = PLAY;
      fill.style.width = "0%";
      cur.textContent = "0:00";
    });

    btn.addEventListener("click", function () {
      if (audio.paused) {
        // pause every other player first
        audios.forEach(function (a) { if (a !== audio) a.pause(); });
        document.querySelectorAll(".player.playing").forEach(function (el) {
          el.classList.remove("playing");
          el.querySelector(".play").innerHTML = PLAY;
        });
        audio.play();
        p.classList.add("playing");
        btn.innerHTML = PAUSE;
        btn.setAttribute("aria-label", "Pause sample");
      } else {
        audio.pause();
        p.classList.remove("playing");
        btn.innerHTML = PLAY;
        btn.setAttribute("aria-label", "Play sample");
      }
    });

    function seek(clientX) {
      var r = track.getBoundingClientRect();
      var ratio = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
      if (audio.duration) audio.currentTime = ratio * audio.duration;
    }
    track.addEventListener("click", function (e) { seek(e.clientX); });
    track.addEventListener("keydown", function (e) {
      if (!audio.duration) return;
      if (e.key === "ArrowRight") { audio.currentTime = Math.min(audio.currentTime + 5, audio.duration); e.preventDefault(); }
      if (e.key === "ArrowLeft") { audio.currentTime = Math.max(audio.currentTime - 5, 0); e.preventDefault(); }
    });
  });
})();
