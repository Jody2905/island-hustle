/* Mode 2: Island Explorer. Read a clue, find the place on the map, earn its stamp. */
(function () {
  "use strict";
  var esc = CS.esc;

  // Places on a stylised map (viewBox 0 0 520 900, not to scale)
  var REGIONS = [
    { name: "Kingstown and the south", desc: "The capital, a hilltop fort, the oldest gardens and a brand-new airport.", places: [
      { id: "kingstown", icon: "🏛️", name: "Kingstown", x: 222, y: 370, clue: "Start in the capital, nicknamed the “City of Arches”.",
        fact: "Kingstown is the capital and main port. Its old stone arcades and arches give the town its nickname." },
      { id: "fort", icon: "🏰", name: "Fort Charlotte", x: 196, y: 348, clue: "Find the fort on the ridge west of the capital, finished in 1806 and named after a queen.",
        fact: "Fort Charlotte sits on a ridge above Kingstown and was finished in 1806. Many of its cannons point inland rather than out to sea." },
      { id: "gardens", icon: "🌺", name: "Botanic Gardens", x: 240, y: 345, clue: "Find the gardens founded in 1765, among the oldest in the Americas.",
        fact: "The St. Vincent Botanic Gardens were founded in 1765. Captain Bligh brought breadfruit plants here in 1793, and a tree grown from that cargo still stands." },
      { id: "chatoyer", icon: "🗿", name: "Dorsetshire Hill", x: 258, y: 322, clue: "Visit the hill where Paramount Chief Joseph Chatoyer fell in 1795. A national hero is remembered here.",
        fact: "Chief Joseph Chatoyer led the Garifuna against British forces and was killed here in 1795. He is the first National Hero, honoured every 14 March." },
      { id: "young", icon: "🏝️", name: "Young Island", x: 266, y: 396, clue: "Find the tiny island just a short boat ride from Villa Beach.",
        fact: "Young Island lies a couple of hundred metres off Villa Beach, close enough that a small water taxi crosses in a minute or two." },
      { id: "argyle", icon: "✈️", name: "Argyle International Airport", x: 320, y: 330, clue: "Find where the big jets land, opened in 2017 on the southeast coast.",
        fact: "Argyle International Airport opened in 2017, letting long-haul flights land on St. Vincent for the first time." },
    ] },
    { name: "The Leeward coast", desc: "Calm Caribbean side: ancient rock carvings, waterfalls, parrots and a pirate film set.", places: [
      { id: "layou", icon: "🪨", name: "Layou Petroglyph", x: 186, y: 288, clue: "Find a rock carved with faces by the island's first peoples, long before Europeans arrived.",
        fact: "The petroglyphs near Layou were carved by Indigenous peoples centuries ago. They are among the best-known rock carvings in the Eastern Caribbean." },
      { id: "vermont", icon: "🦜", name: "Vermont Nature Trail", x: 228, y: 280, clue: "Head inland to the rainforest trail where you might spot the national bird.",
        fact: "The Vermont Nature Trail is the best place to look for the St. Vincent parrot (Amazona guildingii), the national bird, found nowhere else on Earth." },
      { id: "barrouallie", icon: "🐋", name: "Barrouallie", x: 180, y: 244, clue: "Find the fishing town known for hunting blackfish.",
        fact: "Barrouallie's fishermen have hunted blackfish (pilot whales) from small boats for generations." },
      { id: "wallilabou", icon: "🏴‍☠️", name: "Wallilabou Bay", x: 184, y: 204, clue: "Find the bay where Captain Jack Sparrow came ashore in a famous pirate film.",
        fact: "Wallilabou Bay was a main set for Pirates of the Caribbean: The Curse of the Black Pearl (2003). Some of the film buildings still stand." },
      { id: "darkview", icon: "💧", name: "Dark View Falls", x: 198, y: 128, clue: "Find the twin waterfalls reached by a bamboo bridge, near Chateaubelair.",
        fact: "Dark View Falls has two cascades, one above the other, with a pool at the bottom. You reach it across a bamboo bridge." },
      { id: "chateaubelair", icon: "🎣", name: "Chateaubelair", x: 188, y: 150, clue: "Find the last big village on the leeward road before the volcano.",
        fact: "Chateaubelair sits at the northern end of the leeward road, in the shadow of La Soufrière." },
    ] },
    { name: "The windward side and the north", desc: "Atlantic waves, the volcano, black-sand rivers and a tunnel through rock.", places: [
      { id: "soufriere", icon: "🌋", name: "La Soufrière", x: 252, y: 92, clue: "Find the volcano that erupted in April 2021, the island's highest peak.",
        fact: "La Soufrière, about 1,234 m high, erupted explosively in April 2021; most people in the north had already been evacuated. Earlier eruptions in 1902 and 1979 shaped the land around it." },
      { id: "fancy", icon: "🏘️", name: "Fancy", x: 266, y: 50, clue: "Find the northernmost village on the island.",
        fact: "Fancy is St. Vincent's northernmost village, at the far end of the windward road." },
      { id: "owia", icon: "🌊", name: "Owia Salt Pond", x: 306, y: 72, clue: "Find the natural pools behind a wall of volcanic rock, in a Kalinago community.",
        fact: "At Owia, waves break over a rock barrier into calm salt pools. Owia is one of the island's Kalinago (Carib) communities." },
      { id: "rabacca", icon: "🏜️", name: "Rabacca Dry River", x: 324, y: 126, clue: "Find the wide riverbed of volcanic debris you cross to reach the north.",
        fact: "The Rabacca Dry River is a broad bed of volcanic sand and boulders. It is usually dry, but floods quickly after heavy rain or an eruption." },
      { id: "blackpoint", icon: "🕳️", name: "Black Point Tunnel", x: 332, y: 176, clue: "Find the tunnel cut through rock in 1815, once used to move sugar to the sea.",
        fact: "Black Point Tunnel was cut through volcanic rock in 1815 by enslaved Africans, so sugar from the estates could be taken to the boats." },
      { id: "georgetown", icon: "🏡", name: "Georgetown", x: 338, y: 210, clue: "Find the windward town that was once the heart of the sugar estates.",
        fact: "Georgetown, on the windward coast, was the centre of the old sugar and arrowroot estates. St. Vincent was once the world's leading producer of arrowroot." },
    ] },
    { name: "Bequia, Mustique and Canouan", desc: "Boat builders, turtles, a royal beach and a famous private island.", places: [
      { id: "porte", icon: "⛵", name: "Port Elizabeth", x: 236, y: 452, clue: "Find Bequia's harbour town on Admiralty Bay, full of yachts.",
        fact: "Port Elizabeth sits on Admiralty Bay, one of the best-known anchorages in the Caribbean. The ferry from Kingstown arrives here." },
      { id: "pmb", icon: "🏖️", name: "Princess Margaret Beach", x: 224, y: 466, clue: "Find the beach named after a princess.",
        fact: "Princess Margaret Beach is named after Britain's Princess Margaret, who visited Bequia in the 1950s and is said to have swum here." },
      { id: "turtles", icon: "🐢", name: "Old Hegg Turtle Sanctuary", x: 272, y: 442, clue: "Find the sanctuary where a local fisherman raises hawksbill turtles.",
        fact: "The Old Hegg Turtle Sanctuary was started in 1995 by Orton “Brother” King to raise young hawksbill turtles and release them to the sea." },
      { id: "models", icon: "🛶", name: "Bequia boat builders", x: 252, y: 472, clue: "Find the island famous for hand-made model boats and a seafaring tradition.",
        fact: "Bequia is known for its boat builders and model makers, who carve detailed models of local sailing boats and famous ships by hand." },
      { id: "mustique", icon: "💎", name: "Mustique", x: 322, y: 526, clue: "Find the private island where Princess Margaret had a holiday home.",
        fact: "Mustique is a private island. Princess Margaret was given land here in 1960 and later built a villa, and the island became famous for celebrity visitors." },
      { id: "canouan", icon: "🐚", name: "Canouan", x: 252, y: 622, clue: "Find the island between Mustique and Mayreau with a long reef on its windward side.",
        fact: "Canouan, in the middle of the Grenadines, is known for its white beaches and the reef that shelters its eastern side." },
    ] },
    { name: "The southern Grenadines", desc: "Turtles in the Tobago Cays, the smallest inhabited island and the southernmost one.", places: [
      { id: "cays", icon: "🐠", name: "Tobago Cays", x: 262, y: 708, clue: "Find the marine park of five uninhabited cays inside Horseshoe Reef.",
        fact: "The Tobago Cays Marine Park protects five small uninhabited cays inside Horseshoe Reef. Green turtles graze in the shallows, and one cay appeared in Pirates of the Caribbean." },
      { id: "mayreau", icon: "🥥", name: "Mayreau", x: 214, y: 700, clue: "Find one of the smallest inhabited islands, with Salt Whistle Bay on its tip.",
        fact: "Mayreau is one of the smallest inhabited islands in the country, with no airport, and is famous for the curving beach at Salt Whistle Bay." },
      { id: "union", icon: "🪁", name: "Clifton, Union Island", x: 170, y: 742, clue: "Find the southern port where yachts clear customs and kitesurfers ride the trade winds.",
        fact: "Clifton on Union Island is the main port of entry for yachts in the southern Grenadines, and its steady winds draw kitesurfers." },
      { id: "taboi", icon: "⛰️", name: "Mount Taboi", x: 150, y: 732, clue: "Climb the highest hill on Union Island.",
        fact: "Mount Taboi is Union Island's highest point, with views over the whole southern Grenadines." },
      { id: "palm", icon: "🌴", name: "Palm Island", x: 206, y: 764, clue: "Find the private resort island once called Prune Island.",
        fact: "Palm Island was once called Prune Island. It was renamed after the coconut palms planted there when it became a resort." },
      { id: "psv", icon: "⚓", name: "Petit St. Vincent", x: 252, y: 828, clue: "Find the southernmost island of the country, near Grenada's waters.",
        fact: "Petit St. Vincent is the southernmost island of St. Vincent and the Grenadines, a private resort island close to Petite Martinique in Grenada." },
    ] },
  ];

  CS.addMode({
    id: "explore", icon: "🗺️", title: "Island Explorer",
    blurb: "Follow clues across 32 islands and cays: volcano, forts, reefs and royal beaches. Collect every stamp.",
    intro: "A visitor wants to see the real St. Vincent and the Grenadines. Read each clue and find the place on the map. Every find earns a stamp and a story.",
    how: "Read the clue, then click the matching pin on the map. Pins only show their name once you've found them. A correct find earns a stamp and a fact. A wrong pin costs a star's worth of accuracy: no mistakes for 3 stars, two or fewer for 2.",
    levels: REGIONS.map(function (r) { return { name: r.name, desc: r.desc }; }),
    start: play,
  });

  function mapSvg(region) {
    var pins = region.places.map(function (p) {
      return '<g class="pin" tabindex="0" role="button" aria-label="A place on the map" data-id="' + p.id + '" transform="translate(' + p.x + " " + p.y + ')">' +
        '<circle class="hit" r="18"/><circle class="dot" r="9"/><text class="lbl hidden" x="12" y="4"></text></g>';
    }).join("");
    return '<svg class="map" viewBox="0 0 520 900" role="img" aria-label="Map of St. Vincent and the Grenadines">' +
      '<defs><radialGradient id="land" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#4caf6a"/><stop offset="1" stop-color="#2f7d4f"/></radialGradient></defs>' +
      '<rect width="520" height="900" fill="#0b6e86"/>' +
      '<text class="sea" x="40" y="300">Caribbean Sea</text><text class="sea" x="400" y="260">Atlantic</text><text class="sea" x="400" y="280">Ocean</text>' +
      // St. Vincent
      '<path d="M262 38 C284 40 300 52 312 66 C326 82 338 104 342 128 C350 150 346 170 350 192 C356 222 350 252 342 278 C336 300 330 318 316 336 C304 354 300 370 284 384 C270 396 250 398 234 392 C216 386 208 372 200 356 C190 340 186 318 180 298 C174 276 178 254 174 232 C170 206 176 182 182 158 C188 132 196 108 208 88 C222 64 240 40 262 38 Z" fill="url(#land)" stroke="#d9f3c7" stroke-width="2"/>' +
      '<path d="M236 92 L252 70 L268 92 Z" fill="#6b4f3a"/>' +
      // the Grenadines, north to south
      '<path d="M214 444 C230 432 262 430 280 438 C288 446 278 462 262 470 C244 478 220 476 210 466 C204 458 206 450 214 444 Z" fill="url(#land)" stroke="#d9f3c7" stroke-width="2"/>' +
      '<path d="M312 516 C320 508 332 510 334 520 C336 532 326 540 316 536 C308 532 306 522 312 516 Z" fill="url(#land)" stroke="#d9f3c7" stroke-width="2"/>' +
      '<path d="M238 606 C250 598 268 604 270 618 C272 634 258 642 246 638 C234 632 230 616 238 606 Z" fill="url(#land)" stroke="#d9f3c7" stroke-width="2"/>' +
      '<path d="M204 690 C214 682 228 690 226 702 C224 712 210 714 204 706 C200 700 200 694 204 690 Z" fill="url(#land)" stroke="#d9f3c7" stroke-width="2"/>' +
      '<g fill="url(#land)" stroke="#d9f3c7" stroke-width="1.5"><circle cx="256" cy="702" r="5"/><circle cx="268" cy="700" r="4"/><circle cx="262" cy="714" r="4"/><circle cx="252" cy="712" r="3"/><circle cx="272" cy="712" r="3"/></g>' +
      '<path d="M236 690 C258 680 290 692 292 714 C292 728 270 736 244 728" fill="none" stroke="#9be7f2" stroke-width="2" stroke-dasharray="3 4"/>' +
      '<path d="M140 728 C156 718 182 722 186 740 C188 756 166 762 150 756 C138 750 134 738 140 728 Z" fill="url(#land)" stroke="#d9f3c7" stroke-width="2"/>' +
      '<circle cx="206" cy="764" r="7" fill="url(#land)" stroke="#d9f3c7" stroke-width="1.5"/>' +
      '<circle cx="252" cy="828" r="8" fill="url(#land)" stroke="#d9f3c7" stroke-width="1.5"/>' +
      '<text x="300" y="34" class="sea">St. Vincent</text><text x="160" y="436" class="sea">Bequia</text><text x="300" y="566" class="sea">Mustique</text>' +
      '<text x="218" y="664" class="sea">Canouan</text><text x="122" y="780" class="sea">Union</text>' +
      '<text x="380" y="880" class="sea">Not to scale</text>' + pins + "</svg>";
  }

  function play(n, stage, done) {
    var R = REGIONS[n - 1], order = CS.shuffle(R.places), i = 0, mistakes = 0, wrongHere = 0, found = {};
    stage.innerHTML = '<div class="hud"><span class="chip">Clue <b id="cn">1</b> of ' + order.length + '</span><span class="chip">Mistakes <b id="mk">0</b></span><span class="chip">' + esc(R.name) + '</span></div>' +
      '<div class="map-wrap"><div>' + mapSvg(R) + '</div><div class="card"><h3>Your clue</h3><p class="clue" id="clue"></p><div id="after"></div>' +
      '<h3 style="margin-top:16px">Stamp book</h3><div class="stampbook">' + R.places.map(function (p) { return '<div class="stamp" data-s="' + p.id + '" title="' + esc(p.name) + '">' + p.icon + "</div>"; }).join("") + "</div></div></div>";
    var clue = stage.querySelector("#clue"), after = stage.querySelector("#after");
    function show() {
      wrongHere = 0;
      clue.textContent = order[i].clue;
      stage.querySelector("#cn").textContent = i + 1;
      after.innerHTML = "";
    }
    function byId(id) { return R.places.filter(function (p) { return p.id === id; })[0]; }
    function pick(g) {
      var id = g.dataset.id, want = order[i];
      if (found[want.id] || after.innerHTML) return;
      if (id !== want.id) {
        if (found[id]) return CS.toast("You've already found " + byId(id).name + ".");
        mistakes++;
        wrongHere++;
        stage.querySelector("#mk").textContent = mistakes;
        g.classList.add("wrong");
        setTimeout(function () { g.classList.remove("wrong"); }, 700);
        if (wrongHere === 2) CS.toast("Hint: it's " + hintFor(want));
        return;
      }
      found[id] = true;
      g.classList.add("found");
      var lbl = g.querySelector(".lbl");
      lbl.textContent = want.name;
      lbl.classList.remove("hidden");
      stage.querySelector('[data-s="' + id + '"]').classList.add("on");
      var last = i === order.length - 1;
      after.innerHTML = '<div class="fact"><b>' + want.icon + " " + esc(want.name) + "</b><br>" + esc(want.fact) + '</div><p><button class="btn" id="next">' + (last ? "Finish the tour" : "Next clue →") + "</button></p>";
      after.querySelector("#next").addEventListener("click", function () {
        if (last) return end();
        i++;
        show();
      });
      after.querySelector("#next").focus();
    }
    function hintFor(p) {
      var w = p.x < 220 ? "on the western side" : p.x > 290 ? "on the eastern side" : "in the middle";
      var h = p.y < 200 ? " of the north" : p.y < 420 ? " of the main island's south" : p.y < 650 ? " of the northern Grenadines" : " of the southern Grenadines";
      return w + h + ".";
    }
    stage.querySelectorAll(".pin").forEach(function (g) {
      g.addEventListener("click", function () { pick(g); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(g); } });
    });
    function end() {
      var stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      done({ stars: stars, score: Math.max(100, 600 - mistakes * 75) + (stars === 3 ? 200 : 0), title: stars === 3 ? "Tour guide material" : "Tour complete",
        summary: "<p>You found all " + order.length + " places with <b>" + mistakes + "</b> wrong pin" + (mistakes === 1 ? "" : "s") + ".</p><p>Stamps collected: " +
          R.places.map(function (p) { return p.icon; }).join(" ") + "</p>" });
    }
    stage.__ex = { want: function () { return order[i].id; } };
    show();
  }
  CS.EXPLORER_REGIONS = REGIONS;
})();
