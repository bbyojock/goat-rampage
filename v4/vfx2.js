/* GOAT RAMPAGE v6 — 캐릭터별 고유 이펙트(모양·연출이 전부 다름) + 상태이상/버프 표현 */
(function () {
  "use strict";
  var G = null, ADD = 1, PI = Math.PI;
  var FL = {
    RAM: [0x60a5fa, 0xffffff], DASH: [0x34d399, 0xd1fae5], BRUTUS: [0xef4444, 0xfca5a5], VOLT: [0xfde047, 0x38bdf8], TITAN: [0x94a3b8, 0x22d3ee],
    PHANTOM: [0xc084fc, 0x6d28d9], BLAZE: [0xf97316, 0xfde047], FROST: [0x7dd3fc, 0xe0f2fe], SAGE: [0x84cc16, 0xf9a8d4], LANCER: [0xfacc15, 0xffffff]
  };
  function hi() { try { return window.__GOAT_STORE__.getData().settings.graphicsQuality !== "LOW"; } catch (e) { return true; } }
  function R(a, b) { return a + Math.random() * (b - a); }
  function hex(c) { return "#" + ("000000" + c.toString(16)).slice(-6); }

  /* ---------- 기본 도구 ---------- */
  function run(sc, dur, draw, depth, fixed) {
    var g = sc.add.graphics().setDepth(depth || 29).setBlendMode(ADD);
    if (fixed) g.setScrollFactor(0);
    sc.tweens.addCounter({ from: 0, to: 1, duration: dur, onUpdate: function (tw) { try { g.clear(); draw(g, tw.getValue()); } catch (e) {} }, onComplete: function () { g.destroy(); } });
  }
  function later(sc, ms, fn) { sc.time.delayedCall(ms, function () { try { fn(); } catch (e) {} }); }
  function line(g, w, c, a, x1, y1, x2, y2) { g.lineStyle(w, c, a); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath(); }
  function flash(sc, col, a, dur) { var r = sc.add.rectangle(640, 360, 1280, 720, col, a).setScrollFactor(0).setDepth(55).setBlendMode(ADD); sc.tweens.add({ targets: r, alpha: 0, duration: dur, onComplete: function () { r.destroy(); } }); }
  function dim(sc, dur, a) { var r = sc.add.rectangle(640, 360, 1280, 720, 0x000000, 0).setScrollFactor(0).setDepth(26); sc.tweens.add({ targets: r, alpha: a || 0.42, duration: 120, yoyo: true, hold: dur, onComplete: function () { r.destroy(); } }); }
  function shake(sc, ms, p) { try { sc.cameras.main.shake(ms, p); } catch (e) {} }
  function banner(sc, name, col, right) {
    var band = sc.add.rectangle(640, 250, 1280, 58, 0x000000, 0.7).setScrollFactor(0).setDepth(60).setScale(1, 0.1);
    var e1 = sc.add.rectangle(640, 220, 1280, 3, col, 1).setScrollFactor(0).setDepth(61).setBlendMode(ADD);
    var e2 = sc.add.rectangle(640, 280, 1280, 3, col, 1).setScrollFactor(0).setDepth(61).setBlendMode(ADD);
    var t = sc.add.text(right ? 1500 : -300, 250, "★ " + name + " ★", { fontFamily: '"Press Start 2P", sans-serif', fontSize: "26px", color: "#ffffff", stroke: hex(col), strokeThickness: 8 }).setOrigin(0.5).setScrollFactor(0).setDepth(62);
    var all = [band, e1, e2, t];
    sc.tweens.add({ targets: band, scaleY: 1, duration: 110 });
    sc.tweens.add({ targets: t, x: 640, duration: 220, ease: "Cubic.easeOut", onComplete: function () {
      sc.tweens.add({ targets: t, x: right ? 600 : 680, duration: 520 });
      sc.tweens.add({ targets: all, alpha: 0, delay: 520, duration: 200, onComplete: function () { all.forEach(function (o) { o.destroy(); }); } });
    } });
  }
  function pop(sc, x, y, txt, col, size) {
    var t = sc.add.text(x, y, txt, { fontFamily: '"Press Start 2P", sans-serif', fontSize: size + "px", color: col, stroke: "#000", strokeThickness: 6 }).setOrigin(0.5).setDepth(50).setScale(0.3);
    sc.tweens.add({ targets: t, scale: 1.15, duration: 120, yoyo: true, hold: 160, onComplete: function () { sc.tweens.add({ targets: t, alpha: 0, y: y - 30, duration: 300, onComplete: function () { t.destroy(); } }); } });
  }

  /* ---------- 모양 도구 ---------- */
  function slash(sc, x, y, dir, col, size, thick, rot) {
    run(sc, 190, function (g, t) {
      var a0 = (dir === 1 ? -1.25 : PI - 0.35) + (rot || 0), a1 = (dir === 1 ? 0.35 : PI + 1.25) + (rot || 0), r = size * (0.7 + 0.45 * t), cx = x + dir * 10, cy = y - 46;
      g.lineStyle(thick * (1 - t) + 2, col, 1 - t); g.beginPath(); g.arc(cx, cy, r, a0, a1, false); g.strokePath();
      g.lineStyle((thick * (1 - t) + 1) * 0.45, 0xffffff, 1 - t); g.beginPath(); g.arc(cx, cy, r * 0.93, a0 + 0.12, a1 - 0.12, false); g.strokePath();
    });
  }
  function ring(sc, x, y, col, maxR, dur, w) {
    run(sc, dur || 320, function (g, t) { g.lineStyle((w || 7) * (1 - t) + 1, col, 1 - t); g.strokeCircle(x, y, maxR * t); g.fillStyle(col, 0.25 * (1 - t)); g.fillCircle(x, y, maxR * t * 0.8); });
  }
  function burst(sc, x, y, col, n, len, dur) {
    var off = Math.random() * 3;
    run(sc, dur || 260, function (g, t) {
      for (var i = 0; i < n; i++) { var a = off + (PI * 2 * i) / n; line(g, 5 * (1 - t) + 1, i % 2 ? 0xffffff : col, 1 - t, x + Math.cos(a) * len * t * 0.35, y + Math.sin(a) * len * t * 0.35, x + Math.cos(a) * len * (0.25 + 0.75 * t), y + Math.sin(a) * len * (0.25 + 0.75 * t)); }
      g.fillStyle(0xffffff, 0.9 * (1 - t)); g.fillCircle(x, y, 22 * (1 - t) + 2);
    });
  }
  function pillar(sc, x, gy, col, h, w) {
    run(sc, 520, function (g, t) { var gr = Math.min(1, t * 3), fa = 1 - Math.max(0, (t - 0.35) / 0.65), ww = w * (1 - 0.5 * t); g.fillStyle(col, 0.55 * fa); g.fillRect(x - ww / 2, gy - h * gr, ww, h * gr); g.fillStyle(0xffffff, 0.8 * fa); g.fillRect(x - ww / 6, gy - h * gr, ww / 3, h * gr); });
  }
  function chain(sc, x1, y1, x2, y2, col, w) {
    var pts = [], n = 8; for (var i = 0; i <= n; i++) pts.push([x1 + (x2 - x1) * i / n + (i % n ? R(-14, 14) : 0), y1 + (y2 - y1) * i / n + (i % n ? R(-14, 14) : 0)]);
    run(sc, 230, function (g, t) { [[(w || 9) * (1 - t) + 1, col, 0.55], [3, 0xffffff, 1]].forEach(function (s) { g.lineStyle(s[0], s[1], s[2] * (1 - t)); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.strokePath(); }); }, 31);
  }
  function parts(sc, x, y, col, col2, n, spd, o) {
    o = o || {}; var P = [];
    for (var i = 0; i < n; i++) { var a = o.dir ? (o.dir > 0 ? R(-1.2, 0.5) : R(PI - 0.5, PI + 1.2)) : R(0, PI * 2), v = R(0.35, 1) * spd; P.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + (o.up ? -R(1, 3) : 0), s: R(3, 8), c: i % 3 ? col : col2 }); }
    var grav = o.g == null ? 0.2 : o.g, shape = o.shape || "rect";
    run(sc, o.dur || 520, function (g, t) {
      P.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += grav; p.vx *= 0.97; var al = 1 - t, s = p.s * (1 - t * 0.5); g.fillStyle(p.c, al * (shape === "smoke" ? 0.45 : 1));
        if (shape === "circle") g.fillCircle(p.x, p.y, s); else if (shape === "smoke") g.fillCircle(p.x, p.y, s * (1 + t * 3));
        else if (shape === "shard") g.fillTriangle(p.x, p.y - s * 1.6, p.x + s, p.y + s, p.x - s, p.y + s);
        else if (shape === "leaf") g.fillEllipse(p.x, p.y, s * 1.8, s * 0.8); else if (shape === "plus") { g.fillRect(p.x - s, p.y - 1.5, s * 2, 3); g.fillRect(p.x - 1.5, p.y - s, 3, s * 2); }
        else g.fillRect(p.x, p.y, s, s); });
    }, 31);
  }
  function afterimages(sc, view, col, n, gap) {
    for (var i = 0; i < n; i++) later(sc, i * gap, function () {
      var s = view && view.sprite; if (!s) return;
      var c = sc.add.sprite(s.x, s.y, s.texture.key, s.frame.name).setOrigin(0.5, 0.94).setScale(s.scaleX, s.scaleY).setFlipX(s.flipX).setTint(col).setAlpha(0.6).setDepth(19).setBlendMode(ADD);
      sc.tweens.add({ targets: c, alpha: 0, duration: 340, onComplete: function () { c.destroy(); } });
    });
  }
  function chevrons(sc, x, y, dir, col, n, size) {
    run(sc, 340, function (g, t) { for (var i = 0; i < n; i++) { var ox = x + dir * (40 + i * 46 + t * 150), a = (1 - t) * (1 - i / (n + 1)), sz = size * (1 + i * 0.12);
      [[9, col], [3, 0xffffff]].forEach(function (s) { g.lineStyle(s[0] * (1 - t) + 1, s[1], a); g.beginPath(); g.moveTo(ox - dir * sz * 0.5, y - 46 - sz); g.lineTo(ox, y - 46); g.lineTo(ox - dir * sz * 0.5, y - 46 + sz); g.strokePath(); }); } });
  }
  function speedlines(sc, x, y, dir, col) {
    var L = []; for (var i = 0; i < 9; i++) L.push([R(-70, 10), R(40, 150)]);
    run(sc, 280, function (g, t) { L.forEach(function (l) { var x0 = x - dir * (20 + t * 120), len = l[1] * (1 - t * 0.4); line(g, 3, col, 1 - t, x0, y + l[0] - 45, x0 - dir * len, y + l[0] - 45); }); });
  }
  function spikes(sc, x0, gy, dir, col, n, h) {
    for (var i = 0; i < n; i++) (function (i) { later(sc, i * 55, function () {
      var xi = x0 + dir * i * 46, hh = h * (0.7 + 0.3 * Math.sin(i));
      run(sc, 460, function (g, t) { var k = Math.min(1, t / 0.3), a = t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35, H = hh * k; g.fillStyle(col, 0.7 * a); g.fillTriangle(xi - 15, gy, xi + 15, gy, xi, gy - H); g.fillStyle(0xffffff, 0.8 * a); g.fillTriangle(xi - 4, gy, xi + 4, gy, xi, gy - H); });
    }); })(i);
  }
  function vortex(sc, x, y, col, Rr, H) {
    run(sc, 560, function (g, t) { for (var j = 0; j < 6; j++) { var yy = y - j * H / 6, rr = Rr * (0.35 + 0.65 * j / 6) * (1 + t * 0.3); g.lineStyle(5 * (1 - t) + 1, j % 2 ? 0xffffff : col, 1 - t);
      g.beginPath(); for (var a = t * 12 + j; a < t * 12 + j + 4.2; a += 0.2) { var px = x + Math.cos(a) * rr, py = yy + Math.sin(a) * rr * 0.28; if (a === t * 12 + j) g.moveTo(px, py); else g.lineTo(px, py); } g.strokePath(); } });
  }
  function cracks(sc, x, gy, col, len) {
    var S = []; [-1, 1].forEach(function (sd) { var p = [[x, gy + 6]]; for (var i = 1; i <= 8; i++) p.push([x + sd * i * len / 8, gy + 6 + R(-6, 12) + i * 2]); S.push(p); });
    run(sc, 650, function (g, t) { S.forEach(function (p) { g.lineStyle(5 * (1 - t) + 1, col, 1 - t); g.beginPath(); g.moveTo(p[0][0], p[0][1]); var n = Math.ceil(p.length * Math.min(1, t * 3 + 0.1)); for (var i = 1; i < n; i++) g.lineTo(p[i][0], p[i][1]); g.strokePath(); }); });
  }
  function debris(sc, x, gy, col, n) {
    var P = []; for (var i = 0; i < n; i++) P.push({ x: x + R(-30, 30), y: gy, vx: R(-5, 5), vy: R(-13, -6), s: R(6, 14) });
    run(sc, 720, function (g, t) { P.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.7; if (p.y > gy) { p.y = gy; p.vy = 0; p.vx *= 0.5; } g.fillStyle(col, 1 - t * 0.7); g.fillRect(p.x, p.y - p.s, p.s, p.s); g.fillStyle(0xffffff, 0.35 * (1 - t)); g.fillRect(p.x, p.y - p.s, p.s * 0.4, p.s * 0.4); }); }, 30);
  }
  function spearRain(sc, x, gy, col, n, spread) {
    run(sc, 800, function (g, t) { for (var i = 0; i < n; i++) { var lt = t * 800 - i * 55; if (lt <= 0) continue; var fp = Math.min(1, lt / 180), xx = x + spread * (i / (n - 1) - 0.5), yy = -60 + (gy + 60) * fp, a = fp < 1 ? 1 : Math.max(0, 1 - (lt - 180) / 420);
      line(g, 6, col, a, xx, yy - 80, xx, yy); line(g, 2, 0xffffff, a, xx, yy - 80, xx, yy); g.fillStyle(0xffffff, a); g.fillTriangle(xx - 7, yy, xx + 7, yy, xx, yy + 16); } });
  }
  function petals(sc, x, y, c1, c2, n, Rr) {
    run(sc, 760, function (g, t) { for (var i = 0; i < n; i++) { var a = (PI * 2 * i) / n + t * 5, r = Rr * t * (0.4 + 0.6 * ((i % 3) / 3)); g.fillStyle(i % 2 ? c1 : c2, 1 - t); g.fillEllipse(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7 - t * 40, 14, 7); } }, 31);
  }
  function flameWheel(sc, x, y, c1, c2, Rr) {
    run(sc, 620, function (g, t) { for (var k = 0; k < 6; k++) { var a = t * 9 + k * PI / 3; g.lineStyle(11 * (1 - t) + 2, k % 2 ? c1 : c2, 1 - t); g.beginPath(); g.arc(x, y, Rr * (0.5 + 0.5 * t), a, a + 0.9, false); g.strokePath(); } g.fillStyle(c2, 0.6 * (1 - t)); g.fillCircle(x, y, Rr * 0.45); });
  }
  function meteor(sc, x, gy, c1, c2, dir) {
    run(sc, 460, function (g, t) { var k = t * t, xx = x - dir * 260 * (1 - k), yy = -80 + (gy - 40 + 80) * k;
      for (var i = 0; i < 8; i++) { var tt = i / 8; g.fillStyle(i % 2 ? c1 : c2, (1 - tt) * 0.7); g.fillCircle(xx - dir * 260 * tt * 0.25, yy - (gy + 40) * tt * 0.08 - tt * 60, 34 * (1 - tt * 0.6)); }
      g.fillStyle(0xffffff, 1); g.fillCircle(xx, yy, 18); g.fillStyle(c2, 0.9); g.fillCircle(xx, yy, 34); });
  }
  function snowflake(sc, x, y, col, Rr) {
    run(sc, 620, function (g, t) { for (var k = 0; k < 6; k++) { var a = k * PI / 3 + t * 0.6, L = Rr * Math.min(1, t * 2.2), cx = Math.cos(a), cy = Math.sin(a); g.lineStyle(5 * (1 - t) + 1, k % 2 ? 0xffffff : col, 1 - t * 0.8);
      line(g, 5 * (1 - t) + 1, col, 1 - t * 0.8, x, y, x + cx * L, y + cy * L);
      [0.45, 0.75].forEach(function (f) { var bx = x + cx * L * f, by = y + cy * L * f; line(g, 3, 0xffffff, 1 - t, bx, by, bx + Math.cos(a + 0.7) * L * 0.2, by + Math.sin(a + 0.7) * L * 0.2); line(g, 3, 0xffffff, 1 - t, bx, by, bx + Math.cos(a - 0.7) * L * 0.2, by + Math.sin(a - 0.7) * L * 0.2); }); } });
  }
  function portal(sc, x, y, col, Rr) {
    run(sc, 620, function (g, t) { var pl = Math.sin(t * PI); for (var j = 0; j < 4; j++) { g.lineStyle(5, j % 2 ? 0xffffff : col, 0.9 * (1 - t * 0.5) * pl + 0.05); g.strokeEllipse(x, y - 50, Rr * (1 - j * 0.2) * pl * 0.7 + 2, Rr * 2 * (1 - j * 0.2) * pl + 2); } g.fillStyle(0x000000, 0.0); });
  }
  function bats(sc, x, y, col) {
    var B = []; for (var i = 0; i < 9; i++) B.push(R(0, PI * 2));
    run(sc, 760, function (g, t) { B.forEach(function (a, i) { var r = 240 * t, px = x + Math.cos(a) * r, py = y - 60 + Math.sin(a) * r * 0.6 - t * 40, w = 10 + 4 * Math.sin(t * 40 + i); g.fillStyle(i % 2 ? col : 0xffffff, 1 - t); g.fillTriangle(px, py, px - w, py - 7, px - 3, py + 5); g.fillTriangle(px, py, px + w, py - 7, px + 3, py + 5); }); }, 31);
  }
  function beam(sc, x, y, dir, col, len, w) {
    run(sc, 300, function (g, t) { var L = len * Math.min(1, t * 4), hh = w * (1 - t); g.fillStyle(col, 0.7 * (1 - t)); g.fillRect(dir === 1 ? x : x - L, y - 46 - hh / 2, L, hh); g.fillStyle(0xffffff, 0.95 * (1 - t)); g.fillRect(dir === 1 ? x : x - L, y - 46 - hh / 6, L, hh / 3); });
  }
  function fist(sc, x, gy, col) {
    run(sc, 520, function (g, t) { var k = Math.min(1, t / 0.4), yy = -160 + (gy - 90 + 160) * k * k, a = t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5;
      g.fillStyle(col, 0.85 * a); g.fillRect(x - 58, yy, 116, 90); g.fillStyle(0xffffff, 0.5 * a); for (var i = 0; i < 4; i++) g.fillRect(x - 54 + i * 28, yy + 4, 20, 14); g.fillStyle(0x000000, 0.25 * a); g.fillRect(x - 58, yy + 70, 116, 20); }, 30);
  }
  function aura(sc, x, gy, col, h) {
    var L = []; for (var i = 0; i < 9; i++) L.push([(i - 4) * 13, R(0.6, 1)]);
    run(sc, 520, function (g, t) { L.forEach(function (l) { var hh = h * l[1] * Math.sin(t * PI); line(g, 5, col, 0.8 * (1 - t), x + l[0], gy, x + l[0] + Math.sin(t * 9 + l[0]) * 6, gy - hh); }); });
  }

  /* ---------- 캐릭터 고유 연출 (시작) ---------- */
  var START = {
    RAM: function (c) {
      if (c.t === "attack") { slash(c.sc, c.x, c.y, c.dir, c.col, 78, 12); chevrons(c.sc, c.x, c.y, c.dir, c.col, 1, 30); }
      else if (c.t === "headbutt") { chevrons(c.sc, c.x, c.y, c.dir, c.col, 3, 34); afterimages(c.sc, c.view, c.col, 3, 50); cracks(c.sc, c.x + c.dir * 40, c.y, c.col, 120); }
      else { chevrons(c.sc, c.x, c.y, c.dir, c.col, 6, 46); afterimages(c.sc, c.view, c.col, 6, 45); cracks(c.sc, c.x, c.y, 0xffffff, 280); beam(c.sc, c.x, c.y, c.dir, c.col, 700, 70); }
    },
    DASH: function (c) {
      if (c.t === "attack") { slash(c.sc, c.x, c.y, c.dir, c.col, 70, 7); later(c.sc, 80, function () { slash(c.sc, c.x, c.y, c.dir, 0xffffff, 80, 6, 0.5); }); }
      else if (c.t === "headbutt") { speedlines(c.sc, c.x, c.y, c.dir, c.col); afterimages(c.sc, c.view, c.col, 5, 35); }
      else { vortex(c.sc, c.x, c.y, c.col, 90, 220); afterimages(c.sc, c.view, c.col, 8, 40); for (var i = 0; i < 5; i++) (function (i) { later(c.sc, i * 70, function () { slash(c.sc, c.x + c.dir * i * 14, c.y, c.dir, i % 2 ? c.col : 0xffffff, 90, 6, R(-0.6, 0.6)); }); })(i); }
    },
    BRUTUS: function (c) {
      if (c.t === "attack") { slash(c.sc, c.x, c.y, c.dir, c.col, 86, 22); }
      else if (c.t === "headbutt") { aura(c.sc, c.x, c.y, c.col, 140); debris(c.sc, c.x + c.dir * 70, c.y, 0x7f1d1d, 6); cracks(c.sc, c.x + c.dir * 60, c.y, c.col, 160); shake(c.sc, 140, 0.006); }
      else { aura(c.sc, c.x, c.y, c.col, 260); ring(c.sc, c.x, c.y - 10, c.col, 300, 520, 12); cracks(c.sc, c.x, c.y, c.col, 360); debris(c.sc, c.x + c.dir * 80, c.y, 0x991b1b, 16); shake(c.sc, 320, 0.014); }
    },
    VOLT: function (c) {
      var ox = c.ox;
      if (c.t === "attack") { chain(c.sc, c.x, c.y - 46, c.x + c.dir * 90, c.y - 40, c.col, 7); }
      else if (c.t === "headbutt") { afterimages(c.sc, c.view, c.col, 4, 40); for (var i = 0; i < 3; i++) chain(c.sc, c.x - c.dir * i * 30, c.y - 20 - i * 20, c.x + c.dir * (60 + i * 30), c.y - 40, c.col2, 6); }
      else { ring(c.sc, c.x, c.y - 40, c.col, 220, 460, 8); for (var k = 0; k < 6; k++) chain(c.sc, c.x, c.y - 45, c.x + Math.cos(k * 1.05) * 200, c.y - 45 + Math.sin(k * 1.05) * 120, c.col, 8);
        for (var j = 0; j < 4; j++) (function (j) { later(c.sc, 80 + j * 90, function () { chain(c.sc, ox + R(-70, 70), -20, ox + R(-40, 40), c.y, c.col, 12); flash(c.sc, c.col, 0.15, 90); }); })(j); }
    },
    TITAN: function (c) {
      if (c.t === "attack") { slash(c.sc, c.x, c.y, c.dir, 0xcbd5e1, 80, 24); }
      else if (c.t === "headbutt") { debris(c.sc, c.x + c.dir * 60, c.y, 0x64748b, 8); cracks(c.sc, c.x + c.dir * 50, c.y, c.col2, 150); shake(c.sc, 160, 0.008); }
      else { fist(c.sc, c.ox, c.y, 0x94a3b8); later(c.sc, 210, function () { cracks(c.sc, c.ox, c.y, c.col2, 340); debris(c.sc, c.ox, c.y, 0x64748b, 18); ring(c.sc, c.ox, c.y, 0xffffff, 280, 420, 12); shake(c.sc, 360, 0.018); }); }
    },
    PHANTOM: function (c) {
      var tx = c.mv && c.mv.teleportOffsetX ? c.x + c.dir * c.mv.teleportOffsetX : c.x;
      if (c.t === "attack") { slash(c.sc, c.x, c.y, c.dir, c.col, 80, 8, -0.3); slash(c.sc, c.x, c.y, c.dir, 0xffffff, 80, 8, 0.4); }
      else if (c.t === "headbutt") { portal(c.sc, c.x, c.y, c.col, 90); if (tx !== c.x) later(c.sc, 120, function () { portal(c.sc, tx, c.y, c.col, 90); }); afterimages(c.sc, c.view, c.col2, 4, 50); parts(c.sc, c.x, c.y - 40, c.col, c.col2, 12, 5, { shape: "smoke", g: -0.03 }); }
      else { portal(c.sc, c.x, c.y, c.col, 130); later(c.sc, 140, function () { portal(c.sc, tx, c.y, c.col, 150); bats(c.sc, tx, c.y, c.col); vortex(c.sc, tx, c.y, c.col, 100, 200); }); dim(c.sc, 520, 0.55); }
    },
    BLAZE: function (c) {
      if (c.t === "attack") { slash(c.sc, c.x, c.y, c.dir, c.col, 78, 14); parts(c.sc, c.x + c.dir * 50, c.y - 40, c.col, c.col2, 6, 3, { shape: "circle", g: -0.06, up: 1 }); }
      else if (c.t === "headbutt") { afterimages(c.sc, c.view, c.col, 4, 45); parts(c.sc, c.x, c.y - 10, c.col, c.col2, 14, 4, { shape: "circle", g: -0.08, up: 1, dur: 700 }); chevrons(c.sc, c.x, c.y, c.dir, c.col, 2, 30); }
      else { flameWheel(c.sc, c.x, c.y - 40, c.col, c.col2, 170); meteor(c.sc, c.ox, c.y, c.col, c.col2, c.dir); later(c.sc, 380, function () { ring(c.sc, c.ox, c.y - 20, c.col, 300, 480, 12); pillar(c.sc, c.ox, c.y, c.col, 380, 120); parts(c.sc, c.ox, c.y - 20, c.col, c.col2, 30, 9, { shape: "circle", g: -0.05, up: 1, dur: 800 }); shake(c.sc, 300, 0.012); }); }
    },
    FROST: function (c) {
      if (c.t === "attack") { slash(c.sc, c.x, c.y, c.dir, c.col, 76, 10); parts(c.sc, c.x + c.dir * 50, c.y - 40, c.col, c.col2, 6, 3, { shape: "shard" }); }
      else if (c.t === "headbutt") { spikes(c.sc, c.x + c.dir * 50, c.y, c.dir, c.col, 5, 110); afterimages(c.sc, c.view, c.col, 3, 50); }
      else { snowflake(c.sc, c.x, c.y - 40, c.col, 230); spikes(c.sc, c.x + 40, c.y, 1, c.col, 6, 170); spikes(c.sc, c.x - 40, c.y, -1, c.col, 6, 170); parts(c.sc, c.x, c.y - 200, 0xffffff, c.col2, 40, 2, { shape: "circle", g: 0.05, dur: 900 }); flash(c.sc, c.col2, 0.25, 240); }
    },
    SAGE: function (c) {
      if (c.t === "attack") { slash(c.sc, c.x, c.y, c.dir, c.col, 70, 8); parts(c.sc, c.x + c.dir * 50, c.y - 40, c.col, c.col2, 6, 3, { shape: "leaf", g: 0.04 }); }
      else if (c.t === "headbutt") { petals(c.sc, c.x + c.dir * 60, c.y - 30, c.col, c.col2, 14, 100); parts(c.sc, c.x, c.y - 20, c.col, c.col2, 10, 4, { shape: "leaf", g: 0.03 }); }
      else { petals(c.sc, c.x, c.y - 40, c.col, c.col2, 30, 240); ring(c.sc, c.x, c.y - 40, c.col, 220, 600, 6); parts(c.sc, c.x, c.y - 30, 0x86efac, 0xffffff, 12, 3, { shape: "plus", g: -0.05, up: 1, dur: 900 }); }
    },
    LANCER: function (c) {
      if (c.t === "attack") { beam(c.sc, c.x, c.y, c.dir, c.col, 210, 18); }
      else if (c.t === "headbutt") { beam(c.sc, c.x, c.y, c.dir, c.col, 300, 40); afterimages(c.sc, c.view, c.col, 3, 50); speedlines(c.sc, c.x, c.y, c.dir, c.col2); }
      else { spearRain(c.sc, c.ox, c.y, c.col, 8, 360); beam(c.sc, c.x, c.y, c.dir, c.col, 560, 60); ring(c.sc, c.ox, c.y - 20, c.col, 200, 520, 8); }
    }
  };
  /* ---------- 캐릭터 고유 연출 (적중) ---------- */
  var HIT = {
    RAM: function (c) { chevrons(c.sc, c.x - c.dir * 40, c.y + 40, c.dir, c.col, 2, 26); },
    DASH: function (c) { for (var i = 0; i < 3; i++) (function (i) { later(c.sc, i * 45, function () { slash(c.sc, c.x - c.dir * 60, c.y + 45, c.dir, i % 2 ? c.col : 0xffffff, 60, 5, R(-0.8, 0.8)); }); })(i); },
    BRUTUS: function (c) { cracks(c.sc, c.x, c.gy, c.col, 120); parts(c.sc, c.x, c.y, 0x991b1b, c.col, c.big ? 18 : 8, 8, { dir: c.dir }); },
    VOLT: function (c) { for (var i = 0; i < (c.big ? 5 : 3); i++) chain(c.sc, c.x, c.y, c.x + R(-110, 110), c.y + R(-90, 60), c.col, 7); },
    TITAN: function (c) { ring(c.sc, c.x, c.gy, 0xcbd5e1, 160, 380, 10); debris(c.sc, c.x, c.gy, 0x64748b, c.big ? 12 : 5); },
    PHANTOM: function (c) { slash(c.sc, c.x - c.dir * 50, c.y + 40, c.dir, c.col, 90, 9, -0.5); slash(c.sc, c.x - c.dir * 50, c.y + 40, c.dir, 0xffffff, 90, 9, 0.5); parts(c.sc, c.x, c.y, c.col, c.col2, 10, 4, { shape: "smoke", g: -0.03 }); },
    BLAZE: function (c) { parts(c.sc, c.x, c.y + 20, c.col, c.col2, c.big ? 26 : 12, 6, { shape: "circle", g: -0.1, up: 1, dur: 700 }); },
    FROST: function (c) { snowflake(c.sc, c.x, c.y, c.col, c.big ? 150 : 90); parts(c.sc, c.x, c.y, c.col, c.col2, 12, 6, { shape: "shard" }); },
    SAGE: function (c) { petals(c.sc, c.x, c.y, c.col, c.col2, 10, 90); parts(c.sc, c.f.x, c.f.y - 90, 0x86efac, 0xffffff, 3, 2, { shape: "plus", g: -0.06, up: 1, dur: 700 }); },
    LANCER: function (c) { beam(c.sc, c.x - c.dir * 140, c.y + 46, c.dir, c.col, 300, 16); parts(c.sc, c.x, c.y, c.col, 0xffffff, 10, 7, { dir: c.dir }); }
  };

  function moveOf(f) {
    try { var d = window.__GOAT_CH[f.characterId], k = f.state === "SPECIAL" ? (f.alt === "special2" ? "special2" : "special") : f.state === "HEADBUTT" ? (f.alt === "headbutt2" ? "headbutt2" : "headbutt") : "attack"; return d.moves[k]; } catch (e) { return null; }
  }
  var SF = window.__GOAT_SFX || null;
  function snd(id, k) { try { window.__GOAT_SFX && window.__GOAT_SFX.play(id, k); } catch (e) {} }

  function fx(sc, evs) {
    if (!sc.matchState) return;
    var H = hi(), F = sc.matchState.fighters;
    evs.forEach(function (ev) {
      var slot = ev.attackerSlot || 1, f = F[slot - 1], o = F[slot === 1 ? 1 : 0]; if (!f) return;
      var fl = FL[f.characterId] || [0xffffff, 0xfacc15], dir = f.facing === -1 ? -1 : 1, alt = f.alt === "special2" || f.alt === "headbutt2", mv = moveOf(f);
      var col = (alt && mv && mv.effectColor) || fl[0];
      var view = slot === 1 ? sc.f1View : sc.f2View, id = f.characterId;
      var c = { sc: sc, f: f, view: view, dir: dir, col: col, col2: fl[1], mv: mv, x: f.x, y: f.y, gy: f.y, ox: o ? o.x : f.x + dir * 110 };
      if (ev.type === "MOVE_START") {
        c.t = ev.moveType; snd(id, ev.moveType);
        if (START[id]) START[id](c);
        if (ev.moveType === "special") {
          dim(sc, 380); flash(sc, 0xffffff, 0.45, 170); ring(sc, f.x, f.y - 40, col, 240, 520, 10);
          shake(sc, 200, 0.006); banner(sc, (mv && mv.name) || "SPECIAL", col, slot === 2);
        } else if (alt && ev.moveType === "headbutt") flash(sc, col, 0.15, 150);
      } else if (ev.type === "HIT") {
        var big = ev.heavy || ev.moveType === "special", sp = ev.moveType === "special";
        c.x = ev.x; c.y = ev.y; c.big = big; snd(id, "hit");
        burst(sc, ev.x, ev.y, col, big ? 12 : 7, big ? 150 : 90, big ? 300 : 230); ring(sc, ev.x, ev.y, col, big ? 170 : 100, big ? 340 : 250, big ? 9 : 5);
        if (H && HIT[id]) HIT[id](c);
        if (big) flash(sc, col, sp ? 0.34 : 0.18, sp ? 220 : 130);
        if (sp) shake(sc, 280, 0.013);
        if (ev.combo && ev.combo >= 2) pop(sc, ev.x, ev.y - 130, ev.combo + " COMBO!", ev.combo >= 5 ? "#f43f5e" : "#fbbf24", ev.combo >= 5 ? 22 : 17);
      } else if (ev.type === "BLOCK") {
        ring(sc, ev.x, ev.y, 0x93c5fd, 90, 240, 6); burst(sc, ev.x, ev.y, 0x38bdf8, 6, 80, 200); snd(id, "block");
      } else if (ev.type === "CRIT") {
        pop(sc, ev.x, ev.y - 40, "CRITICAL!", "#e879f9", 22); slash(sc, ev.x - 40, ev.y + 60, 1, 0xe879f9, 120, 12, -0.4); slash(sc, ev.x + 40, ev.y + 60, -1, 0xffffff, 120, 12, 0.4); flash(sc, 0xe879f9, 0.3, 160); snd("PHANTOM", "crit");
      } else if (ev.type === "STATUS") {
        var sc2 = { burn: [0xf97316, 0xfde047, "circle", -0.1], poison: [0x84cc16, 0xbef264, "circle", -0.04], freeze: [0x7dd3fc, 0xffffff, "shard", 0.1], shock: [0xfde047, 0x38bdf8, "rect", 0.05] }[ev.status];
        if (sc2) { parts(sc, ev.x, ev.y, sc2[0], sc2[1], 12, 4, { shape: sc2[2], g: sc2[3], up: 1, dur: 700 }); pop(sc, ev.x, ev.y - 70, { burn: "화상!", poison: "중독!", freeze: "빙결!", shock: "감전!" }[ev.status], hex(sc2[0]), 15); snd(id, ev.status); }
      } else if (ev.type === "BUFF") {
        var bc = { armor: 0x94a3b8, haste: 0x34d399, overdrive: 0xef4444, heal: 0x4ade80 }[ev.buff] || 0xffffff;
        ring(sc, f.x, f.y - 45, bc, 130, 500, 8); parts(sc, f.x, f.y - 30, bc, 0xffffff, 14, 3, { shape: ev.buff === "heal" ? "plus" : "circle", g: -0.06, up: 1, dur: 800 });
        pop(sc, f.x, f.y - 170, { armor: "철갑!", haste: "질풍!", overdrive: "광폭화!", heal: "회복!" }[ev.buff], hex(bc), 16); snd(id, ev.buff);
      } else if (ev.type === "KO") {
        flash(sc, 0xffffff, 0.7, 380); dim(sc, 500); ring(sc, ev.x, ev.y - 30, 0xef4444, 420, 700, 14); ring(sc, ev.x, ev.y - 30, 0xfbbf24, 280, 520, 9);
        burst(sc, ev.x, ev.y - 30, 0xfacc15, 20, 300, 520); if (H) parts(sc, ev.x, ev.y - 30, 0xfacc15, 0xef4444, 40, 12);
        pop(sc, 640, 300, "K.O.!", "#ef4444", 40); snd(id, "ko");
      }
    });
  }

  /* ---------- 상태이상 / 버프 지속 표시 ---------- */
  var TINT = { burn: 0xffa070, freeze: 0x9be7ff, poison: 0xa3e635, shock: 0xfff176 };
  function statusTick(sc, time) {
    if (!sc.matchState) return;
    [0, 1].forEach(function (i) {
      var f = sc.matchState.fighters[i], v = i === 0 ? sc.f1View : sc.f2View; if (!f || !v || !v.sprite) return;
      var x = f.fx, tint = null, kind = null;
      if (x) { if (x.freeze > 0) kind = "freeze"; else if (x.burn > 0) kind = "burn"; else if (x.shock > 0) kind = "shock"; else if (x.poison > 0) kind = "poison"; }
      if (kind) {
        tint = TINT[kind]; if (kind === "shock" && Math.floor(time / 70) % 2) tint = 0xffffff; if (kind === "burn" && Math.floor(time / 90) % 2) tint = 0xff7043;
        v.sprite.setTint(tint); v.__tint = 1;
        if (Math.floor(time / 110) !== v.__lastT) { v.__lastT = Math.floor(time / 110);
          var s = { burn: [0xf97316, 0xfde047, "circle", -0.12], poison: [0x84cc16, 0xbef264, "circle", -0.05], freeze: [0xe0f2fe, 0x7dd3fc, "shard", 0.08], shock: [0xfde047, 0x38bdf8, "rect", 0.05] }[kind];
          parts(sc, f.x + R(-20, 20), f.y - R(20, 90), s[0], s[1], 2, 1.5, { shape: s[2], g: s[3], dur: 420 }); }
      } else if (v.__tint) { v.sprite.clearTint(); v.__tint = 0; }
      if (x && x.buff > 0 && Math.floor(time / 140) !== v.__lastB) { v.__lastB = Math.floor(time / 140);
        var bc = { armor: 0x94a3b8, haste: 0x34d399, overdrive: 0xef4444 }[x.bk] || 0xffffff;
        run(sc, 300, function (g, t) { g.lineStyle(4 * (1 - t) + 1, bc, 0.8 * (1 - t)); g.strokeEllipse(f.x, f.y - 50, 90 + t * 30, 130 + t * 30); }, 28); }
    });
  }

  function hook() {
    var VS = Object.getPrototypeOf(G.scene.getScene("VersusScene")), c0 = VS.create, u0 = VS.update;
    VS.create = function () {
      var r = c0.apply(this, arguments), sc = this, sr = sc.stageRenderer;
      try { if (sr && !sr.__fx) { sr.__fx = 1; var o = sr.playCombatEvents.bind(sr); sr.playCombatEvents = function (evs) { o(evs); try { fx(sc, evs); } catch (e) { console.warn("[fx]", e); } }; } } catch (e) { console.warn("[fx] hook", e); }
      return r;
    };
    VS.update = function (t, d) { var r = u0.apply(this, arguments); try { statusTick(this, t); } catch (e) {} return r; };
  }
  var tries = 0, iv = setInterval(function () {
    tries++; G = window.__GOAT_RAMPAGE_GAME__;
    if (G && G.scene && G.scene.getScene("VersusScene")) { clearInterval(iv); try { hook(); } catch (e) { console.error("[fx]", e); } } else if (tries > 400) clearInterval(iv);
  }, 100);
  window.__GOAT_FX = { fx: fx };
})();
