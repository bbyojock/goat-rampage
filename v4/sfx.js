/* GOAT RAMPAGE v6 — 캐릭터별 고유 효과음 (WebAudio 합성, 파일 없음) */
(function () {
  "use strict";
  var ac = null, nb = null;
  function ctx() {
    if (ac) return ac;
    try { var A = window.AudioContext || window.webkitAudioContext; ac = new A(); } catch (e) { return null; }
    var len = ac.sampleRate, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; nb = b; return ac;
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (e) { window.addEventListener(e, function () { var c = ctx(); if (c && c.state === "suspended") c.resume(); }, { passive: true }); });
  function vol() { try { var s = window.__GOAT_STORE__.getData().settings; return Math.max(0, Math.min(1, s.sfxVolume == null ? 0.75 : s.sfxVolume)); } catch (e) { return 0.75; } }

  var V = 1;
  function T(f0, f1, d, type, v, dl) {
    var c = ac, t = c.currentTime + (dl || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * V), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.03);
  }
  function N(d, ft, f0, f1, v, dl, q) {
    var c = ac, t = c.currentTime + (dl || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = nb; s.loop = true; f.type = ft || "bandpass"; f.Q.value = q || 1; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * V), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.03);
  }
  function bleat(p, d, v, dl) { try { var B = window.__GOAT_BLEAT__; if (B && B.make) B.make(ac, ac.destination, ac.currentTime + (dl || 0), p, d, v * V); } catch (e) {} }
  function crackle(n, f, v, span) { for (var i = 0; i < n; i++) N(0.03, "highpass", f, f * 1.5, v, Math.random() * span, 2); }
  function arp(notes, type, d, v, gap, dl) { notes.forEach(function (f, i) { T(f, f, d, type, v, (dl || 0) + i * gap); }); }

  var K = {
    RAM: {
      attack: function () { T(320, 120, 0.1, "triangle", 0.25); N(0.06, "bandpass", 2000, 800, 0.15); },
      headbutt: function () { T(200, 60, 0.28, "sawtooth", 0.22); N(0.15, "lowpass", 1200, 200, 0.25); },
      special: function () { bleat(0.95, 0.5, 0.2); T(90, 35, 0.6, "sine", 0.5); T(500, 1100, 0.35, "square", 0.08, 0.05); N(0.4, "lowpass", 2000, 150, 0.3, 0.05); },
      hit: function () { T(150, 50, 0.14, "sine", 0.5); N(0.06, "lowpass", 1800, 300, 0.3); }
    },
    DASH: {
      attack: function () { N(0.12, "bandpass", 800, 3500, 0.25, 0, 2); N(0.1, "bandpass", 1200, 4200, 0.18, 0.07, 2); },
      headbutt: function () { N(0.22, "bandpass", 500, 4200, 0.3, 0, 3); T(400, 1000, 0.15, "sine", 0.1); },
      special: function () { for (var i = 0; i < 5; i++) N(0.1, "bandpass", 700, 4000, 0.22, i * 0.07, 3); bleat(1.4, 0.4, 0.16); T(300, 1500, 0.4, "sine", 0.08); },
      hit: function () { N(0.05, "highpass", 3000, 5000, 0.3); T(900, 500, 0.06, "square", 0.1); }
    },
    BRUTUS: {
      attack: function () { T(110, 60, 0.12, "sawtooth", 0.3); N(0.08, "lowpass", 900, 200, 0.3); },
      headbutt: function () { T(95, 45, 0.38, "sawtooth", 0.3); T(190, 80, 0.3, "square", 0.08); N(0.25, "lowpass", 700, 120, 0.3); },
      special: function () { bleat(0.6, 0.7, 0.25); T(60, 28, 0.8, "sawtooth", 0.4); N(0.5, "lowpass", 500, 70, 0.45); T(130, 50, 0.6, "square", 0.08, 0.1); },
      hit: function () { T(75, 32, 0.22, "sine", 0.6); N(0.09, "lowpass", 900, 150, 0.4); }
    },
    VOLT: {
      attack: function () { T(2200, 300, 0.08, "sawtooth", 0.14); N(0.07, "highpass", 3000, 6000, 0.25); },
      headbutt: function () { T(150, 2200, 0.2, "sawtooth", 0.14); crackle(5, 3500, 0.25, 0.2); },
      special: function () { T(80, 2000, 0.5, "sawtooth", 0.18); crackle(12, 3000, 0.3, 0.5); N(0.5, "highpass", 2000, 6000, 0.18); bleat(1.15, 0.3, 0.14, 0.1); for (var i = 0; i < 4; i++) { N(0.12, "lowpass", 3000, 100, 0.4, 0.1 + i * 0.1); T(60, 40, 0.1, "square", 0.25, 0.1 + i * 0.1); } },
      hit: function () { T(1500, 200, 0.1, "sawtooth", 0.14); crackle(4, 4000, 0.3, 0.12); T(120, 120, 0.15, "square", 0.1); }
    },
    TITAN: {
      attack: function () { T(95, 50, 0.2, "sine", 0.45); N(0.08, "lowpass", 600, 100, 0.25); },
      headbutt: function () { T(80, 35, 0.35, "sine", 0.5); N(0.2, "lowpass", 800, 100, 0.35); },
      special: function () { T(50, 22, 1.0, "sine", 0.7); N(0.7, "lowpass", 400, 50, 0.55); N(0.12, "highpass", 3000, 1500, 0.3, 0.2); T(100, 40, 0.5, "sawtooth", 0.1, 0.2); bleat(0.55, 0.8, 0.18, 0.1); },
      hit: function () { T(60, 28, 0.3, "sine", 0.7); N(0.12, "lowpass", 700, 80, 0.4); }
    },
    PHANTOM: {
      attack: function () { T(1300, 300, 0.15, "sine", 0.12); N(0.1, "highpass", 4000, 8000, 0.15); },
      headbutt: function () { T(300, 1100, 0.2, "sine", 0.12); N(0.25, "bandpass", 400, 3000, 0.18, 0, 3); },
      special: function () { T(180, 900, 0.7, "sine", 0.14); T(185, 920, 0.7, "sine", 0.12); N(0.7, "bandpass", 300, 2500, 0.25, 0, 4); bleat(0.8, 0.6, 0.14, 0.4); T(900, 150, 0.3, "triangle", 0.15, 0.55); },
      hit: function () { N(0.1, "highpass", 4500, 9000, 0.3); T(700, 200, 0.1, "triangle", 0.14); }
    },
    BLAZE: {
      attack: function () { N(0.15, "bandpass", 1200, 500, 0.25); crackle(3, 2500, 0.2, 0.15); },
      headbutt: function () { N(0.35, "lowpass", 300, 1800, 0.35); crackle(6, 3000, 0.2, 0.3); },
      special: function () { N(0.9, "lowpass", 200, 1600, 0.45); T(120, 40, 0.8, "sawtooth", 0.2); crackle(10, 3000, 0.25, 0.8); bleat(1.05, 0.4, 0.18, 0.2); N(0.35, "lowpass", 3000, 150, 0.6, 0.55); },
      hit: function () { N(0.2, "lowpass", 2200, 200, 0.5); T(130, 40, 0.2, "sine", 0.4); crackle(4, 2500, 0.2, 0.2); }
    },
    FROST: {
      attack: function () { T(2400, 2400, 0.12, "sine", 0.12); T(3200, 3200, 0.1, "sine", 0.08, 0.03); },
      headbutt: function () { arp([1800, 2400, 3000], "sine", 0.15, 0.1, 0.04); N(0.25, "highpass", 4000, 7000, 0.15); },
      special: function () { arp([1200, 1600, 2000, 2600, 3200], "sine", 0.3, 0.1, 0.06); N(0.7, "highpass", 3000, 8000, 0.15); bleat(1.3, 0.35, 0.1, 0.1); T(100, 50, 0.5, "sine", 0.3, 0.3); },
      hit: function () { N(0.06, "highpass", 6000, 9000, 0.35); T(1800, 900, 0.1, "triangle", 0.12); T(2600, 1500, 0.08, "sine", 0.08, 0.03); }
    },
    SAGE: {
      attack: function () { T(660, 640, 0.15, "sine", 0.18); },
      headbutt: function () { arp([523, 659, 784], "triangle", 0.15, 0.15, 0.05); N(0.15, "bandpass", 3000, 1500, 0.1); },
      special: function () { arp([523, 659, 784, 988, 1318, 1568], "triangle", 0.4, 0.14, 0.07); bleat(1.2, 0.5, 0.1, 0.1); N(0.5, "bandpass", 2500, 3500, 0.07, 0.1); },
      hit: function () { N(0.1, "bandpass", 3000, 1500, 0.2); T(520, 400, 0.08, "sine", 0.14); }
    },
    LANCER: {
      attack: function () { T(1800, 2800, 0.12, "square", 0.07); N(0.1, "highpass", 5000, 9000, 0.2); },
      headbutt: function () { T(400, 1500, 0.22, "sawtooth", 0.1); N(0.2, "bandpass", 1000, 5000, 0.2, 0, 2); T(2000, 3000, 0.1, "square", 0.06, 0.18); },
      special: function () { T(300, 290, 0.9, "sine", 0.4); T(450, 440, 0.8, "sine", 0.2); for (var i = 0; i < 4; i++) { T(1800, 3200, 0.1, "square", 0.07, 0.08 + i * 0.08); N(0.08, "highpass", 5000, 9000, 0.2, 0.08 + i * 0.08); } bleat(1.1, 0.4, 0.12, 0.05); },
      hit: function () { T(1500, 1450, 0.22, "square", 0.08); T(2200, 2100, 0.2, "square", 0.05, 0.02); N(0.05, "highpass", 6000, 9000, 0.3); }
    }
  };
  var GEN = {
    block: function () { T(500, 300, 0.1, "square", 0.12); N(0.06, "bandpass", 1500, 800, 0.2); },
    ko: function () { T(200, 40, 1.0, "sawtooth", 0.3); N(0.8, "lowpass", 2000, 80, 0.5); T(60, 25, 1.1, "sine", 0.6); },
    crit: function () { T(2500, 3500, 0.15, "sine", 0.14); N(0.1, "highpass", 5000, 9000, 0.3); T(1000, 200, 0.2, "sawtooth", 0.1); },
    burn: function () { crackle(6, 2500, 0.2, 0.3); }, poison: function () { for (var i = 0; i < 3; i++) T(300 + i * 90, 600 + i * 120, 0.09, "sine", 0.14, i * 0.07); },
    freeze: function () { T(3000, 3000, 0.12, "sine", 0.1); T(2200, 2200, 0.1, "sine", 0.08, 0.04); }, shock: function () { crackle(7, 3500, 0.25, 0.25); T(150, 2000, 0.15, "sawtooth", 0.1); },
    armor: function () { T(220, 160, 0.25, "square", 0.1); N(0.15, "bandpass", 3000, 2000, 0.2, 0, 3); }, haste: function () { N(0.4, "bandpass", 500, 5000, 0.2, 0, 2); T(300, 1200, 0.3, "sine", 0.08); },
    overdrive: function () { T(100, 400, 0.4, "sawtooth", 0.2); N(0.3, "lowpass", 300, 2500, 0.3); bleat(0.7, 0.4, 0.14, 0.1); }, heal: function () { arp([660, 880, 1320], "sine", 0.3, 0.14, 0.08); }
  };
  window.__GOAT_SFX = {
    play: function (id, kind) {
      try {
        var c = ctx(); if (!c) return; if (c.state === "suspended") c.resume();
        V = vol() * 0.9; if (V <= 0.01) return;
        var f = (K[id] && K[id][kind]) || GEN[kind]; if (f) f();
      } catch (e) {}
    }
  };
})();
