/* GOAT RAMPAGE v6 — 캐릭터 데이터 · 고유 패시브/상태이상 규칙 (번들보다 먼저 실행) */
(function(){
  var D = /*DATA*/null;
  window.__GOAT_V4 = D;
/*TRAITS*/
  window.__GOAT_T = { tick: tick, mod: mod, hit: hit, start: start, PASSIVES: PASSIVES };
  function applyPatch(m, p) {
    if (!m) return;
    Object.keys(p).forEach(function (k) {
      if (k === "_x") Object.keys(p._x).forEach(function (f) { if (typeof m[f] === "number") { m[f] = m[f] * p._x[f]; if (f === "damage") m[f] = Math.round(m[f]); } });
      else m[k] = p[k];
    });
  }
  window.__GOAT_EXT = function (CH) {
    window.__GOAT_CH = CH;
    try {
      D.new.forEach(function (c) { if (!CH[c.id]) CH[c.id] = c; });
      Object.keys(D.alt).forEach(function (id) { if (CH[id]) { CH[id].moves.headbutt2 = D.alt[id].headbutt2; CH[id].moves.special2 = D.alt[id].special2; } });
      Object.keys(D.patch).forEach(function (id) { if (CH[id]) Object.keys(D.patch[id]).forEach(function (mk) { applyPatch(CH[id].moves[mk], D.patch[id][mk]); }); });
    } catch (e) { try { console.error("[v6] ext 실패", e); } catch (_) {} }
  };
})();
