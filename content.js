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
})();
