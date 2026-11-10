/* GOAT RAMPAGE v4 — 신규 캐릭터 + 추가 스킬 데이터 (번들보다 먼저 실행) */
(function(){
  var D = /*DATA*/null;
  window.__GOAT_V4 = D;
  window.__GOAT_EXT = function (CH) {
    try {
      D.new.forEach(function (c) { if (!CH[c.id]) CH[c.id] = c; });
      Object.keys(D.alt).forEach(function (id) {
        if (CH[id]) { CH[id].moves.headbutt2 = D.alt[id].headbutt2; CH[id].moves.special2 = D.alt[id].special2; }
      });
    } catch (e) { try { console.error("[v4] ext 실패", e); } catch (_) {} }
  };
})();
