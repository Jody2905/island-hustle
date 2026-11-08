/* Island Hustle: shared pieces (same engine as Cyber Shift). Every mode registers itself with CS.addMode(). */
(function () {
  "use strict";
  var CS = window.CS = {};
  var KEY = "islandhustle.v1";
  var screen = document.getElementById("screen");

  // ------------------------------------------------------------ helpers
  CS.esc = function (v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  CS.shuffle = function (a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  CS.stars = function (n) {
    var s = "";
    for (var i = 1; i <= 3; i++) s += '<span class="' + (i <= n ? "on" : "") + '">★</span>';
    return '<span class="stars" aria-label="' + n + ' of 3 stars">' + s + "</span>";
  };
  CS.toast = function (msg) {
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  };
  CS.screen = screen;
  /** Remember which address we set ourselves, so the back-button handler only reacts to the user's moves. */
  function setHash(h) {
    CS._lastHash = h;
    if (location.hash.replace("#", "") !== h) location.hash = h;
  }

  // ------------------------------------------------------------ saved progress
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  var data = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private browsing: progress lasts this visit */ }
  }
  CS.progress = function (mode, level) {
    return (data[mode] && data[mode][level]) || { stars: 0, best: 0 };
  };
  CS.record = function (mode, level, stars, score) {
    data[mode] = data[mode] || {};
    var p = CS.progress(mode, level);
    var better = stars > p.stars || score > p.best;
    data[mode][level] = { stars: Math.max(stars, p.stars), best: Math.max(score, p.best) };
    save();
    updateTotal();
    return better;
  };
  CS.unlocked = function (mode, level) {
    return level === 1 || CS.progress(mode, level - 1).stars > 0;
  };
  CS.totalStars = function () {
    var t = 0;
    Object.keys(data).forEach(function (m) { Object.keys(data[m]).forEach(function (l) { t += data[m][l].stars; }); });
    return t;
  };
  function updateTotal() { document.getElementById("totalStars").textContent = CS.totalStars(); }
  CS.resetProgress = function () { data = {}; save(); updateTotal(); };

  // ------------------------------------------------------------ modes
  var modes = [];
  CS.addMode = function (m) { modes.push(m); };
  CS.modes = function () { return modes; };
  function mode(id) { return modes.filter(function (m) { return m.id === id; })[0]; }

  // Stop timers and animation loops from the previous screen
  var cleanups = [];
  CS.onLeave = function (fn) { cleanups.push(fn); };
  function leave() {
    cleanups.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
    cleanups = [];
    var o = document.querySelector(".overlay");
    if (o) o.remove();
  }

  // ------------------------------------------------------------ screens
  CS.hub = function () {
    leave();
    setHash("");
    screen.innerHTML =
      '<section class="hero"><div><h1>Make a living in St. Vincent and the Grenadines.</h1>' +
      '<p class="lead">Drive a minibus through Kingstown traffic, explore 32 islands and cays, take a boat out from Calliaqua, and lead a band to the top of Vincy Mas. Four ways to hustle, five levels each.</p>' +
      '<p class="muted">Earn up to 3 stars per level. A star unlocks the next level.</p></div>' +
      '<div class="art">' + heroArt() + "</div></section>" +
      '<div class="modes">' + modes.map(function (m) {
        var stars = 0;
        for (var i = 1; i <= 5; i++) stars += CS.progress(m.id, i).stars;
        return '<button class="mode" data-mode="' + m.id + '"><div class="ic">' + m.icon + "</div><div><h2>" + CS.esc(m.title) + "</h2><p>" + CS.esc(m.blurb) +
          '</p><div class="prog"><div class="meter"><i style="width:' + Math.round(stars / 15 * 100) + '%"></i></div>' + stars + " / 15 ★</div></div></button>";
      }).join("") + "</div>";
    screen.querySelectorAll(".mode").forEach(function (b) { b.addEventListener("click", function () { CS.levels(b.dataset.mode); }); });
  };

  CS.levels = function (id) {
    leave();
    var m = mode(id);
    setHash(id);
    screen.innerHTML = '<button class="back" id="back">← All modes</button><h1>' + m.icon + " " + CS.esc(m.title) + '</h1><p class="lead">' + CS.esc(m.intro) + "</p>" +
      '<div class="levels">' + m.levels.map(function (l, i) {
        var n = i + 1, open = CS.unlocked(id, n), p = CS.progress(id, n);
        return '<button class="level" data-level="' + n + '"' + (open ? "" : " disabled") + '><span class="n">Level ' + n + (open ? "" : " · locked") + "</span><h3>" + CS.esc(l.name) +
          '</h3><span class="d">' + CS.esc(l.desc) + "</span>" + CS.stars(p.stars) + (p.best ? '<span class="muted">Best ' + p.best.toLocaleString() + "</span>" : "") + "</button>";
      }).join("") + '</div><div class="how"><b>How to play.</b> ' + m.how + "</div>";
    document.getElementById("back").addEventListener("click", CS.hub);
    screen.querySelectorAll(".level").forEach(function (b) {
      b.addEventListener("click", function () { CS.play(id, +b.dataset.level); });
    });
  };

  CS.play = function (id, level) {
    leave();
    var m = mode(id);
    setHash(id + "/" + level);
    screen.innerHTML = '<button class="back" id="back">← ' + CS.esc(m.title) + " levels</button><div id=\"stage\"></div>";
    document.getElementById("back").addEventListener("click", function () { CS.levels(id); });
    m.start(level, document.getElementById("stage"), function (r) { finish(m, level, r); });
  };

  /** End of a level: r = { stars, score, title, summary (HTML) } */
  function finish(m, level, r) {
    var better = CS.record(m.id, level, r.stars, r.score);
    var next = level < m.levels.length && r.stars > 0;
    var o = document.createElement("div");
    o.className = "overlay";
    o.innerHTML = '<div class="result" role="dialog" aria-label="Level result"><div class="big">' +
      [1, 2, 3].map(function (i) { return '<span class="' + (i <= r.stars ? "on" : "") + '">★</span>'; }).join("") + "</div>" +
      "<h2>" + CS.esc(r.title || (r.stars ? "Level complete" : "Not this time")) + "</h2>" +
      '<p class="muted">Score <b>' + (r.score || 0).toLocaleString() + "</b>" + (better ? " · new best" : "") + "</p>" +
      '<div class="sum">' + (r.summary || "") + "</div>" +
      '<div class="row"><button class="btn ghost" data-a="levels">Levels</button><button class="btn ghost" data-a="again">Play again</button>' +
      (next ? '<button class="btn" data-a="next">Next level →</button>' : "") + "</div></div>";
    document.body.appendChild(o);
    o.querySelector("[data-a=levels]").addEventListener("click", function () { CS.levels(m.id); });
    o.querySelector("[data-a=again]").addEventListener("click", function () { CS.play(m.id, level); });
    if (next) o.querySelector("[data-a=next]").addEventListener("click", function () { CS.play(m.id, level + 1); });
    var btn = o.querySelector(next ? "[data-a=next]" : "[data-a=again]");
    if (btn) btn.focus();
  }

  /** A countdown that calls tick(fractionLeft) and then done(). Returns { stop, left() }. */
  CS.countdown = function (seconds, tick, done) {
    var end = Date.now() + seconds * 1000, stopped = false;
    var id = setInterval(function () {
      var left = Math.max(0, end - Date.now());
      tick(left / (seconds * 1000), Math.ceil(left / 1000));
      if (left <= 0) { clearInterval(id); if (!stopped) { stopped = true; done(); } }
    }, 200);
    var t = { stop: function () { stopped = true; clearInterval(id); }, left: function () { return Math.max(0, (end - Date.now()) / 1000); } };
    CS.onLeave(t.stop);
    return t;
  };

  CS.route = function () {
    var h = location.hash.replace("#", "").split("/");
    if (h[0] && mode(h[0])) {
      var lvl = +h[1];
      if (lvl && CS.unlocked(h[0], lvl)) return CS.play(h[0], lvl);
      return CS.levels(h[0]);
    }
    CS.hub();
  };

  CS.init = function () {
    updateTotal();
    document.getElementById("home").addEventListener("click", CS.hub);
    document.getElementById("reset").addEventListener("click", function () {
      if (confirm("Clear all your stars and scores?")) { CS.resetProgress(); CS.hub(); }
    });
    CS.route();
  };

  function heroArt() {
    // Kingstown harbour at sunset: volcano, hills, a minibus and a fishing boat
    return '<svg viewBox="0 0 480 300" role="img" aria-label="A Caribbean harbour at sunset">' +
      '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7e5f"/><stop offset=".55" stop-color="#feb47b"/><stop offset="1" stop-color="#ffe29a"/></linearGradient>' +
      '<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1fb5c9"/><stop offset="1" stop-color="#0a5e7a"/></linearGradient></defs>' +
      '<rect width="480" height="300" fill="url(#sky)"/><circle cx="350" cy="120" r="40" fill="#fff4c2" opacity=".9"/>' +
      '<path d="M0 190 L70 120 L105 70 L135 120 L210 150 L280 120 L360 165 L480 140 L480 205 L0 205 Z" fill="#2f7d4f"/>' +
      '<path d="M98 80 L105 70 L113 80 Z" fill="#6b4f3a"/><path d="M104 66 q6 -10 0 -18 q-6 -8 2 -16" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>' +
      '<path d="M0 205 L480 205 L480 300 L0 300 Z" fill="url(#sea)"/>' +
      '<g fill="#fff" opacity=".35"><rect x="40" y="225" width="60" height="3" rx="1.5"/><rect x="300" y="250" width="90" height="3" rx="1.5"/><rect x="170" y="275" width="70" height="3" rx="1.5"/></g>' +
      '<g transform="translate(250 228)"><path d="M0 12 L70 12 L60 26 L8 26 Z" fill="#e63946"/><rect x="30" y="-18" width="3" height="30" fill="#6b4f3a"/><path d="M33 -16 L56 8 L33 8 Z" fill="#fff"/></g>' +
      '<g transform="translate(40 168)"><rect x="0" y="0" width="86" height="34" rx="8" fill="#ffd166"/><rect x="0" y="16" width="86" height="6" fill="#e63946"/><rect x="0" y="22" width="86" height="4" fill="#06d6a0"/>' +
      '<g fill="#bde0fe"><rect x="8" y="5" width="14" height="10" rx="2"/><rect x="26" y="5" width="14" height="10" rx="2"/><rect x="44" y="5" width="14" height="10" rx="2"/><rect x="62" y="5" width="16" height="10" rx="2"/></g>' +
      '<circle cx="18" cy="35" r="7" fill="#222"/><circle cx="68" cy="35" r="7" fill="#222"/></g>' +
      '<g transform="translate(410 150)"><rect x="-2" y="0" width="5" height="55" fill="#7a5230"/><path d="M0 0 q-20 -4 -32 8 M0 0 q20 -6 32 6 M0 0 q-8 -16 -24 -20 M0 0 q10 -16 26 -18" stroke="#2d6a4f" stroke-width="6" fill="none" stroke-linecap="round"/></g></svg>';
  }
})();
