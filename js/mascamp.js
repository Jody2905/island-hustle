/* Mode 4: Mas Camp. Lead a carnival band through the weeks before Vincy Mas. */
(function () {
  "use strict";
  var esc = CS.esc;

  var COLORS = { red: "#e63946", orange: "#f77f00", gold: "#ffd166", black: "#1f1f1f", turquoise: "#1fb5c9", blue: "#1d4ed8", white: "#f1f5f9", green: "#2d9a5f", pink: "#ff70a6" };
  var THEMES = [
    { id: "fire", name: "Soufrière Fire", colors: ["red", "orange", "gold"], note: "The volcano's power: lava, ash and light." },
    { id: "sea", name: "Hairouna Sea", colors: ["turquoise", "blue", "white"], note: "Hairouna, the islands' old name, and the waters around them." },
    { id: "bloom", name: "Botanic Bloom", colors: ["green", "pink", "gold"], note: "The oldest gardens in the Americas, in full flower." },
    { id: "chatoyer", name: "Spirit of Chatoyer", colors: ["black", "white", "gold"], note: "Garifuna heritage, in the colours of the Garifuna flag." },
    { id: "gems", name: "Vincy Gems", colors: ["blue", "gold", "green"], note: "The national flag: blue, gold and green." },
  ];

  var ACTIONS = [
    { id: "sew", name: "Sew costumes", icon: "🧵", cost: 500, note: "Costumes +12", effect: function (b) { b.costume += 12 * b.fabric; } },
    { id: "centre", name: "Build the King and Queen", icon: "👑", cost: 1200, once: true, note: "Costumes +22, a showpiece for the judges", effect: function (b) { b.costume += 22; } },
    { id: "recruit", name: "Recruit masqueraders", icon: "🙌", cost: 0, note: "More players; each pays for their costume", effect: function (b, L) { var n = Math.round(L.size * 0.25); b.masq += n; b.money += n * 40; b.lastMsg = "+" + n + " masqueraders, +EC$" + n * 40 + " in costume fees"; } },
    { id: "rehearse", name: "Rehearse the road march", icon: "💃", cost: 0, note: "Performance +15", effect: function (b) { b.perf += 15 * b.power; } },
    { id: "steel", name: "Hire a steel band", icon: "🥁", cost: 700, max: 2, note: "Music +25", effect: function (b) { b.music += 25; } },
    { id: "truck", name: "Book a music truck and DJ", icon: "🚚", cost: 1600, once: true, note: "Music +45", effect: function (b) { b.music += 45; } },
    { id: "theme", name: "Theme workshop", icon: "🎨", cost: 200, max: 2, note: "Theme +15: tighten the story", effect: function (b) { b.theme += 15; } },
    { id: "sponsor", name: "Find a sponsor", icon: "🤝", cost: 0, note: "Money from a local business", effect: function (b) { var m = 700 + Math.round(Math.random() * 6) * 100; b.money += m; b.lastMsg = "A sponsor gives EC$" + m; } },
    { id: "fete", name: "Hold a fundraiser fete", icon: "🎉", cost: 150, note: "About EC$900 after costs", effect: function (b) { var m = 800 + Math.round(Math.random() * 4) * 50; b.money += m; b.lastMsg = "The fete raises EC$" + m; } },
  ];

  var EVENTS = [
    { text: "Heavy rain floods part of the mas camp. Some fabric is ruined.", fx: function (b) { b.costume -= 6; } },
    { text: "The fabric order from Trinidad is late: sewing is slower next week.", fx: function (b) { b.fabric = 0.5; } },
    { text: "A rival band offers your masqueraders cheaper costumes. Some leave.", fx: function (b, L) { b.masq = Math.max(0, b.masq - Math.round(L.size * 0.12)); } },
    { text: "A video of your rehearsal goes viral. People want to join!", fx: function (b, L) { b.masq += Math.round(L.size * 0.15); } },
    { text: "A power cut at the camp: rehearsals are weaker next week.", fx: function (b) { b.power = 0.5; } },
    { text: "A local business loves your theme and sends EC$500.", fx: function (b) { b.money += 500; } },
    { text: "Your lead designer has a brilliant idea for the headpieces.", fx: function (b) { b.costume += 6; b.theme += 5; } },
    { text: "Quiet week at the camp. Everyone gets on with the work.", fx: function () { } },
  ];

  var LEVELS = [
    { name: "Junior Carnival", desc: "A children's band. Five weeks, a small budget, friendly rivals.", weeks: 5, money: 2500, size: 30, rivals: [36, 42, 47] },
    { name: "Small band", desc: "Your first adult band in the Carnival Tuesday parade.", weeks: 6, money: 2800, size: 50, rivals: [44, 51, 57] },
    { name: "Medium band", desc: "More players, tougher judges, more to go wrong.", weeks: 6, money: 3200, size: 80, rivals: [50, 57, 63] },
    { name: "Large band", desc: "The big leagues: a hundred and twenty masqueraders.", weeks: 7, money: 3600, size: 120, rivals: [57, 64, 70] },
    { name: "Band of the Year", desc: "Eight weeks to beat the best bands on the islands.", weeks: 8, money: 4000, size: 150, rivals: [63, 70, 76] },
  ];
  var RIVALS = ["Coral Fire Mas", "Harbour Kings", "Leeward Lights", "Volcano Ash Collective", "Grenadine Pearls", "Mespo Masqueraders"];

  CS.addMode({
    id: "mas", icon: "🎭", title: "Mas Camp",
    blurb: "Run a Vincy Mas band: pick a theme, sew costumes, recruit masqueraders, and win Band of the Year.",
    intro: "Carnival is coming. You lead a band at the mas camp: choose a theme and colours, then use each week well. The judges score costumes, size, music, performance and how well you tell your theme.",
    how: "Pick a theme and three costume colours; colours that suit the theme score <b>theme</b> points. Each week choose <b>two jobs</b>. Some cost money, and recruiting masqueraders brings money in. Each week something happens at the camp. On judging day you're scored out of 100 against three rival bands: <b>1st place earns 3 stars</b>, 2nd earns 2, 3rd earns 1. Finishing in debt costs 10 points.",
    levels: LEVELS.map(function (l) { return { name: l.name, desc: l.desc }; }),
    start: play,
  });

  function costumeSvg(colors, quality) {
    var c = colors.map(function (k) { return COLORS[k]; });
    while (c.length < 3) c.push("#8aa");
    var feathers = 4 + Math.min(10, Math.floor(quality / 9)), f = "";
    for (var i = 0; i < feathers; i++) {
      var a = -150 + i * (120 / (feathers - 1));
      f += '<ellipse cx="0" cy="-70" rx="9" ry="' + (36 + quality / 6) + '" fill="' + c[i % 3] + '" transform="rotate(' + (a + 90) + ') translate(0 -20)"/>';
    }
    return '<svg class="costume" viewBox="-120 -170 240 300" role="img" aria-label="Your costume">' +
      '<g transform="translate(0 -40)">' + f + "</g>" +
      '<circle cx="0" cy="-40" r="18" fill="#7a4b2a"/><path d="M-18 -50 Q0 -72 18 -50" fill="' + c[0] + '"/>' +
      '<path d="M-26 -18 L26 -18 L34 60 L-34 60 Z" fill="' + c[1] + '"/><path d="M-26 -18 L26 -18 L18 20 L-18 20 Z" fill="' + c[2] + '" opacity=".9"/>' +
      '<path d="M-34 60 Q-50 90 -60 110 L60 110 Q50 90 34 60 Z" fill="' + c[0] + '" opacity=".85"/>' +
      '<g stroke="' + c[2] + '" stroke-width="7" stroke-linecap="round"><path d="M-26 -12 L-62 -50"/><path d="M26 -12 L62 -50"/></g>' +
      (quality > 40 ? '<g fill="#fff" opacity=".8">' + [-50, -20, 20, 50].map(function (x) { return '<circle cx="' + x + '" cy="' + (90 + (x % 3)) + '" r="3"/>'; }).join("") + "</g>" : "") + "</svg>";
  }

  function play(n, stage, done) {
    var L = LEVELS[n - 1];
    var band = { name: "", themeObj: null, colors: [], money: L.money, costume: 10, masq: Math.round(L.size * 0.2), music: 10, perf: 5, theme: 0, fabric: 1, power: 1, used: {} };
    var week = 1, picks = [], log = [];

    // ---------------- set-up
    function setup() {
      var chosen = null, cols = [];
      stage.innerHTML = '<div class="card"><h2>Start your band</h2><p class="muted">' + esc(L.desc) + " " + L.weeks + " weeks to carnival · EC$" + L.money.toLocaleString() + " in the bank · aim for " + L.size + " masqueraders.</p>" +
        '<label class="muted" for="bn">Band name</label><br><input id="bn" maxlength="30" value="Island Spirit Mas" style="width:min(100%,360px);margin:6px 0 16px">' +
        '<h3>Choose a theme</h3><div class="actions" id="themes">' + THEMES.map(function (t) {
          return '<button class="act" data-t="' + t.id + '"><b>' + esc(t.name) + "</b><small>" + esc(t.note) + "</small></button>";
        }).join("") + '</div><h3 style="margin-top:16px">Pick three costume colours</h3><div class="swatches" id="sw">' + Object.keys(COLORS).map(function (k) {
          return '<button class="sw" data-c="' + k + '" style="background:' + COLORS[k] + '" aria-label="' + k + '" title="' + k + '"></button>';
        }).join("") + '</div><p class="muted" id="fit"></p><p><button class="btn" id="begin" disabled>Open the mas camp →</button></p></div>';
      function refresh() {
        stage.querySelectorAll("[data-t]").forEach(function (b) { b.style.borderColor = chosen && b.dataset.t === chosen.id ? "#ffd166" : ""; });
        stage.querySelectorAll("[data-c]").forEach(function (b) { b.classList.toggle("on", cols.indexOf(b.dataset.c) >= 0); });
        var ready = chosen && cols.length === 3;
        stage.querySelector("#begin").disabled = !ready;
        stage.querySelector("#fit").textContent = !chosen ? "Pick a theme first." : cols.length < 3 ? "Choose " + (3 - cols.length) + " more colour" + (cols.length === 2 ? "" : "s") + "." :
          "Theme fit: " + fit(chosen, cols) + " / 100." + (fit(chosen, cols) < 100 ? " Think about the colours your theme brings to mind." : " Perfect match.");
      }
      stage.querySelectorAll("[data-t]").forEach(function (b) { b.addEventListener("click", function () { chosen = THEMES.filter(function (t) { return t.id === b.dataset.t; })[0]; refresh(); }); });
      stage.querySelectorAll("[data-c]").forEach(function (b) {
        b.addEventListener("click", function () {
          var k = b.dataset.c, at = cols.indexOf(k);
          if (at >= 0) cols.splice(at, 1); else if (cols.length < 3) cols.push(k);
          refresh();
        });
      });
      stage.querySelector("#begin").addEventListener("click", function () {
        band.name = stage.querySelector("#bn").value.trim() || "Your band";
        band.themeObj = chosen;
        band.colors = cols.slice();
        band.theme = fit(chosen, cols) * 0.7;
        camp();
      });
      refresh();
    }
    function fit(t, cols) {
      return Math.round(cols.filter(function (c) { return t.colors.indexOf(c) >= 0; }).length / 3 * 100);
    }

    // ---------------- the weeks
    function stat(label, v, suffix) { return '<div class="stat"><b>' + v + (suffix || "") + "</b><span>" + label + "</span></div>"; }
    function clamp() {
      ["costume", "music", "perf", "theme"].forEach(function (k) { band[k] = Math.max(0, Math.min(100, Math.round(band[k]))); });
    }
    function camp(eventText) {
      clamp();
      stage.innerHTML = '<div class="hud"><span class="chip">Week <b>' + week + "</b> of " + L.weeks + '</span><span class="chip">Bank <b>EC$' + band.money.toLocaleString() + '</b></span><span class="chip">' + esc(band.name) + " · " + esc(band.themeObj.name) + "</span></div>" +
        '<div class="mas"><div class="card"><div class="stats">' + stat("Costumes", band.costume) + stat("Masqueraders", band.masq + "/" + L.size) + stat("Music", band.music) + stat("Performance", band.perf) + stat("Theme", band.theme) + "</div>" +
        (eventText ? '<div class="event">📣 ' + esc(eventText) + "</div>" : "") +
        "<h3>Choose two jobs this week <span class=\"muted\" id=\"left\"></span></h3><div class=\"actions\">" + ACTIONS.map(function (a) {
          var used = band.used[a.id] || 0, blocked = (a.once && used) || (a.max && used >= a.max) || a.cost > band.money;
          return '<button class="act" data-a="' + a.id + '"' + (blocked ? " disabled" : "") + "><b>" + a.icon + " " + esc(a.name) + "</b><small>" + esc(a.note) + "</small><small>" + (a.cost ? "Costs EC$" + a.cost : "Free") +
            (a.once && used ? " · done" : a.max ? " · " + used + "/" + a.max + " used" : "") + "</small></button>";
        }).join("") + '</div><div id="wk"></div></div><div class="card"><h3>' + esc(band.name) + "</h3>" + costumeSvg(band.colors, band.costume) + '<p class="muted">' + esc(band.themeObj.note) + "</p></div></div>";
      picks = [];
      var leftEl = stage.querySelector("#left");
      leftEl.textContent = "(0 of 2)";
      stage.querySelectorAll("[data-a]").forEach(function (b) {
        b.addEventListener("click", function () {
          if (picks.length >= 2) return;
          var a = ACTIONS.filter(function (x) { return x.id === b.dataset.a; })[0];
          if (a.cost > band.money) return;
          band.money -= a.cost;
          band.used[a.id] = (band.used[a.id] || 0) + 1;
          band.lastMsg = null;
          a.effect(band, L);
          clamp();
          picks.push(a.name + (band.lastMsg ? " (" + band.lastMsg + ")" : ""));
          if (picks.length === 2) return endWeek();
          camp(eventText);
          picks = [a.name + (band.lastMsg ? " (" + band.lastMsg + ")" : "")];
          stage.querySelector("#left").textContent = "(1 of 2: " + picks[0] + ")";
        });
      });
    }
    function endWeek() {
      band.fabric = 1;
      band.power = 1;
      log.push("Week " + week + ": " + picks.join(", "));
      if (week >= L.weeks) return judging();
      week++;
      var ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      ev.fx(band, L);
      camp(ev.text);
    }

    // ---------------- judging day
    function score() {
      var size = Math.min(100, band.masq / L.size * 100);
      var parts = { Costumes: band.costume * 0.30, Size: size * 0.15, Music: band.music * 0.20, Performance: band.perf * 0.20, Theme: band.theme * 0.15 };
      var total = Object.keys(parts).reduce(function (s, k) { return s + parts[k]; }, 0) - (band.money < 0 ? 10 : 0);
      return { parts: parts, total: Math.round(total * 10) / 10 };
    }
    function judging() {
      var me = score(), names = CS.shuffle(RIVALS).slice(0, 3);
      var table = L.rivals.map(function (r, i) { return { name: names[i], total: Math.round((r + Math.random() * 4 - 2) * 10) / 10 }; });
      table.push({ name: band.name, total: me.total, you: true });
      table.sort(function (a, b) { return b.total - a.total; });
      var place = table.findIndex(function (r) { return r.you; }) + 1;
      var stars = place === 1 ? 3 : place === 2 ? 2 : place === 3 ? 1 : 0;
      var ord = ["1st", "2nd", "3rd", "4th"][place - 1];
      done({ stars: stars, score: Math.round(me.total * 50) + (4 - place) * 500,
        title: place === 1 ? (n === 5 ? "Band of the Year!" : "First place!") : ord + " place",
        summary: '<table class="scores"><tr><th>Band</th><th>Score</th></tr>' + table.map(function (r, i) {
          return '<tr class="' + (r.you ? "you" : "") + '"><td>' + (i + 1) + ". " + esc(r.name) + "</td><td>" + r.total + "</td></tr>";
        }).join("") + "</table><p><b>Your scores:</b> " + Object.keys(me.parts).map(function (k) { return k + " " + me.parts[k].toFixed(1); }).join(" · ") +
          (band.money < 0 ? " · in debt −10" : "") + "</p><p class=\"muted\">" + (stars === 3 ? "" : "Tip: music and performance count as much as costumes, and a strong theme story adds up.") + "</p>" });
    }

    stage.__mas = { pick: function (id) { var b = stage.querySelector('[data-a="' + id + '"]'); if (b && !b.disabled) { b.click(); return true; } return false; }, band: function () { return band; }, week: function () { return week; } };
    setup();
  }
  CS.MAS = { THEMES: THEMES };
})();
