/* =====================================================================
   Lauren Beck | Narrator — admin panel

   Opened by clicking the header logo three times. That gesture only
   reveals the door; it is not the lock. Every write below travels with a
   Supabase access token earned by a real password, and the RLS policies
   reject anything else. Someone who reads this file and triple-clicks
   still gets nothing but a login form.
   ===================================================================== */
(function () {
  "use strict";

  var cfg = window.LB_CONFIG;
  if (!cfg || !cfg.key) return;

  var AUTH = cfg.url + "/auth/v1/";
  var REST = cfg.url + "/rest/v1/";
  var STORE = cfg.url + "/storage/v1/object/";
  var TOKEN_KEY = "lb_admin_token";

  var token = null;
  var overlay = null;
  var tab = "demos";
  var cache = { demos: [], releases: [] };

  /* ------------------------------------------------------ triple click */
  var clicks = [];
  document.addEventListener("click", function (e) {
    var logo = e.target.closest(".brand");
    if (!logo) return;
    var now = Date.now();
    clicks = clicks.filter(function (t) { return now - t < 900; });
    clicks.push(now);
    if (clicks.length >= 3) {
      clicks = [];
      e.preventDefault();
      open();
    }
  });

  /* ------------------------------------------------------------ helpers */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") el.className = attrs[k];
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) {
      if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }

  function authHeaders(extra) {
    var base = { apikey: cfg.key, Authorization: "Bearer " + token };
    Object.keys(extra || {}).forEach(function (k) { base[k] = extra[k]; });
    return base;
  }

  function rest(method, path, body) {
    return fetch(REST + path, {
      method: method,
      headers: authHeaders({ "Content-Type": "application/json", Prefer: "return=representation" }),
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (r.status === 401) { signOut(); throw new Error("Session expired — sign in again."); }
      if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.status); });
      return r.status === 204 ? null : r.json();
    });
  }

  /* --------------------------------------------------------------- auth */
  function signIn(email, password) {
    return fetch(AUTH + "token?grant_type=password", {
      method: "POST",
      headers: { apikey: cfg.key, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error(d.error_description || d.msg || "Sign in failed");
        token = d.access_token;
        try { sessionStorage.setItem(TOKEN_KEY, token); } catch (e) {}
        return d;
      });
    });
  }

  function signOut() {
    token = null;
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
    if (overlay) render();
  }

  /* --------------------------------------------------------------- data */
  function load() {
    return Promise.all([
      rest("GET", "demos?select=*&order=sort_order.asc"),
      rest("GET", "releases?select=*&order=sort_order.asc")
    ]).then(function (r) { cache.demos = r[0] || []; cache.releases = r[1] || []; });
  }

  function upload(bucket, file) {
    var name = Date.now() + "-" + file.name.replace(/[^\w.\-]+/g, "-").toLowerCase();
    return fetch(STORE + bucket + "/" + name, {
      method: "POST",
      headers: authHeaders({ "x-upsert": "true" }),
      body: file
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error("Upload failed: " + t); });
      return cfg.url + "/storage/v1/object/public/" + bucket + "/" + name;
    });
  }

  /* ------------------------------------------------------------- fields */
  var FIELDS = {
    demos: [
      { k: "genre", label: "Genre heading", ph: "RomCom" },
      { k: "tags", label: "Tags line", ph: "1st POV · Dual · Banter" },
      { k: "source_title", label: "From book (optional)", ph: "Make the Play" },
      { k: "source_author", label: "By author (optional)", ph: "Hailey Rodger" }
    ],
    releases: [
      { k: "title", label: "Title", ph: "Over the Line" },
      { k: "author", label: "Author", ph: "Hailey Rodger" },
      { k: "meta", label: "Series or genre", ph: "Colorado Storm, Book 4" },
      { k: "badge", label: "Badge text", ph: "Coming Soon" }
    ]
  };

  /* ----------------------------------------------------------- rendering */
  function loginView() {
    var email = h("input", { type: "email", placeholder: "Email", autocomplete: "username" });
    var pass = h("input", { type: "password", placeholder: "Password", autocomplete: "current-password" });
    var err = h("p", { class: "adm-err" });
    var btn = h("button", { class: "adm-btn", onclick: submit }, ["Sign in"]);

    function submit() {
      err.textContent = "";
      btn.disabled = true;
      signIn(email.value.trim(), pass.value)
        .then(function () { return load(); })
        .then(render)
        .catch(function (e) { err.textContent = e.message; btn.disabled = false; });
    }
    pass.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });

    return h("div", { class: "adm-login" }, [
      h("h2", {}, ["Site admin"]),
      h("p", { class: "adm-note" }, ["Signed-in access is required to change anything."]),
      email, pass, err, btn
    ]);
  }

  function row(kind, item, i, list) {
    var inputs = FIELDS[kind].map(function (f) {
      var input = h("input", {
        type: "text", value: item[f.k] || "", placeholder: f.ph,
        oninput: function () { item[f.k] = input.value; item._dirty = true; }
      });
      return h("label", { class: "adm-field" }, [h("span", {}, [f.label]), input]);
    });

    if (kind === "releases") {
      var sel = h("select", {
        onchange: function () { item.badge_variant = sel.value; item._dirty = true; }
      });
      [["soon", "Coming Soon (pink)"], ["new", "New Release (gold)"], ["production", "In Production (teal)"]]
        .forEach(function (o) {
          var opt = h("option", { value: o[0] }, [o[1]]);
          if ((item.badge_variant || "soon") === o[0]) opt.selected = true;
          sel.appendChild(opt);
        });
      inputs.push(h("label", { class: "adm-field" }, [h("span", {}, ["Badge colour"]), sel]));
    }

    var bucket = kind === "demos" ? "demos" : "covers";
    var pathKey = kind === "demos" ? "audio_path" : "cover_path";
    var status = h("span", { class: "adm-file" }, [item[pathKey] ? "current: " + shortName(item[pathKey]) : "no file"]);
    var file = h("input", {
      type: "file",
      accept: kind === "demos" ? "audio/*" : "image/*",
      onchange: function () {
        if (!file.files[0]) return;
        status.textContent = "uploading…";
        upload(bucket, file.files[0])
          .then(function (url) {
            item[pathKey] = url; item._dirty = true;
            status.textContent = "uploaded — press Save";
          })
          .catch(function (e) { status.textContent = e.message; });
      }
    });

    var active = h("input", {
      type: "checkbox",
      onchange: function () { item.active = active.checked; item._dirty = true; }
    });
    active.checked = item.active !== false;

    return h("div", { class: "adm-row" }, [
      h("div", { class: "adm-grid" }, inputs),
      h("div", { class: "adm-file-row" }, [file, status]),
      h("div", { class: "adm-actions" }, [
        h("label", { class: "adm-check" }, [active, h("span", {}, ["Visible on site"])]),
        h("button", { class: "adm-mini", disabled: i === 0 ? "" : null, onclick: function () { move(kind, i, -1); } }, ["↑"]),
        h("button", { class: "adm-mini", disabled: i === list.length - 1 ? "" : null, onclick: function () { move(kind, i, 1); } }, ["↓"]),
        h("button", { class: "adm-btn adm-save", onclick: function (e) { save(kind, item, e.target); } }, ["Save"]),
        h("button", { class: "adm-mini adm-del", onclick: function () { remove(kind, item); } }, ["Delete"])
      ])
    ]);
  }

  function shortName(p) { return String(p).split("/").pop().split("?")[0]; }

  function move(kind, i, dir) {
    var list = cache[kind];
    var j = i + dir;
    if (j < 0 || j >= list.length) return;
    var a = list[i], b = list[j];
    var tmp = a.sort_order; a.sort_order = b.sort_order; b.sort_order = tmp;
    list[i] = b; list[j] = a;
    render();
    Promise.all([
      rest("PATCH", kind + "?id=eq." + a.id, { sort_order: a.sort_order }),
      rest("PATCH", kind + "?id=eq." + b.id, { sort_order: b.sort_order })
    ]).catch(function (e) { alert(e.message); });
  }

  function payload(kind, item) {
    var out = {};
    FIELDS[kind].forEach(function (f) { out[f.k] = item[f.k] || null; });
    out.active = item.active !== false;
    out.sort_order = item.sort_order || 0;
    if (kind === "demos") out.audio_path = item.audio_path;
    else { out.cover_path = item.cover_path; out.badge_variant = item.badge_variant || "soon"; }
    return out;
  }

  function save(kind, item, btn) {
    btn.disabled = true; btn.textContent = "Saving…";
    var body = payload(kind, item);
    var p = item.id
      ? rest("PATCH", kind + "?id=eq." + item.id, body)
      : rest("POST", kind, body);
    p.then(function (res) {
      if (!item.id && res && res[0]) item.id = res[0].id;
      item._dirty = false;
      btn.textContent = "Saved";
      setTimeout(function () { btn.disabled = false; btn.textContent = "Save"; }, 1200);
    }).catch(function (e) {
      alert(e.message);
      btn.disabled = false; btn.textContent = "Save";
    });
  }

  function remove(kind, item) {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    var done = item.id ? rest("DELETE", kind + "?id=eq." + item.id) : Promise.resolve();
    done.then(function () {
      cache[kind] = cache[kind].filter(function (x) { return x !== item; });
      render();
    }).catch(function (e) { alert(e.message); });
  }

  function add(kind) {
    var list = cache[kind];
    var next = list.length ? Math.max.apply(null, list.map(function (x) { return x.sort_order || 0; })) + 1 : 0;
    list.push(kind === "demos"
      ? { genre: "New sample", tags: "", audio_path: "", sort_order: next, active: false }
      : { title: "New title", badge: "Coming Soon", badge_variant: "soon", cover_path: "", sort_order: next, active: false });
    render();
  }

  function panelView() {
    var list = cache[tab];
    var tabs = ["demos", "releases"].map(function (k) {
      return h("button", {
        class: "adm-tab" + (tab === k ? " on" : ""),
        onclick: function () { tab = k; render(); }
      }, [k === "demos" ? "Demos" : "Releases"]);
    });

    return h("div", { class: "adm-panel" }, [
      h("div", { class: "adm-head" }, [
        h("div", { class: "adm-tabs" }, tabs),
        h("div", {}, [
          h("button", { class: "adm-mini", onclick: function () { add(tab); } }, ["+ Add"]),
          h("button", { class: "adm-mini", onclick: signOut }, ["Sign out"]),
          h("button", { class: "adm-mini", onclick: close }, ["Close"])
        ])
      ]),
      h("p", { class: "adm-note" }, [
        "New entries start hidden. Tick “Visible on site” and press Save when ready."
      ]),
      h("div", {}, list.map(function (item, i) { return row(tab, item, i, list); }))
    ]);
  }

  function render() {
    if (!overlay) return;
    overlay.innerHTML = "";
    overlay.appendChild(h("div", { class: "adm-sheet" }, [token ? panelView() : loginView()]));
  }

  function open() {
    if (overlay) return;
    overlay = h("div", { class: "adm-overlay", onclick: function (e) { if (e.target === overlay) close(); } });
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    try { token = sessionStorage.getItem(TOKEN_KEY); } catch (e) { token = null; }
    render();
    if (token) load().then(render).catch(function () { signOut(); });
  }

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
})();
