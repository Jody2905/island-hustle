/* Mode 3: Fisherman's Day. Choose where to fish, reel them in, sell at the best price. */
(function () {
  "use strict";
  var esc = CS.esc;
  var HOURS = 6, CAST = 0.5;

  var FISH = {
    snapper: { name: "Red snapper", icon: "🐟", lb: [2, 7], price: 12 },
    grouper: { name: "Grouper", icon: "🐟", lb: [4, 14], price: 13 },
    jacks: { name: "Jacks (a school)", icon: "🐠", lb: [10, 26], price: 6 },
    tuna: { name: "Yellowfin tuna", icon: "🐟", lb: [15, 45], price: 8, big: true },
    mahi: { name: "Mahi-mahi (dolphin)", icon: "🐬", lb: [8, 25], price: 8, big: true },
    wahoo: { name: "Wahoo (kingfish)", icon: "🐟", lb: [12, 35], price: 9, big: true },
  };
  var SPOTS = {
    reef: { name: "Reef off Calliaqua", icon: "🪸", hours: 1, fuel: 10, fish: ["snapper", "grouper"], zone: 0.30, speed: 0.9,
      note: "Close to home. Steady, smaller fish." },
    jacks: { name: "Jack schools, Leeward coast", icon: "🐠", hours: 2, fuel: 25, fish: ["jacks"], zone: 0.26, speed: 1.0,
      note: "A run up the leeward side. Net a whole school at once." },
    deep: { name: "Deep drop near Bequia", icon: "🕳️", hours: 2, fuel: 30, fish: ["grouper", "snapper", "snapper"], zone: 0.22, speed: 1.15, size: 1.5,
      note: "Deep water in the Bequia channel. Bigger snapper and grouper." },
    fad: { name: "Offshore FAD", icon: "🛟", hours: 3, fuel: 45, fish: ["tuna", "mahi", "wahoo"], zone: 0.18, speed: 1.3,
      note: "A fish aggregating device far out at sea. Big, valuable fish, but a long trip and harder to land." },
  };
  var BUYERS = {
    market: { name: "Kingstown fish market", icon: "🏪", mult: { all: 1 }, fee: 0, note: "Fair prices for everything." },
    bequia: { name: "Bequia restaurants", icon: "🍽️", mult: { big: 1.25, all: 0.9 }, fee: 30, note: "Pay well for tuna, mahi and wahoo. EC$30 in fuel to get there." },
    roadside: { name: "Roadside vendor in Calliaqua", icon: "🛒", mult: { all: 0.8 }, fee: 0, note: "No travel, but they pay less." },
  };

  var DAYS = [
    { name: "First trip", desc: "A calm morning. Learn to reel in at the reef and the jack schools.", spots: ["reef", "jacks"], buyers: ["market"], goal: 300, weather: "calm",
      brief: "Calm seas and light wind. Try the reef first to learn the reel." },
    { name: "Market day", desc: "Deeper water near Bequia, and a choice of where to sell.", spots: ["reef", "jacks", "deep"], buyers: ["market", "roadside"], goal: 420, weather: "calm",
      brief: "Good weather. Restaurants are closed today, so it's the market or the roadside." },
    { name: "Out to the FAD", desc: "The tuna are biting offshore. Is the long trip worth it?", spots: ["reef", "jacks", "deep", "fad"], buyers: ["market", "bequia", "roadside"], goal: 520, weather: "choppy",
      brief: "A bit choppy: fish are harder to land everywhere. Bequia restaurants are buying big fish." },
    { name: "Small cooler", desc: "Your ice box only holds 120 lb. Choose what's worth keeping.", spots: ["reef", "jacks", "deep", "fad"], buyers: ["market", "bequia", "roadside"], goal: 500, weather: "calm", cooler: 120,
      brief: "The big cooler is being repaired: you can only carry 120 lb today. Valuable fish first." },
    { name: "Squall warning", desc: "Everything is open, but a squall arrives at midday.", spots: ["reef", "jacks", "deep", "fad"], buyers: ["market", "bequia", "roadside"], goal: 600, weather: "squall", cooler: 160,
      brief: "The Met Office warns of a squall after 4 hours: anyone still offshore then has to run for harbour. Cooler holds 160 lb." },
  ];

  CS.addMode({
    id: "fish", icon: "🎣", title: "Fisherman's Day",
    blurb: "Take the boat out from Calliaqua, read the weather, reel them in and sell at the best price.",
    intro: "You have a small boat, a cooler and six hours of daylight. Every trip costs fuel and time. Fill the cooler, then decide where to sell.",
    how: "Pick a fishing spot: each one costs time and fuel to reach. At the spot, press <b>Reel in</b> (or Space) when the white hook is inside the green zone. The <b>gold</b> middle lands the biggest fish. Every cast takes half an hour. When you're ready, head home and choose a buyer. Stars depend on your profit after fuel: hit the day's target for one star, 30% over for two, 60% over for three.",
    levels: DAYS.map(function (d) { return { name: d.name, desc: d.desc }; }),
    start: play,
  });

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function play(n, stage, done) {
    var D = DAYS[n - 1], hours = HOURS, fuel = 0, cooler = [], at = null, finished = false;
    var weatherIcon = { calm: "☀️ Calm", choppy: "🌥️ Choppy", squall: "⛈️ Squall from midday" }[D.weather];

    function lbs() { return cooler.reduce(function (s, f) { return s + f.lb; }, 0); }
    function hud() {
      return '<div class="hud"><span class="chip">Time left <b>' + hours.toFixed(1) + ' h</b></span><span class="chip">Fuel spent <b>EC$' + fuel + '</b></span>' +
        '<span class="chip">Cooler <b>' + lbs().toFixed(0) + (D.cooler ? " / " + D.cooler : "") + ' lb</b></span><span class="chip">Target profit <b>EC$' + D.goal + '</b></span><span class="chip weather">' + weatherIcon + "</span></div>";
    }
    function squallNow() { return D.weather === "squall" && HOURS - hours >= 4; }

    function harbour(note) {
      at = null;
      stage.innerHTML = hud() + '<div class="card"><h2>⚓ Calliaqua harbour</h2><p class="ctx">' + esc(note || D.brief) + '</p><div class="spots">' +
        D.spots.map(function (id) {
          var s = SPOTS[id], closed = id === "fad" && squallNow(), tooLate = s.hours + CAST > hours + 0.001;
          return '<button class="spot" data-s="' + id + '"' + (closed || tooLate ? " disabled" : "") + '><b>' + s.icon + " " + esc(s.name) + "</b><small>" + esc(s.note) + "</small><small>⏱ " + s.hours + " h round trip · ⛽ EC$" + s.fuel +
            (closed ? " · closed: squall" : tooLate ? " · not enough time" : "") + "</small></button>";
        }).join("") + '</div><p style="margin-top:16px"><button class="btn" id="sell">Head to sell the catch →</button></p>' + catchList() + "</div>";
      stage.querySelectorAll(".spot").forEach(function (b) { b.addEventListener("click", function () { go(b.dataset.s); }); });
      stage.querySelector("#sell").addEventListener("click", market);
    }
    function catchList() {
      if (!cooler.length) return '<p class="muted">The cooler is empty.</p>';
      return '<div class="catch">' + cooler.map(function (f) { return '<span class="fish">' + FISH[f.type].icon + " " + esc(FISH[f.type].name) + " " + f.lb.toFixed(1) + " lb</span>"; }).join("") + "</div>";
    }

    function go(id) {
      var s = SPOTS[id];
      hours -= s.hours / 2;  // the other half is charged on the way back
      fuel += s.fuel;
      at = id;
      fishing();
    }

    function comeHome() {
      if (at) hours = Math.max(0, hours - SPOTS[at].hours / 2);
      at = null;
    }

    var raf = null;
    CS.onLeave(function () { if (raf) cancelAnimationFrame(raf); finished = true; });

    function fishing(note) {
      var s = SPOTS[at];
      var rough = D.weather === "choppy" ? 0.8 : 1;
      var zoneW = s.zone * rough, zoneStart = rnd(0.08, 0.92 - zoneW), sweetW = zoneW * 0.3, sweetStart = zoneStart + (zoneW - sweetW) / 2;
      var speed = s.speed * (D.weather === "choppy" ? 1.2 : 1), pos = 0, dir = 1, last = performance.now();
      stage.innerHTML = hud() + '<div class="card"><h2>' + s.icon + " " + esc(s.name) + '</h2><p class="ctx">' + esc(note || "Line in the water. Wait for the hook to cross the green, then reel in.") + "</p>" +
        '<div class="reel" id="reel"><div class="zone" style="left:' + zoneStart * 100 + "%;width:" + zoneW * 100 + '%"></div><div class="zone sweet" style="left:' + sweetStart * 100 + "%;width:" + sweetW * 100 + '%"></div><div class="hook" id="hook"></div></div>' +
        '<p class="muted">The trip home takes ' + s.hours / 2 + " h.</p>" + '<div class="choices"><button class="btn" id="reelin">🎣 Reel in!<small>or press Space</small></button><button class="btn ghost" id="back">⚓ Back to harbour</button></div>' + catchList() + "</div>";
      var hook = stage.querySelector("#hook");
      if (hours < CAST + s.hours / 2) stage.querySelector("#reelin").disabled = true;
      function anim(now) {
        var dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        pos += dir * speed * dt * 0.9;
        if (pos > 1) { pos = 1; dir = -1; }
        if (pos < 0) { pos = 0; dir = 1; }
        hook.style.left = pos * 100 + "%";
        raf = requestAnimationFrame(anim);
      }
      raf = requestAnimationFrame(anim);
      function reel() {
        if (hours < CAST + s.hours / 2 || finished) return;
        cancelAnimationFrame(raf);
        document.removeEventListener("keydown", space);
        hours -= CAST;
        var inZone = pos >= zoneStart && pos <= zoneStart + zoneW, sweet = pos >= sweetStart && pos <= sweetStart + sweetW;
        var msg;
        if (!inZone) msg = "The line came up empty. Timing is everything.";
        else {
          var type = s.fish[Math.floor(Math.random() * s.fish.length)], F = FISH[type];
          var lb = (sweet ? rnd((F.lb[0] + F.lb[1]) / 2, F.lb[1]) : rnd(F.lb[0], (F.lb[0] + F.lb[1]) / 2)) * (s.size || 1);
          if (D.cooler && lbs() + lb > D.cooler) msg = "You landed a " + F.name.toLowerCase() + " (" + lb.toFixed(1) + " lb) but the cooler is full, so it went back in the sea.";
          else {
            cooler.push({ type: type, lb: lb });
            msg = (sweet ? "A beauty! " : "Got one: ") + F.name + ", " + lb.toFixed(1) + " lb (about EC$" + Math.round(lb * F.price) + ").";
          }
        }
        if (at === "fad" && squallNow()) { comeHome(); return harbour("⛈️ The squall is coming in. You run for harbour. " + msg); }
        if (hours < CAST + SPOTS[at].hours / 2) return market("Time to head in before dark. " + msg);
        fishing(msg);
      }
      function space(e) { if (e.code === "Space") { e.preventDefault(); reel(); } }
      document.addEventListener("keydown", space);
      CS.onLeave(function () { document.removeEventListener("keydown", space); });
      stage.querySelector("#reelin").addEventListener("click", reel);
      stage.querySelector("#back").addEventListener("click", function () {
        cancelAnimationFrame(raf);
        document.removeEventListener("keydown", space);
        comeHome();
        harbour("Back at the harbour with " + lbs().toFixed(0) + " lb in the cooler.");
      });
      stage.__reel = { pos: function () { return pos; }, zone: [zoneStart, zoneW, sweetStart, sweetW], reel: reel };
    }

    function value(f, buyer) {
      var b = BUYERS[buyer], m = FISH[f.type].big && b.mult.big ? b.mult.big : b.mult.all;
      return f.lb * FISH[f.type].price * m;
    }
    function market(note) {
      if (raf) cancelAnimationFrame(raf);
      var offers = D.buyers.map(function (id) {
        var gross = cooler.reduce(function (s, f) { return s + value(f, id); }, 0);
        return { id: id, gross: Math.round(gross), net: Math.round(gross - BUYERS[id].fee) };
      });
      stage.innerHTML = hud() + '<div class="card"><h2>🏪 Selling the catch</h2>' + (note ? '<p class="ctx">' + esc(note) + "</p>" : "") + catchList() +
        '<table class="market"><thead><tr><th>Buyer</th><th>Pays</th><th></th></tr></thead><tbody>' + offers.map(function (o) {
          var b = BUYERS[o.id];
          return "<tr><td><b>" + b.icon + " " + esc(b.name) + "</b><br><small class=\"muted\">" + esc(b.note) + "</small></td><td>EC$" + o.net + (BUYERS[o.id].fee ? '<br><small class="muted">after EC$' + BUYERS[o.id].fee + " trip</small>" : "") +
            '</td><td><button class="btn" data-b="' + o.id + '">Sell here</button></td></tr>';
        }).join("") + "</tbody></table></div>";
      stage.querySelectorAll("[data-b]").forEach(function (b) {
        b.addEventListener("click", function () {
          var o = offers.filter(function (x) { return x.id === b.dataset.b; })[0];
          end(o);
        });
      });
    }
    function end(o) {
      finished = true;
      var profit = o.net - fuel, r = profit / D.goal;
      var stars = r >= 1.6 ? 3 : r >= 1.3 ? 2 : r >= 1 ? 1 : 0;
      done({ stars: stars, score: Math.max(0, profit) * 5, title: stars === 3 ? "Best day on the water" : stars ? "A good day's work" : "Not enough to cover it",
        summary: "<p>You sold <b>" + lbs().toFixed(0) + " lb</b> at " + esc(BUYERS[o.id].name) + " for <b>EC$" + o.net + "</b>, spent <b>EC$" + fuel + "</b> on fuel: profit <b>EC$" + profit +
          "</b> (target EC$" + D.goal + ").</p><p>" + (stars === 3 ? "" : "Tip: compare money per hour. A long trip pays off only if you land the big fish.") + "</p>" });
    }

    stage.__fish = { go: go, harbour: function () { harbour(); }, market: function () { market(); }, state: function () { return { hours: hours, fuel: fuel, lb: lbs(), at: at }; } };
    harbour();
  }
})();
