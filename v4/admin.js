/* GOAT RAMPAGE — 어드민 시크릿 코드: 닉네임은 아무거나, 비밀번호를 6448 로 회원가입(또는 로그인)하면 전부 해금 */
(function () {
  "use strict";
  var CODE = "6448", REGIONS = ["GREEN_VALLEY", "DARK_FOREST", "STONE_CITY", "IRON_LAND", "GOAT_ARENA"];
  function apply(S, name) {
    var d = S.getData(), CH = window.__GOAT_CH || {};
    d.unlockedCharacters = Object.keys(CH);
    d.unlockedRegions = REGIONS.slice();
    d.coins = Math.max(d.coins || 0, 999999);
    d.level = Math.max(d.level || 1, 50);
    d.isAdmin = true;
    if (name) d.username = name;           // 입력한 닉네임 그대로 사용
    return S.save();
  }
  function offline(r) { return !r || (!r.ok && /연결할 수 없/.test(r.message || "")); }
  function install(S) {
    var P = Object.getPrototypeOf(S), reg = P.registerAccount, login = P.loginAccount;
    P.registerAccount = async function (u, p) {
      if (p !== CODE) return reg.call(this, u, p);
      var r; try { r = await reg.call(this, u, p); } catch (e) { r = null; }
      if (r && r.ok) { await apply(this); return { ok: true, message: "👑 어드민 계정이 생성되었습니다, " + u + "님! 모든 캐릭터·지역 해금 완료" }; }
      if (offline(r)) { await apply(this, u); return { ok: true, message: "👑 어드민 모드(이 기기)! " + u + "님, 모든 캐릭터·지역이 해금되었습니다" }; }
      return r;                              // 이미 사용 중인 닉네임 등: 서버 메시지 그대로
    };
    P.loginAccount = async function (u, p) {
      if (p !== CODE) return login.call(this, u, p);
      var r; try { r = await login.call(this, u, p); } catch (e) { r = null; }
      if (r && r.ok) { await apply(this); return { ok: true, message: "👑 어드민으로 로그인했습니다, " + u + "님! 모든 캐릭터·지역 해금" }; }
      if (offline(r)) { await apply(this, u); return { ok: true, message: "👑 어드민 모드(이 기기)! " + u + "님, 모든 캐릭터·지역이 해금되었습니다" }; }
      return r;
    };
    try { if (S.getData().isAdmin) apply(S); } catch (e) {}   // 새로 추가된 캐릭터도 자동 해금
  }
  var n = 0, iv = setInterval(function () {
    n++; var S = window.__GOAT_STORE__;
    if (S && window.__GOAT_CH && Object.getPrototypeOf(S).registerAccount) { clearInterval(iv); try { install(S); } catch (e) { console.warn("[admin]", e); } }
    else if (n > 300) clearInterval(iv);
  }, 100);
})();
