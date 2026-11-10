/* GOAT RAMPAGE v4 — 신규 캐릭터 외형, 멀티플레이 '나' 표시, 신규 캐릭터 해금 */
(function () {
  "use strict";
  var D = window.__GOAT_V4, G = null;
  if (!D) return;

  /* ---------- 1. 신규 캐릭터 외형 (기존 스프라이트 위에 장식 덧그림) ---------- */
  function geo(body, state, frame) {
    var heavy = body === "heavy", slim = body === "slim";
    var bw = heavy ? 16 : slim ? 12 : 14, bh = heavy ? 10 : slim ? 8 : 9;
    var bob = 0, lean = 0, hx = 0, hy = 0;
    if (state === "IDLE") bob = frame % 2 === 1 ? -1 : 0;
    else if (state === "WALK" || state === "RUN") { bob = frame % 2 === 0 ? -1 : 0; lean = state === "RUN" ? 2 : 1; }
    else if (state === "CROUCH") { bob = 3; hy = 2; }
    else if (state === "JUMP") { bob = -3; hy = -2; }
    else if (state === "FALL") { bob = -1; hy = 1; }
    else if (state === "ATTACK") { lean = frame >= 1 && frame <= 2 ? 4 : 1; hx = frame >= 1 && frame <= 2 ? 3 : 0; }
    else if (state === "HEADBUTT") { lean = frame >= 1 ? 5 : -2; hx = frame >= 1 ? 6 : -1; hy = frame >= 1 ? 3 : 0; }
    else if (state === "SPECIAL") { bob = frame % 2 === 0 ? -2 : -4; lean = 4; hx = 5; }
    else if (state === "GUARD") { lean = -1; hx = -1; hy = 2; }
    else if (state === "DODGE") { lean = 4; bob = 1; }
    else if (state === "HIT" || state === "KNOCKBACK") { lean = -4; bob = -2; hx = -3; hy = -2; }
    else if (state === "VICTORY") { bob = frame % 2 === 0 ? -3 : 0; hy = -2; }
    else if (state === "DEFEAT") { bob = 5; hy = 5; hx = 2; }
    var tx = -bw / 2 + lean, ty = -6 - bh + bob;
    return { bw: bw, bh: bh, tx: tx, ty: ty, hx: tx + bw - 3 + hx, hy: ty - 5 + hy, lean: lean, bob: bob };
  }
  var DECO = {
    BLAZE: function (p, g, f) {
      var fl = f % 2;
      p(g.hx - 4, g.hy - 1 - fl, 3, 4, "#f97316"); p(g.hx - 3, g.hy - 3 - fl, 2, 3, "#fde047");
      p(g.tx + 1, g.ty - 2 - fl, 3, 2, "#f97316"); p(g.tx + 5, g.ty - 3 + fl, 2, 3, "#fde047"); p(g.tx + 9, g.ty - 2 - fl, 2, 2, "#f97316");
      p(-g.bw / 2 - 5 + g.lean, g.ty - 3 - fl, 2, 3, "#fde047");
    },
    FROST: function (p, g, f) {
      p(g.hx - 1, g.hy - 6, 2, 4, "#e0f2fe"); p(g.hx + 2, g.hy - 8, 2, 6, "#7dd3fc"); p(g.hx + 5, g.hy - 5, 2, 3, "#e0f2fe");
      p(g.tx + g.bw - 5, g.ty - 1, 5, 2, "#ffffff"); p(g.tx + 1, g.ty + 5, g.bw - 2, 1, "#38bdf8");
    },
    SAGE: function (p, g, f) {
      p(g.hx - 1, g.hy - 1, 8, 1, "#4ade80"); p(g.hx + 1, g.hy - 3, 2, 2, "#22c55e"); p(g.hx + 4, g.hy - 3, 2, 2, "#22c55e");
      p(g.tx + 2, g.ty - 3 + (f % 2), 3, 3, "#bef264"); p(g.tx + 3, g.ty - 2 + (f % 2), 1, 1, "#ffffff");
    },
    LANCER: function (p, g, f) {
      p(g.hx + 3, g.hy - 4, 10, 2, "#facc15"); p(g.hx + 12, g.hy - 4, 3, 2, "#ffffff"); p(g.hx - 1, g.hy - 3, 3, 3, "#facc15");
      p(g.tx + 1, g.ty + 1, g.bw - 2, 3, "#94a3b8"); p(g.tx + 2, g.ty + 4, g.bw - 4, 1, "#eab308");
    }
  };
  function hookArt() {
    var P = window.__PAG; if (!P || P.__v4) return; P.__v4 = 1;
    var orig = P.drawGoatFrame;
    P.drawGoatFrame = function (ctx, ch, state, frame, ax, gy, scale) {
      var r = orig.apply(this, arguments);
      var fn = ch && DECO[ch.id];
      if (fn) {
        var S = 3 * (scale || 1), g = geo(ch.body, state, frame);
        fn(function (x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(ax + x * S), Math.round(gy + y * S), Math.ceil(w * S), Math.ceil(h * S)); }, g, frame);
      }
      return r;
    };
  }

  /* ---------- 2. 같은 캐릭터 대전: 상대 팔레트 변경 ---------- */
  function makeAlt(scene, id) {
    var key = "goat_" + id, ak = key + "_alt";
    if (scene.textures.exists(ak)) return ak;
    if (!scene.textures.exists(key)) return key;
    var src = scene.textures.get(key).getSourceImage();
    var c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
    var x = c.getContext("2d"); x.drawImage(src, 0, 0);
    var im = x.getImageData(0, 0, c.width, c.height), d = im.data;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      var r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0;
      if (mx !== mn) {
        var dd = mx - mn; s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
        h = mx === r ? ((g - b) / dd + (g < b ? 6 : 0)) : mx === g ? ((b - r) / dd + 2) : ((r - g) / dd + 4); h /= 6;
      }
      if (l < 0.18) continue;                  // 눈동자/외곽선 같은 어두운 점은 유지
      h = (h + 0.5) % 1; s = Math.max(s, 0.5);
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      function f(t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
      d[i] = Math.round(f(h + 1 / 3) * 255); d[i + 1] = Math.round(f(h) * 255); d[i + 2] = Math.round(f(h - 1 / 3) * 255);
    }
    x.putImageData(im, 0, 0);
    scene.textures.addSpriteSheet(ak, c, { frameWidth: 96, frameHeight: 96 });
    return ak;
  }

  /* ---------- 3. 대전 화면: 나 / 상대 구분 ---------- */
  function setupIdentity(sc) {
    var online = sc.isOnline, mode = sc.sceneData.mode, me = online ? (sc.myOnlineSlot || 1) : 1, two = mode === "LOCAL_2P";
    var W = 1280;
    sc.__v4 = { me: me, two: two, objs: [] };
    var mirror = sc.sceneData.p1Character === sc.sceneData.p2Character;
    if (mirror) {
      var other = two ? 2 : (me === 1 ? 2 : 1), view = other === 1 ? sc.f1View : sc.f2View;
      try { makeAlt(sc, sc.sceneData[other === 1 ? "p1Character" : "p2Character"]); view.texSuffix = "_alt"; } catch (e) { console.warn("[v4] alt", e); }
    }
    var mk = function (txt, col, size) {
      var t = sc.add.text(0, 0, txt, { fontFamily: '"Press Start 2P", sans-serif', fontSize: size + "px", color: col, stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5).setDepth(40);
      return t;
    };
    var ring = function (col) { return sc.add.ellipse(0, 0, 96, 20).setStrokeStyle(4, col, 0.95).setDepth(19); };
    var slots = [1, 2].map(function (s) {
      var isMe = !two && s === me, col = s === 1 ? 0x38bdf8 : 0xf87171;
      var tag = two ? (s === 1 ? "▼ 1P" : "▼ 2P") : isMe ? "▼ YOU" : (online ? "▼ 상대" : "▼ CPU");
      var t = mk(tag, isMe ? "#facc15" : (s === 1 ? "#7dd3fc" : "#fca5a5"), isMe ? 16 : 11);
      var r = ring(isMe ? 0xfacc15 : col);
      return { t: t, r: r, isMe: isMe };
    });
    sc.__v4.slots = slots;
    if (!two) {
      var me1 = me === 1, bx = me1 ? 380 : W - 380;
      var badge = sc.add.text(bx, 80, "▶ 나 (YOU) ◀", { fontFamily: '"Press Start 2P", sans-serif', fontSize: "11px", color: "#111827", backgroundColor: "#facc15", padding: { x: 8, y: 4 } }).setOrigin(0.5, 0).setDepth(33);
      sc.__v4.objs.push(badge);
      var side = me1 ? "왼쪽 파랑 (1P)" : "오른쪽 빨강 (2P)";
      var ban = sc.add.text(W / 2, 210, "당신은 " + side + " 입니다" + (mirror ? "\n상대는 색이 다른 같은 캐릭터" : ""), { fontFamily: '"Press Start 2P", sans-serif', fontSize: "16px", color: "#facc15", stroke: "#000000", strokeThickness: 6, align: "center", lineSpacing: 10 }).setOrigin(0.5).setDepth(45);
      sc.tweens.add({ targets: ban, alpha: 0, delay: 3200, duration: 700, onComplete: function () { ban.destroy(); } });
    }
    var tip = sc.add.text(W / 2, 690, "스킬 추가!  ↓(S)+K : 박치기 스킬2   ↓(S)+L : 필살기2", { fontFamily: "sans-serif", fontSize: "15px", color: "#fde68a", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5).setDepth(45);
    sc.tweens.add({ targets: tip, alpha: 0, delay: 7000, duration: 800, onComplete: function () { tip.destroy(); } });
  }
  function updIdentity(sc, time) {
    var v = sc.__v4; if (!v || !sc.matchState) return;
    for (var i = 0; i < 2; i++) {
      var f = sc.matchState.fighters[i], s = v.slots[i]; if (!f || !s) continue;
      s.t.setPosition(f.x, f.y - 182 + Math.sin(time / 160) * 4);
      s.r.setPosition(f.x, f.y + 2);
      var gone = f.state === "DEFEAT";
      s.t.setVisible(!gone); s.r.setVisible(!gone);
    }
  }

  /* ---------- 4. 신규 캐릭터 해금 (보스 격파 보상) ---------- */
  function syncUnlocks() {
    try {
      var st = window.__GOAT_STORE__, sv = st && st.getData(); if (!sv) return;
      var got = [];
      Object.keys(D.unlock).forEach(function (q) {
        var id = D.unlock[q];
        if (sv.completedQuests && sv.completedQuests.indexOf(q) >= 0 && sv.unlockedCharacters.indexOf(id) < 0) { st.unlockCharacter(id); got.push(id); }
      });
      return got;
    } catch (e) { return []; }
  }

  function hook() {
    hookArt();
    var VS = Object.getPrototypeOf(G.scene.getScene("VersusScene"));
    var RS = Object.getPrototypeOf(G.scene.getScene("ResultScene"));
    var SS = Object.getPrototypeOf(G.scene.getScene("StoryScene"));
    var c0 = VS.create, u0 = VS.update;
    VS.create = function () { var r = c0.apply(this, arguments); try { setupIdentity(this); } catch (e) { console.warn("[v4] identity", e); } return r; };
    VS.update = function (t, dl) { var r = u0.apply(this, arguments); try { updIdentity(this, t); } catch (e) {} return r; };
    var rc = RS.create;
    RS.create = function () {
      var r = rc.apply(this, arguments), sc = this;
      setTimeout(function () {
        var got = syncUnlocks();
        if (got && got.length && sc.scene.isActive()) {
          var t = sc.add.text(640, 676, "🐐 신규 캐릭터 해금: " + got.join(", "), { fontSize: "20px", color: "#facc15", stroke: "#000", strokeThickness: 5, fontStyle: "bold" }).setOrigin(0.5).setDepth(99);
          sc.tweens.add({ targets: t, alpha: 0, delay: 5000, duration: 800 });
        }
      }, 1200);
      return r;
    };
    var sc0 = SS.create;
    SS.create = function () { try { syncUnlocks(); } catch (e) {} return sc0.apply(this, arguments); };
    syncUnlocks();
  }
  var tries = 0, iv = setInterval(function () {
    tries++; G = window.__GOAT_RAMPAGE_GAME__;
    if (G && G.scene && G.scene.getScene("VersusScene") && G.scene.getScene("ResultScene") && G.scene.getScene("StoryScene") && window.__PAG) {
      clearInterval(iv); try { hook(); } catch (e) { console.error("[v4] hook 실패", e); }
    } else if (tries > 400) clearInterval(iv);
  }, 100);
  hookArt();
})();
