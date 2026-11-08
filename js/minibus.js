/* Mode 1: Minibus Run. Top-down lane driving on real routes. */
(function () {
  "use strict";
  var esc = CS.esc;
  var W = 450, H = 720, LANES = 3, ROAD_X = 75, ROAD_W = 300, LANE_W = ROAD_W / LANES;

  var ROUTES = [
    { name: "Kingstown to Arnos Vale", desc: "A short morning run along the south coast. Learn the road.", km: 3, speed: 260, density: 0.9, fare: 3,
      side: "town", sea: "left", hazards: ["pothole", "car", "chicken"], weather: "sun",
      facts: "Kingstown is the capital, known as the “City of Arches” for the stone arches along its old streets." },
    { name: "Richland Park run", desc: "Kingstown up to Mesopotamia. Hills, potholes and a full bus at school time.", km: 4, speed: 290, density: 1.1, fare: 4,
      side: "valley", sea: null, hazards: ["pothole", "car", "goat", "chicken"], weather: "sun",
      facts: "The Mesopotamia Valley, “Mespo”, is one of the most fertile farming areas on St. Vincent." },
    { name: "Leeward Highway", desc: "North to Barrouallie along the cliffs. Watch for goats.", km: 5, speed: 310, density: 1.2, fare: 5,
      side: "cliff", sea: "left", hazards: ["goat", "pothole", "truck", "rock"], weather: "sun",
      facts: "The Leeward coast faces the calm Caribbean Sea; Barrouallie is a fishing town known for its blackfish (pilot whale) hunters." },
    { name: "Windward to Georgetown", desc: "Rain on the Atlantic side. Slippery roads and slow trucks.", km: 5.5, speed: 310, density: 1.25, fare: 6,
      side: "windward", sea: "right", hazards: ["truck", "pothole", "car", "goat", "puddle"], weather: "rain",
      facts: "Georgetown, on the windward coast, was the old centre of the sugar and arrowroot estates." },
    { name: "Carnival night", desc: "Vincy Mas is on. Packed streets, music, and everybody needs a ride.", km: 6, speed: 320, density: 1.35, fare: 8,
      side: "carnival", sea: "left", hazards: ["car", "crowd", "pothole", "truck", "cone"], weather: "night",
      facts: "Vincy Mas, the national carnival, builds up to Carnival Monday and Tuesday in early July." },
  ];

  var HAZ = {
    pothole: { icon: null, w: 54, h: 30, hit: true, label: "pothole" },
    puddle: { icon: null, w: 70, h: 34, hit: false, slip: true, label: "puddle" },
    car: { icon: "🚗", w: 56, h: 84, hit: true, moves: 0.35, label: "car" },
    truck: { icon: "🚚", w: 62, h: 110, hit: true, moves: 0.15, label: "truck" },
    goat: { icon: "🐐", w: 46, h: 46, hit: true, wander: true, label: "goat" },
    chicken: { icon: "🐔", w: 38, h: 38, hit: true, wander: true, label: "chicken" },
    rock: { icon: "🪨", w: 50, h: 44, hit: true, label: "fallen rock" },
    cone: { icon: "🚧", w: 50, h: 44, hit: true, label: "road works" },
    crowd: { icon: "💃", w: 70, h: 50, hit: true, wander: true, label: "dancers" },
  };

  CS.addMode({
    id: "bus", icon: "🚌", title: "Minibus Run",
    blurb: "Drive a Vincentian minibus. Pick up passengers, dodge potholes and goats, keep the music going.",
    intro: "You drive “Blessed”, a 15-seater with loud speakers and a good reputation. Collect fares along the route and get everyone there in one piece.",
    how: "Change lanes with <b>← →</b> (or A and D), or tap/swipe left and right on your phone. Drive through a <b>🙋 bus stop</b> to pick up passengers and collect their fare. Grab <b>🎵 soca notes</b> to double fares for a while. Hitting a pothole, an animal or a vehicle dents the bus: three dents and the run is over. Puddles make you slide. Stars depend on how many fares you collect.",
    levels: ROUTES.map(function (r) { return { name: r.name, desc: r.desc }; }),
    start: play,
  });

  function play(n, stage, done) {
    var R = ROUTES[n - 1];
    var length = R.km * 1000, dist = 0, lane = 1, busX = laneX(1), dents = 0, fares = 0, riders = 0, possible = 0;
    var hits = [], objs = [], next = 0.8, boost = 0, flash = 0, over = false, msg = "", msgT = 0, slide = 0, t0 = 0;
    stage.innerHTML =
      '<div class="hud"><span class="chip">Fares <b id="fr">EC$0</b></span><span class="chip">Passengers <b id="rd">0</b></span><span class="chip">Dents <b id="dn">0</b> / 3</span>' +
      '<div class="timer"><i id="pg" style="width:0%"></i></div><span class="chip" id="km">0.0 / ' + R.km + ' km</span></div>' +
      '<div class="bus-wrap"><div><canvas class="bus-canvas" id="cv" width="' + W + '" height="' + H + '" aria-label="The road"></canvas>' +
      '<div class="pad"><button class="btn ghost" id="left" aria-label="Move left">◀</button><button class="btn ghost" id="right" aria-label="Move right">▶</button></div></div>' +
      '<div class="card"><h2>' + esc(R.name) + "</h2><p class=\"muted\">" + esc(R.desc) + '</p><div class="fact">📍 ' + esc(R.facts) + "</div>" +
      '<p class="muted" style="margin-top:14px">Fare on this route: <b>EC$' + R.fare + "</b> a passenger. " + (R.weather === "rain" ? "It's raining: puddles make the bus slide." : R.weather === "night" ? "It's night: things appear late, so stay sharp." : "") +
      '</p><p><button class="btn" id="go">▶ Start the run</button></p></div></div>';
    var cv = stage.querySelector("#cv"), ctx = cv.getContext("2d");
    var ui = { fr: stage.querySelector("#fr"), rd: stage.querySelector("#rd"), dn: stage.querySelector("#dn"), pg: stage.querySelector("#pg"), km: stage.querySelector("#km") };
    var started = false;

    function laneX(l) { return ROAD_X + LANE_W * l + LANE_W / 2; }
    function move(d) {
      if (!started || over) return;
      lane = Math.max(0, Math.min(LANES - 1, lane + d));
    }
    function key(e) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { move(-1); e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { move(1); e.preventDefault(); }
    }
    document.addEventListener("keydown", key);
    CS.onLeave(function () { document.removeEventListener("keydown", key); });
    stage.querySelector("#left").addEventListener("click", function () { move(-1); });
    stage.querySelector("#right").addEventListener("click", function () { move(1); });
    var touchX = null;
    cv.addEventListener("pointerdown", function (e) { touchX = e.clientX; });
    cv.addEventListener("pointerup", function (e) {
      if (touchX === null) return;
      var dx = e.clientX - touchX, r = cv.getBoundingClientRect();
      if (Math.abs(dx) > 25) move(dx > 0 ? 1 : -1);
      else move(e.clientX - r.left < r.width / 2 ? -1 : 1);
      touchX = null;
    });
    stage.querySelector("#go").addEventListener("click", function () {
      started = true;
      stage.querySelector("#go").disabled = true;
      stage.querySelector("#go").textContent = "Driving…";
      cv.focus && cv.focus();
    });

    function say(text) { msg = text; msgT = 1.6; }

    function spawn() {
      var r = Math.random(), l = Math.floor(Math.random() * LANES);
      // Never block every lane: if two other lanes have a hazard close to the top, this one becomes a bus stop
      var blocked = objs.filter(function (o) { return o.kind === "haz" && o.y < 280; }).map(function (o) { return o.lane; });
      var hazardShare = 0.42 + n * 0.05;
      if (r >= 1 - hazardShare && blocked.filter(function (x) { return x !== l; }).length >= 1 && blocked.indexOf(l) < 0 && new Set(blocked).size >= 2) r = 0;
      if (r < (1 - hazardShare) * 0.78) {
        var count = 1 + Math.floor(Math.random() * (n >= 5 ? 4 : 3));
        objs.push({ kind: "stop", lane: l, x: laneX(l), y: -60, count: count });
        possible += count;
      } else if (r < 1 - hazardShare) {
        objs.push({ kind: "note", lane: l, x: laneX(l), y: -40 });
      } else {
        var type = R.hazards[Math.floor(Math.random() * R.hazards.length)], h = HAZ[type];
        objs.push({ kind: "haz", type: type, lane: l, x: laneX(l), y: -h.h, vx: h.wander ? (Math.random() < 0.5 ? -1 : 1) * (12 + n * 5) : 0 });
      }
    }

    function hud() {
      ui.fr.textContent = "EC$" + fares;
      ui.rd.textContent = riders;
      ui.dn.textContent = dents;
      ui.pg.style.width = Math.min(100, dist / length * 100) + "%";
      ui.km.textContent = (dist / 1000).toFixed(1) + " / " + R.km + " km";
    }

    function step(dt) {
      if (!started || over) return;
      var speed = R.speed * (1 + Math.min(0.35, dist / length * 0.35));
      dist += speed * dt * 0.42;  // pixels to metres, roughly
      t0 += dt;
      boost = Math.max(0, boost - dt);
      flash = Math.max(0, flash - dt);
      msgT = Math.max(0, msgT - dt);
      // the bus eases toward its lane (slower when sliding)
      var target = laneX(lane), ease = slide > 0 ? 3 : 14;
      busX += (target - busX) * Math.min(1, ease * dt);
      slide = Math.max(0, slide - dt);
      next -= dt * R.density;
      if (next <= 0 && dist < length - 300) { spawn(); next = 0.55 + Math.random() * 0.75; }
      for (var i = objs.length - 1; i >= 0; i--) {
        var o = objs[i];
        var own = o.kind === "haz" && HAZ[o.type].moves ? speed * HAZ[o.type].moves : 0;
        o.y += (speed - own) * dt;
        if (o.vx) {
          o.x += o.vx * dt;
          if (o.x < ROAD_X + 25 || o.x > ROAD_X + ROAD_W - 25) o.vx *= -1;
        }
        if (o.y > H + 120) { objs.splice(i, 1); continue; }
        // collisions with the bus (bus box around busX, y 560..680)
        var bw = 64, bh = 120, by = H - 150;
        var ow = o.kind === "haz" ? HAZ[o.type].w : 56, oh = o.kind === "haz" ? HAZ[o.type].h : 50;
        if (o.done || Math.abs(o.x - busX) > (bw + ow) / 2 - 14 || o.y + oh / 2 < by || o.y - oh / 2 > by + bh) continue;
        o.done = true;
        if (o.kind === "stop") {
          var pay = o.count * R.fare * (boost > 0 ? 2 : 1);
          fares += pay;
          riders += o.count;
          say("+" + o.count + " passenger" + (o.count > 1 ? "s" : "") + "  +EC$" + pay);
          objs.splice(i, 1);
        } else if (o.kind === "note") {
          boost = 6;
          say("🎵 Soca! Double fares");
          objs.splice(i, 1);
        } else if (HAZ[o.type].slip) {
          slide = 1.2;
          say("Sliiide…");
        } else {
          dents++;
          hits.push({ type: o.type, ox: Math.round(o.x), oy: Math.round(o.y), busX: Math.round(busX), lane: lane });
          flash = 0.5;
          say("Ouch, a " + HAZ[o.type].label + "!");
          if (dents >= 3) return finish(false);
        }
        hud();
      }
      hud();
      if (dist >= length) finish(true);
    }

    // ------------------------------------------------------------ drawing
    var scroll = 0;
    function draw() {
      var night = R.weather === "night", rain = R.weather === "rain";
      scroll = (scroll + (started && !over ? R.speed * 0.016 : 0)) % 80;
      // sides
      var grass = { town: "#5a8f4e", valley: "#3f8a45", cliff: "#6a8a3e", windward: "#3e7a4a", carnival: "#2a3a4a" }[R.side];
      ctx.fillStyle = night ? "#1d2b33" : grass;
      ctx.fillRect(0, 0, W, H);
      if (R.sea) {
        ctx.fillStyle = night ? "#0b2a3a" : "#1fb5c9";
        if (R.sea === "left") ctx.fillRect(0, 0, 40, H); else ctx.fillRect(W - 40, 0, 40, H);
      }
      // roadside things scroll by
      ctx.font = "26px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var deco = { town: ["🏠", "🌴", "🏪"], valley: ["🌴", "🍌", "🏡"], cliff: ["🌴", "🪨", "🌳"], windward: ["🌳", "🌴", "🏚️"], carnival: ["🎪", "🏠", "🎆"] }[R.side];
      for (var k = -1; k < 10; k++) {
        var yy = k * 80 + scroll * 1;
        ctx.fillText(deco[(k + 10) % deco.length], R.sea === "left" ? 58 : 30, yy);
        ctx.fillText(deco[(k + 11) % deco.length], R.sea === "right" ? W - 58 : W - 30, yy + 40);
      }
      // road
      ctx.fillStyle = night ? "#2b2f36" : "#4a4f57";
      ctx.fillRect(ROAD_X, 0, ROAD_W, H);
      ctx.fillStyle = "#e9e3c9";
      ctx.fillRect(ROAD_X + 4, 0, 4, H);
      ctx.fillRect(ROAD_X + ROAD_W - 8, 0, 4, H);
      ctx.fillStyle = "#f5f5f5";
      for (var l = 1; l < LANES; l++) for (var y = -80 + scroll * 2 % 80; y < H; y += 80) ctx.fillRect(ROAD_X + LANE_W * l - 2, y, 4, 40);
      // objects
      objs.forEach(function (o) {
        if (o.kind === "stop") {
          ctx.fillStyle = "rgba(255,209,102,.25)";
          ctx.fillRect(o.x - 44, o.y - 30, 88, 60);
          ctx.strokeStyle = "#ffd166";
          ctx.lineWidth = 2;
          ctx.strokeRect(o.x - 44, o.y - 30, 88, 60);
          ctx.font = "24px serif";
          ctx.fillText("🙋" + (o.count > 1 ? "×" + o.count : ""), o.x, o.y);
        } else if (o.kind === "note") {
          ctx.font = "30px serif";
          ctx.fillText("🎵", o.x, o.y);
        } else if (o.type === "pothole" || o.type === "puddle") {
          ctx.fillStyle = o.type === "pothole" ? "#1b1d21" : "rgba(80,150,200,.6)";
          ctx.beginPath();
          ctx.ellipse(o.x, o.y, HAZ[o.type].w / 2, HAZ[o.type].h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.font = (o.type === "truck" ? 54 : o.type === "car" ? 46 : 34) + "px serif";
          ctx.save();
          ctx.translate(o.x, o.y);
          if (o.type === "car" || o.type === "truck") ctx.rotate(-Math.PI / 2);
          ctx.fillText(HAZ[o.type].icon, 0, 0);
          ctx.restore();
        }
      });
      drawBus(busX, H - 150);
      // weather and night
      if (night) {
        var g = ctx.createRadialGradient(busX, H - 220, 40, busX, H - 260, 340);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,10,.72)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      if (rain) {
        ctx.strokeStyle = "rgba(200,220,255,.35)";
        ctx.lineWidth = 1;
        for (var d = 0; d < 60; d++) {
          var rx = (d * 97 + scroll * 7) % W, ry = (d * 53 + scroll * 13) % H;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 4, ry + 14);
          ctx.stroke();
        }
      }
      if (flash > 0) {
        ctx.fillStyle = "rgba(239,71,111," + flash * 0.6 + ")";
        ctx.fillRect(0, 0, W, H);
      }
      if (boost > 0) {
        ctx.fillStyle = "rgba(255,209,102,.9)";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("🎵 Double fares " + Math.ceil(boost) + "s", W / 2, 24);
      }
      if (msgT > 0) {
        ctx.globalAlpha = Math.min(1, msgT);
        ctx.fillStyle = "rgba(4,34,44,.85)";
        ctx.fillRect(W / 2 - 150, H / 2 - 24, 300, 48);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(msg, W / 2, H / 2);
        ctx.globalAlpha = 1;
      }
      if (!started) {
        ctx.fillStyle = "rgba(4,34,44,.75)";
        ctx.fillRect(0, H / 2 - 60, W, 120);
        ctx.fillStyle = "#ffd166";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText("Press Start, then use ← →", W / 2, H / 2 - 12);
        ctx.fillStyle = "#fff";
        ctx.font = "15px sans-serif";
        ctx.fillText("Tap or swipe on a phone", W / 2, H / 2 + 18);
      }
    }
    function drawBus(x, y) {
      // a colourful 15-seater seen from above, with its name on the roof
      ctx.save();
      ctx.translate(x, y + 60);
      if (slide > 0) ctx.rotate(Math.sin(t0 * 18) * 0.08);
      ctx.fillStyle = "rgba(0,0,0,.3)";
      ctx.fillRect(-30, -58, 64, 124);
      ctx.fillStyle = "#ffd166";
      roundRect(-32, -62, 64, 124, 12);
      ctx.fillStyle = "#e63946";
      ctx.fillRect(-32, -20, 64, 10);
      ctx.fillStyle = "#06d6a0";
      ctx.fillRect(-32, -8, 64, 6);
      ctx.fillStyle = "#9fd8f5";
      roundRect(-24, -56, 48, 18, 5);
      ctx.fillStyle = "#3a2600";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("BLESSED", 0, 22);
      ctx.fillStyle = "#222";
      [[-35, -40], [31, -40], [-35, 34], [31, 34]].forEach(function (w) { ctx.fillRect(w[0], w[1], 5, 18); });
      ctx.restore();
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.fill();
    }

    var last = performance.now(), raf;
    function loop(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (var s = 0; s < (stage.__speed || 1); s++) step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    CS.onLeave(function () { cancelAnimationFrame(raf); over = true; });

    function finish(arrived) {
      over = true;
      var share = possible ? riders / possible : 0;
      var stars = !arrived ? 0 : share >= 0.75 ? 3 : share >= 0.5 ? 2 : 1;
      var score = fares * 10 + (arrived ? (3 - dents) * 200 : 0);
      setTimeout(function () {
        done({
          stars: stars, score: score, title: arrived ? (stars === 3 ? "Driver of the year" : "You made it") : "The bus needs the garage",
          summary: "<p>" + (arrived ? "You reached the end of the route" : "Three dents and the bus is off the road") + " with <b>EC$" + fares + "</b> in fares from <b>" + riders +
            "</b> passengers (" + Math.round(share * 100) + "% of everyone waiting).</p><p>" + (arrived ? "Picking up half the passengers earns 2 stars, three quarters earns 3." : "Change lanes early: things come at you faster as the route goes on.") + "</p>",
        });
      }, 500);
    }

    // For automated play-testing
    stage.__bus = { hits: function () { return hits; }, start: function () { stage.querySelector("#go").click(); }, move: move, state: function () { return { lane: lane, dist: dist, length: length, dents: dents, riders: riders, over: over, objs: objs.map(function (o) { return { kind: o.kind, type: o.type, lane: Math.round((o.x - ROAD_X - LANE_W / 2) / LANE_W), y: o.y, done: !!o.done }; }) }; } };
    hud();
  }
})();
