/* =====================================================================
   Lauren Beck | Narrator — database-backed content

   Renders the Samples and Releases sections from Supabase. The markup in
   index.html stays as the fallback: if the fetch fails, is slow, or JS is
   off, the hardcoded version is what visitors see. Nothing is cleared
   until replacement rows are in hand.
   ===================================================================== */
(function () {
  "use strict";

  var cfg = window.LB_CONFIG;
  if (!cfg || !cfg.key) {
    var reviewForm = document.getElementById("testimonial-form");
    if (reviewForm) {
      reviewForm.querySelector('button[type="submit"]').disabled = true;
      reviewForm.querySelector(".testimonial-status").textContent =
        "Review submissions are temporarily unavailable.";
    }
    return;
  }

  var REST = cfg.url + "/rest/v1/";
  var PUBLIC = cfg.url + "/storage/v1/object/public/";

  function query(path) {
    return fetch(REST + path, {
      headers: { apikey: cfg.key, Authorization: "Bearer " + cfg.key }
    }).then(function (r) {
      if (!r.ok) throw new Error("supabase " + r.status);
      return r.json();
    });
  }

  /* A stored path is either a full URL (uploaded through the admin panel
     and living in Storage) or a bare filename still served from this repo. */
  function mediaUrl(value, bucket, localDir, versioned) {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.indexOf("/") !== -1) return PUBLIC + bucket + "/" + value;
    return localDir + value + (versioned ? "?v=" + cfg.assetVersion : "");
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function credit(row) {
    if (!row.source_title) return "";
    var t = "from <cite>" + esc(row.source_title) + "</cite>";
    if (row.source_author) t += " by " + esc(row.source_author);
    return '<p class="source">' + t + "</p>";
  }

  function renderDemos(rows) {
    if (!rows.length) return;
    var grid = document.querySelector(".samples-grid");
    if (!grid) return;

    grid.innerHTML = rows.map(function (row) {
      return '<article class="sample reveal in">' +
        '<h3 class="genre">' + esc(row.genre) + "</h3>" +
        '<p class="tags">' + esc(row.tags || "") + "</p>" +
        '<div class="player" data-src="' +
          esc(mediaUrl(row.audio_path, "demos", "assets/audio/", true)) + '"></div>' +
        credit(row) +
      "</article>";
    }).join("");

    if (window.LB && window.LB.initPlayers) window.LB.initPlayers(grid);
  }

  var BADGE = { soon: "badge soon", "new": "badge", production: "badge production" };
  var AMAZON_COVER_OVERRIDES = {
    "Blood and Bedlam": {
      previous: "https://pwjdjrweyrnatqjtvbxd.supabase.co/storage/v1/object/public/covers/1793906476092-image-11-5-26-at-1.19-pm.jpeg",
      amazon: "https://m.media-amazon.com/images/I/81S9BMAZYNL._SL1500_.jpg"
    },
    "Grin and Bear It": {
      previous: "https://pwjdjrweyrnatqjtvbxd.supabase.co/storage/v1/object/public/covers/1793906564988-image-11-5-26-at-1.20-pm.jpeg",
      amazon: "https://m.media-amazon.com/images/I/71YUIAkkdRL._SL1500_.jpg"
    }
  };

  function renderReleases(rows) {
    if (!rows.length) return;
    var grid = document.querySelector(".releases-grid");
    if (!grid) return;

    grid.innerHTML = rows.map(function (row) {
      var badge = row.badge
        ? '<span class="' + (BADGE[row.badge_variant] || "badge") + '">' + esc(row.badge) + "</span>"
        : "";
      var coverPath = row.cover_path;
      var coverOverride = AMAZON_COVER_OVERRIDES[row.title];
      if (coverOverride && coverPath === coverOverride.previous) coverPath = coverOverride.amazon;
      return '<article class="release reveal in">' +
        '<div class="cover">' + badge +
          '<img src="' + esc(mediaUrl(coverPath, "covers", "assets/img/covers/", false)) +
            '" alt="' + esc(row.title) + ' book cover" width="800" height="1200" loading="lazy">' +
        "</div>" +
        "<h3>" + esc(row.title) + "</h3>" +
        (row.author ? '<p class="author">' + esc(row.author) + "</p>" : "") +
        (row.meta ? "<p>" + esc(row.meta) + "</p>" : "") +
      "</article>";
    }).join("");
  }

  function renderTestimonials(rows) {
    var grid = document.querySelector(".quotes");
    if (!grid || !rows.length) return;

    rows.forEach(function (row) {
      var quote = document.createElement("blockquote");
      quote.className = "quote reveal in";

      var short = document.createElement("div");
      short.className = "quote-short";
      var shortText = row.quote;
      if (shortText.length > 260) {
        var cut = shortText.lastIndexOf(" ", 260);
        shortText = shortText.slice(0, cut > 180 ? cut : 260).trimEnd() + "…";
      }
      var shortP = document.createElement("p");
      shortP.textContent = shortText;
      short.appendChild(shortP);

      var full = document.createElement("div");
      full.className = "quote-full";
      full.hidden = true;
      var fullP = document.createElement("p");
      fullP.textContent = row.quote;
      full.appendChild(fullP);

      quote.appendChild(short);
      quote.appendChild(full);
      if (row.quote.length > 260) {
        var button = document.createElement("button");
        button.className = "quote-toggle";
        button.type = "button";
        button.setAttribute("aria-expanded", "false");
        var label = document.createElement("span");
        label.className = "label";
        label.textContent = "Read full testimony";
        var chevron = document.createElement("span");
        chevron.className = "chev";
        chevron.setAttribute("aria-hidden", "true");
        chevron.textContent = "▾";
        button.appendChild(label);
        button.appendChild(document.createTextNode(" "));
        button.appendChild(chevron);
        quote.appendChild(button);
      }

      var who = document.createElement("span");
      who.className = "who";
      who.textContent = row.display_name + ", " +
        (row.role === "narrator" ? "Narrator" : "Author") +
        (row.project ? " of " + row.project : "");
      quote.appendChild(who);
      grid.appendChild(quote);
    });
  }

  function initTestimonialForm() {
    var form = document.getElementById("testimonial-form");
    if (!form) return;
    var status = form.querySelector(".testimonial-status");
    var submit = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      if (data.get("website")) return;
      status.textContent = "";
      status.classList.remove("error");
      submit.disabled = true;

      var row = {
        display_name: String(data.get("display_name") || "").trim(),
        role: String(data.get("role") || ""),
        project: String(data.get("project") || "").trim() || null,
        quote: String(data.get("quote") || "").trim(),
        consent: data.get("consent") === "on",
        status: "pending"
      };

      fetch(REST + "testimonials", {
        method: "POST",
        headers: {
          apikey: cfg.key,
          Authorization: "Bearer " + cfg.key,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(row)
      }).then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            throw new Error(text || "Submission failed (" + response.status + ").");
          });
        }
        form.reset();
        status.textContent = "Thanks! Your review has been sent to Lauren for approval.";
      }).catch(function (error) {
        console.error("Review submission failed:", error);
        status.classList.add("error");
        status.textContent = "Sorry, your review couldn't be submitted right now. Please try again later.";
      }).then(function () {
        submit.disabled = false;
      });
    });
  }

  if (document.querySelector(".samples-grid")) {
    query("demos?select=*&active=eq.true&order=sort_order.asc").then(renderDemos).catch(noop);
  }
  if (document.querySelector(".releases-grid")) {
    query("releases?select=*&active=eq.true&order=sort_order.asc").then(renderReleases).catch(noop);
  }
  if (document.querySelector(".quotes")) {
    query("testimonials?select=display_name,role,project,quote&status=eq.approved&order=created_at.desc")
      .then(renderTestimonials).catch(noop);
  }
  initTestimonialForm();

  function noop() { /* keep the hardcoded fallback on screen */ }

  /* ------------------------------------------------------------ tracking
     Records three things and nothing else. No cookie, no IP, no user agent.
     The session id is random, lives in sessionStorage, and dies with the tab,
     which separates visits from views without identifying anyone. */
  var session = (function () {
    try {
      var s = sessionStorage.getItem("lb_sid");
      if (!s) {
        s = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());
        sessionStorage.setItem("lb_sid", s);
      }
      return s;
    } catch (e) { return null; }
  })();

  /* Coarse buckets only — a family name, never the user-agent string itself. */
  var audience = (function () {
    var ua = navigator.userAgent || "";
    var d = navigator.userAgentData || null;

    var os = "Other";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
    else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
    else if (/CrOS/i.test(ua)) os = "ChromeOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    var device;
    if (d && typeof d.mobile === "boolean") device = d.mobile ? "Mobile" : "Desktop";
    else device = /Mobi|Android|iPhone|iPod/i.test(ua) ? "Mobile" : "Desktop";
    /* iPadOS reports a desktop UA, so fall back to touch + screen size. */
    if (/iPad/i.test(ua) || (os === "macOS" && navigator.maxTouchPoints > 1)) device = "Tablet";
    else if (device === "Mobile" && Math.min(screen.width, screen.height) >= 600) device = "Tablet";

    return { os: os, device: device };
  })();

  function track(event, label) {
    if (navigator.webdriver) return;           /* skip obvious automation */
    var body = JSON.stringify({
      event: event, label: label || null, session_id: session,
      device: audience.device, os: audience.os
    });
    try {
      /* /api/track adds the country from Vercel's edge header. If the function
         is unavailable, fall back to writing straight to Supabase so events are
         still counted — just without a country. */
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true
      }).then(function (r) {
        if (!r.ok && r.status !== 202) throw new Error("track " + r.status);
      }).catch(function () {
        fetch(REST + "analytics_events", {
          method: "POST",
          headers: { apikey: cfg.key, Authorization: "Bearer " + cfg.key, "Content-Type": "application/json" },
          body: body,
          keepalive: true
        }).catch(noop);
      });
    } catch (e) { /* analytics must never break the page */ }
  }

  track("pageview", location.pathname);

  document.addEventListener("click", function (e) {
    var play = e.target.closest(".player .play");
    if (play) {
      /* the button toggles, so read the resulting state rather than assuming */
      setTimeout(function () {
        var player = play.closest(".player");
        if (!player || !player.classList.contains("playing")) return;
        var card = player.closest(".sample");
        var name = card && card.querySelector(".genre") ? card.querySelector(".genre").textContent.trim() : "unknown";
        var tags = card && card.querySelector(".tags") ? card.querySelector(".tags").textContent.trim() : "";
        track("demo_play", tags ? name + " — " + tags : name);
      }, 0);
      return;
    }
    var link = e.target.closest("a[href]");
    if (link && /audible\.com|acx\.com/i.test(link.href)) {
      track("outbound", /acx\.com/i.test(link.href) ? "ACX profile" : "Audible");
    }
  });
})();
