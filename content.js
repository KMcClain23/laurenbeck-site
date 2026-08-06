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
  if (!cfg || !cfg.key) return;

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

  function renderReleases(rows) {
    if (!rows.length) return;
    var grid = document.querySelector(".releases-grid");
    if (!grid) return;

    grid.innerHTML = rows.map(function (row) {
      var badge = row.badge
        ? '<span class="' + (BADGE[row.badge_variant] || "badge") + '">' + esc(row.badge) + "</span>"
        : "";
      return '<article class="release reveal in">' +
        '<div class="cover">' + badge +
          '<img src="' + esc(mediaUrl(row.cover_path, "covers", "assets/img/covers/", false)) +
            '" alt="' + esc(row.title) + ' audiobook cover" width="800" height="1200" loading="lazy">' +
        "</div>" +
        "<h3>" + esc(row.title) + "</h3>" +
        (row.author ? '<p class="author">' + esc(row.author) + "</p>" : "") +
        (row.meta ? "<p>" + esc(row.meta) + "</p>" : "") +
      "</article>";
    }).join("");
  }

  query("demos?select=*&active=eq.true&order=sort_order.asc").then(renderDemos).catch(noop);
  query("releases?select=*&active=eq.true&order=sort_order.asc").then(renderReleases).catch(noop);

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
