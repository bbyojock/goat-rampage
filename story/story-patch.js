/* ============================================================
   GOAT RAMPAGE — 스토리 & 연출 패치 (story-patch)
   게임 본체는 건드리지 않고, 씬 메서드를 감싸서 컷신/대사/분위기를 얹습니다.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 0. 공통 유틸 ---------- */
  var G = null;
  var BUSY = false;                 // 컷신 재생 중이면 true (게임 update 정지)
  var SEEN_KEY = "goat_story_seen_v1";
  var seenMem = {};
  function seenGet(k) {
    try { var o = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"); return !!o[k]; } catch (e) { return !!seenMem[k]; }
  }
  function seenSet(k) {
    seenMem[k] = 1;
    try { var o = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"); o[k] = 1; localStorage.setItem(SEEN_KEY, JSON.stringify(o)); } catch (e) {}
  }
  function save() { try { return window.__GOAT_STORE__ ? window.__GOAT_STORE__.getData() : null; } catch (e) { return null; } }
  function pname() { var s = save(); return (s && s.username) || "도전자"; }
  function done(q) { var s = save(); return !!(s && s.completedQuests && s.completedQuests.indexOf(q) >= 0); }
  var BOSSQ = { GREEN_VALLEY: "quest_gv_boss", DARK_FOREST: "quest_df_boss", STONE_CITY: "quest_sc_boss", IRON_LAND: "quest_il_boss", GOAT_ARENA: "quest_ga_boss" };
  var ORDER = ["GREEN_VALLEY", "DARK_FOREST", "STONE_CITY", "IRON_LAND", "GOAT_ARENA"];
  function shards() { var n = 0; ORDER.forEach(function (r) { if (done(BOSSQ[r])) n++; }); return n; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function fmt(t) { return String(t).replace(/\{name\}/g, pname()); }

  /* ---------- 1. 등장인물 ---------- */
  var CAST = {
    narr:   { name: "", color: "#e2e8f0" },
    you:    { name: "{name}", role: "방울의 아이", tex: "@player", color: "#38bdf8", pitch: 700 },
    bucky:  { name: "장로 버키", role: "수련 교관", tex: "npc_goat", hue: 0, color: "#fbbf24", pitch: 420 },
    pip:    { name: "정찰병 핍", role: "초원 경비대", tex: "npc_goat", hue: 190, color: "#67e8f9", pitch: 760 },
    fern:   { name: "숲지기 펀", role: "고목 수호자", tex: "npc_goat", hue: 110, color: "#86efac", pitch: 520 },
    rex:    { name: "사냥꾼 렉스", role: "번개 추적자", tex: "npc_goat", hue: 25, color: "#fdba74", pitch: 380 },
    gold:   { name: "상인 골드혼", role: "스톤 시티 길드장", tex: "npc_goat", hue: 45, color: "#fde047", pitch: 460 },
    iron:   { name: "성벽 대장 아이언후프", role: "수비대장", tex: "npc_goat", hue: 215, color: "#93c5fd", pitch: 330 },
    spark:  { name: "기술자 스파크", role: "용광로 관리자", tex: "npc_goat", hue: 12, color: "#fb923c", pitch: 640 },
    veil:   { name: "감시자 베일", role: "그림자 추격자", tex: "npc_goat", hue: 265, color: "#c4b5fd", pitch: 560 },
    max:    { name: "아나운서 맥스", role: "아레나 총괄", tex: "npc_goat", hue: 320, color: "#f9a8d4", pitch: 700 },
    BRUTUS: { name: "BRUTUS", role: "붉은 뿔 폭군", tex: "goat_BRUTUS", color: "#f87171", pitch: 200 },
    VOLT:   { name: "VOLT", role: "뇌전의 지배자", tex: "goat_VOLT", color: "#facc15", pitch: 880 },
    TITAN:  { name: "TITAN", role: "강철 성문지기", tex: "goat_TITAN", color: "#94a3b8", pitch: 150 },
    PHANTOM:{ name: "PHANTOM", role: "심연의 암살자", tex: "goat_PHANTOM", color: "#a78bfa", pitch: 300 },
    OMEGA:  { name: "OMEGA RAM", role: "그랜드 챔피언", tex: "goat_RAM", hue: 300, color: "#f0abfc", pitch: 240 },
    RAM:    { name: "야생 RAM", role: "", tex: "goat_RAM", color: "#f87171", pitch: 420 },
    DASH:   { name: "야생 DASH", role: "", tex: "goat_DASH", color: "#f87171", pitch: 800 }
  };

  /* ---------- 2. 시나리오 ---------- */
  var PROLOGUE = [
    "아주 오래전, 염소 왕국의 하늘에는\n〈황금 방울〉이 걸려 있었다.",
    "방울이 울릴 때마다 계곡엔 꽃이 피고,\n숲엔 별이 뜨고, 도시엔 불이 켜졌다.",
    "그러나 붉은 달이 뜬 밤,\n방울은 다섯 조각으로 부서져 대지에 떨어졌다.",
    "조각을 품은 자들은 힘에 취해 날뛰기 시작했다.\n세상은 그것을 〈광란(RAMPAGE)〉이라 불렀다.",
    "그리고 지금 —\n작은 방울 하나를 목에 건 젊은 산양이\n푸른 계곡에 첫발을 디딘다."
  ];

  var CHAPTER = {
    GREEN_VALLEY: { n: 1, title: "푸른 계곡", sub: "가장 평화로웠던 땅에서, 가장 먼저 비명이 울렸다",
      intro: [
        ["narr", "푸른 계곡. 바람은 여전히 부드러웠지만, 동쪽 하늘만은 붉게 물들어 있었다."],
        ["bucky", "왔구나, {name}. ...네 목에 걸린 그 방울, 지금 떨고 있지?"],
        ["you", "(방울이 희미하게 떨린다. 마치 누군가를 부르는 것처럼.)"],
        ["bucky", "조각이 가까이 있다는 뜻이다. 이 계곡 끝에 첫 번째 조각이 있어. 먼저 나를 찾아오거라."]
      ] },
    DARK_FOREST: { n: 2, title: "어둠의 숲", sub: "번개는 울음이 되어 나무 사이를 떠돈다",
      intro: [
        ["narr", "계곡을 지나자 해가 사라졌다. 어둠의 숲 — 번개와 안개가 길을 지우는 곳."],
        ["you", "(첫 번째 조각이 방울 안에서 고요히 울고 있다. 그런데... 숲 쪽에서 다른 소리가 응답한다.)"],
        ["fern", "방울의 아이로구나. 기다렸다. 숲은 지금 아프단다."]
      ] },
    STONE_CITY: { n: 3, title: "스톤 시티", sub: "굳게 닫힌 성문, 의심으로 쌓은 성벽",
      intro: [
        ["narr", "높이 솟은 석조 성벽. 도시는 활기차 보였지만, 성문만은 단단히 걸려 있었다."],
        ["gold", "허허, 손님이군! 요즘은 아무도 못 들어오는데... 자네 목의 그 방울이 통행증인가 보오."],
        ["you", "(두 조각이 방울 속에서 서로 부딪치며 맑은 소리를 낸다.)"]
      ] },
    IRON_LAND: { n: 4, title: "아이언 랜드", sub: "용광로의 불빛 속, 그림자가 길어진다",
      intro: [
        ["narr", "끝없이 돌아가는 기어, 쉼 없이 타는 용광로. 아이언 랜드의 하늘은 언제나 붉다."],
        ["spark", "쿨럭! 손님? 이런 곳에... 아, 그 방울! 소문이 사실이었군."],
        ["narr", "어디선가, 누군가 지켜보고 있다. 그림자 하나가 천천히 움직인다."]
      ] },
    GOAT_ARENA: { n: 5, title: "고트 아레나", sub: "마지막 조각, 그리고 붉은 달의 문",
      intro: [
        ["narr", "황금빛 콜로세움. 수만 개의 함성이 울려도, 방울 소리만은 또렷하게 들렸다."],
        ["max", "신사 숙녀 염소 여러분! 드디어 네 조각을 모은 도전자가 이곳 GOAT ARENA에 입성했습니다!"],
        ["you", "(방울이 이제껏 없이 크게 울린다. 마지막 조각이... 저 안쪽에 있다.)"]
      ] }
  };

  /* NPC별 대화: first(첫 만남) / again(재방문) / done(퀘스트 완료) / after(보스 격파 후) */
  var NPC = {
    elder_bucky: {
      first: [
        ["bucky", "메에~! 드디어 왔구나, {name}. 네 목의 그 방울... 내가 평생 기다린 소리다."],
        ["bucky", "황금 방울이 깨진 밤을 기억하느냐? 그 조각 하나가 이 계곡 끝, 붉은 뿔 BRUTUS의 몸에 박혔다."],
        ["you", "박혔다고요? 스스로 가져간 게 아니라...?"],
        ["bucky", "조각은 주인을 고르지 않아. 마음이 가장 강한 자의 분노를 먹고 자랄 뿐이지."],
        ["bucky", "먼저 몸부터 풀어라. 동쪽의 야생 산양들을 이겨 보거라. 이동, 점프, 박치기... 그리고 회피(Dodge)를 잊지 말고!"]
      ],
      again: [
        ["bucky", "야생 산양들은 동쪽에 있다. 박치기는 가드를 뚫지만, 빗나가면 틈이 크단다. 거리를 재거라."],
        ["bucky", "그리고 기억해라. 이기는 것보다 중요한 건, 쓰러뜨리고도 마음을 잃지 않는 것이다."]
      ],
      done: [
        ["bucky", "해냈구나! 이제 정찰병 핍을 찾아가 보거라. BRUTUS는 만만치 않아."],
        ["bucky", "가드를 믿지 말고, 회피를 믿어라. 번쩍이는 순간이 네 생명줄이다."]
      ],
      after: [
        ["bucky", "BRUTUS의 눈이 맑아졌더구나... 고맙다. 그 아이는 원래 이 계곡을 지키던 내 제자였단다."],
        ["bucky", "다음은 어둠의 숲이다. 번개를 조심해라. ...그리고 {name}, 방울이 울릴 때마다 네가 누구인지 잊지 말거라."]
      ]
    },
    scout_pip: {
      first: [
        ["pip", "쉿, 목소리 낮춰! BRUTUS는 동쪽 끝 제단에 있어. 요즘은 잠도 안 자고 바위만 부수고 있지."],
        ["pip", "녀석의 필살기는 가드가 안 먹혀. 번쩍이는 순간 회피(Dodge)! 무적 프레임을 믿으라고."],
        ["pip", "...사실 BRUTUS는 우리 경비대장이었어. 누구보다 이 계곡을 아꼈지. 부탁이야, 정신만 차리게 해줘."]
      ],
      again: [["pip", "준비됐으면 동쪽으로 가. 체력이 모자라면 야생 산양이랑 한 번 더 붙어서 단련하고 가는 것도 방법이야."]],
      done: [["pip", "BRUTUS가 돌아왔어! 이제야 예전처럼 어깨를 으쓱거리더라. 네 덕분이야, 진짜로."]]
    },
    mystic_fern: {
      first: [
        ["fern", "어둠의 숲에 들어왔군... 발밑을 조심해. 이 숲의 나무들은 번개 소리에 잠을 설친다."],
        ["fern", "숲 깊은 곳 제단에서 VOLT가 조각의 힘을 끌어다 쓰고 있어. 숲을 살리겠다며 시작한 일인데... 이제는 숲이 비명을 지르지."],
        ["fern", "먼저 안개 속 야생 염소들을 가라앉혀 다오. 전류에 홀려 날뛰고 있단다."]
      ],
      again: [["fern", "야생 염소들은 전류에 취해 있어. 겁주려 들지 말고, 정면으로 받아주렴. 그게 이 숲의 예의란다."]],
      done: [["fern", "고맙다. 숲이 조금 숨을 쉬는구나. 이제 렉스를 만나 보렴. 제단으로 가는 길을 알고 있단다."]],
      after: [["fern", "VOLT의 전류가 멎었어. 나무들이 오랜만에 잠들었단다. ...네 방울 소리, 참 따뜻하구나."]]
    },
    hunter_rex: {
      first: [
        ["rex", "숲 가장 깊은 곳에서 푸른 스파크가 튀고 있어. VOLT가 전류를 방출 중이야!"],
        ["rex", "녀석은 원래 숲을 살리려던 마공학자였어. 조각 하나면 고목의 심장을 되살릴 수 있다고 믿었지."],
        ["rex", "VOLT를 꺾으면 그의 뇌전 기술을 네 동료 목록에 해금할 수 있어. ...죽이지는 마. 계산이 틀렸을 뿐인 녀석이니까."]
      ],
      again: [["rex", "제단은 숲 동쪽 끝이야. 번개가 번쩍이면 이미 늦었으니, 번쩍이기 전에 움직여."]],
      done: [["rex", "정말 VOLT를 꺾었군! 이제 그 녀석이 네 편이 되어 줄 거야. 가끔 감전되는 건... 각오해."]]
    },
    merchant_goldhorn: {
      first: [
        ["gold", "스톤 시티에 어서 오게! 이곳에서는 실력이 곧 화폐지."],
        ["gold", "한때는 세상에서 제일 시끄러운 시장이었어. 지금은 성문이 닫혀 장사가 안 돼, 허허..."],
        ["gold", "도시 외곽의 불량 염소들을 정리해 주면 두둑한 보상금을 주겠네!"]
      ],
      again: [["gold", "불량 염소들은 성문 근처에서 얼쩡거리지. 가볍게 몸 풀고 가게나. 보상금은 넉넉히 준비해 두겠네."]],
      done: [["gold", "역시 자네야! 약속대로 보상금은 지급했네. 이제 아이언후프 대장을 만나 보게. 그 친구, 자네를 기다려."]],
      after: [["gold", "성문이 열렸다네! 시장에 사람들이 돌아오고 있어. 오늘 밤은 내가 쏘겠네!"]]
    },
    captain_ironhoof: {
      first: [
        ["iron", "TITAN은 원래 이 도시의 가장 든든한 방패였다. 문을 지키겠다는 맹세를 누구보다 무겁게 여겼지."],
        ["iron", "그런데 조각을 품은 뒤로는, 오가는 자 모두를 적이라 부른다. ...내 오랜 친구가."],
        ["iron", "TITAN의 방어력은 엄청나지만, 스태미나가 빠진 틈을 노리면 승산이 있다. 부탁하네, 그를 문에서 풀어 주게."]
      ],
      again: [["iron", "서두르지 말게. 방패는 두드릴수록 소리를 내지. 스태미나가 바닥나는 순간을 기다리게."]],
      done: [["iron", "친구가 돌아왔네... 눈물이 나는군. 이 도시는 이제 자네의 은혜를 평생 기억할 걸세."]]
    },
    engineer_spark: {
      first: [
        ["spark", "쿨럭쿨럭! 용광로 구역에 폭주하는 전투 염소들이 나타났어."],
        ["spark", "다들 조각 소문을 듣고 몰려든 놈들이야. 공장 가동을 위해 폭주 개체들을 제압해 줘!"]
      ],
      again: [["spark", "녀석들은 용광로 옆에서 열기에 취해 있어. 불똥 조심하고, 오래 끌지 마!"]],
      done: [["spark", "휴, 겨우 공장이 돌아가네! 베일이 널 찾더라. 그 친구... 사연이 있어."]],
      after: [["spark", "PHANTOM이 돌아왔다며? 용광로도 오랜만에 따뜻한 불로 타고 있어!"]]
    },
    shadow_watcher: {
      first: [
        ["veil", "...뒤를 조심해. PHANTOM은 그림자 도약으로 순식간에 거리를 좁힌다."],
        ["veil", "그는 내 형이야. 한때 이 공장 지대를 함께 지키던 사이였지. 조각을 품은 날, 이름을 잃었어."],
        ["veil", "그를 이기면 모든 6종의 전설적인 염소 캐릭터가 해금된다. ...하지만 내가 바라는 건 그게 아니야. 형을 돌려줘."]
      ],
      again: [["veil", "형은 그림자 속에서만 움직여. 빛이 닿는 곳으로 끌어내면 약해진다. ...믿고 있을게."]],
      done: [["veil", "형이... 돌아왔어. 아직 말도 제대로 못 하지만, 내 이름을 불렀어. 고마워, {name}."]]
    },
    announcer_max: {
      first: [
        ["max", "신사 숙녀 염소 여러분! 드디어 GOAT ARENA의 문이 열렸습니다!"],
        ["max", "저 안쪽에 그랜드 챔피언 OMEGA RAM이 기다리고 있습니다. 마지막 조각과 함께 말이죠."],
        ["max", "소문으로는, 그는 폭주한 게 아니라... 무언가를 홀로 막고 있다고 합니다. ...행운을 빕니다, 도전자!"]
      ],
      again: [["max", "함성이 들리십니까? 모두가 당신을 응원하고 있습니다! 준비되시면 안쪽 제단으로!"]],
      done: [["max", "역사적인 순간이었습니다! 당신이 곧 새로운 그랜드 챔피언입니다!"]]
    }
  };

  /* 보스 조우 / 격파 / 패배 */
  var BOSS = {
    GREEN_VALLEY: { id: "BRUTUS", vs: "붉은 뿔 폭군 BRUTUS",
      pre: [
        ["BRUTUS", "...또 한 마리 겁 없는 새끼 염소로군."],
        ["BRUTUS", "내 뿔이 왜 붉은지 아나? 이 계곡을 지키다 부러진 만큼, 피로 물든 거다!"],
        ["BRUTUS", "조각이 속삭여. 약한 놈은 짓밟으라고. 그러니 네가 약하지 않다는 걸... 내게 보여 봐라!", "shake"]
      ],
      preAgain: [["BRUTUS", "또 왔나! 이번엔 뿔이 꺾일 때까지 해 보자!"]],
      post: [
        ["BRUTUS", "크윽... 이 소리... 방울 소리? ...오랜만이군. 이토록 평온한 소리를."],
        ["BRUTUS", "미안하다, 계곡아... 어린 친구, 이걸 가져가라. 내 안에서 울던 조각이다.", "bell"]
      ],
      lose: ["흥, 그 정도로 날 넘겠다고? 더 단련하고 와라!"],
      next: "다음 목적지 — 어둠의 숲" },
    DARK_FOREST: { id: "VOLT", vs: "뇌전의 지배자 VOLT",
      pre: [
        ["VOLT", "측정 불가... 흥미로워. 네 방울이 내 조각과 공명하고 있군."],
        ["VOLT", "숲의 심장을 되살리려면 막대한 전력이 필요했어. 조각은 그 답이었지."],
        ["VOLT", "이제 와서 멈출 순 없어. 실험은... 결과가 나올 때까지 계속된다!", "flash"]
      ],
      preAgain: [["VOLT", "재측정이다. 이번엔 오차 없이 끝내주지!"]],
      post: [
        ["VOLT", "전류가... 잦아든다. 내가 숲의 심장을 태우고 있었군. 계산이 틀렸어."],
        ["VOLT", "가져가라. 그리고 숲에 전해 줘... 미안하다고.", "bell"]
      ],
      lose: ["오차 범위 내의 패배다. 다시 도전해라, 데이터가 더 필요하니까."],
      next: "다음 목적지 — 스톤 시티" },
    STONE_CITY: { id: "TITAN", vs: "강철 성문지기 TITAN",
      pre: [
        ["TITAN", "이 문은 누구도 통과할 수 없다. 약한 자는 지킬 수 없고, 의심스러운 자는 들일 수 없다."],
        ["TITAN", "조각이 말한다. 모두가 적이라고. 그렇다면 나는 모두를 막겠다."],
        ["TITAN", "방패는 부서지지 않는다. 시험해 봐라, 방울의 아이여.", "shake"]
      ],
      preAgain: [["TITAN", "...다시 왔군. 방패는 여전히 굳건하다."]],
      post: [
        ["TITAN", "...방패가 갈라졌군. 처음 듣는 소리였어. 문을 두드리는 소리가 아니라... 문을 열어 달라는 소리."],
        ["TITAN", "열겠다. 이 문을 열겠다. 가져가라, 그리고 도시를 부탁한다.", "bell"]
      ],
      lose: ["...지나갈 수 없다. 돌아가라."],
      next: "다음 목적지 — 아이언 랜드" },
    IRON_LAND: { id: "PHANTOM", vs: "심연의 암살자 PHANTOM",
      pre: [
        ["PHANTOM", "(그림자 속에서) ...베일이 널 보냈구나. 그 아이는 아직도 내 이름을 부르던가."],
        ["PHANTOM", "형이라 부르지 말라 해라. 나는 이미 그림자니까."],
        ["PHANTOM", "조각이 내 이름을 지웠다. 그러니 너도 나를 지워 봐라 — 할 수 있다면!", "red"]
      ],
      preAgain: [["PHANTOM", "...또 그림자를 쫓아오는가."]],
      post: [
        ["PHANTOM", "(가면이 갈라진다) ...베일의 목소리가 들렸어. 아직 날 기다리고 있었다니."],
        ["PHANTOM", "이 조각을 가져가라. 그리고 동생에게 전해 줘. 형은 길을 잃었었다고. 이제는... 돌아간다고.", "bell"]
      ],
      lose: ["...그림자는 쓰러지지 않는다."],
      next: "마지막 목적지 — 고트 아레나" },
    GOAT_ARENA: { id: "OMEGA", vs: "그랜드 챔피언 OMEGA RAM",
      pre: [
        ["OMEGA", "네 방울이 울린다... 조각 넷을 모았구나. 정말로 여기까지 올라왔어."],
        ["OMEGA", "알고 있나? 마지막 조각을 가진 나만이 〈붉은 달의 문〉을 막고 있었다는 걸."],
        ["OMEGA", "조각이 모이면 문이 열려. 그걸 닫을 수 있는 건 '가장 강한 염소의 의지'뿐이다."],
        ["OMEGA", "내가 약해지면 문은 열린다. 그러니 증명해라. 이 문을 네가 대신 닫을 수 있다는 걸!", "red"]
      ],
      preAgain: [["OMEGA", "다시 왔군. 좋다, 증명이 부족했다면 몇 번이고 받아주마."]],
      post: [
        ["OMEGA", "...좋은 박치기였다. 이제 문은 네 손에 맡긴다."],
        ["OMEGA", "방울을 울려라, 젊은 산양. 모든 조각이... 하나로 돌아온다.", "bell"]
      ],
      lose: ["문은 아직 열 수 없다. 더 강해져서 와라."],
      next: "" }
  };

  var WILD_LINES = {
    RAM: "음메에! 지나가려면 박치기를 이겨라!",
    DASH: "느리다 느려! 내 발 그림자도 못 밟을걸!",
    BRUTUS: "뿔 맛을 보고 싶냐? 덤벼라!",
    VOLT: "찌릿찌릿~ 전기 맛 좀 볼래?",
    TITAN: "...비켜라. 아니면 부수겠다.",
    PHANTOM: "…뒤를 조심해."
  };

  var ENDING = [
    "마지막 박치기가 울린 순간,\n목에 걸린 작은 방울이 눈부시게 빛났다.",
    "푸른 계곡에서 BRUTUS의 뿔이 노을처럼 부드러워졌다.\n어둠의 숲에서 VOLT가 오랜만에 별을 올려다보았다.",
    "스톤 시티의 성문이 활짝 열리고,\n아이언 랜드에선 형제가 마주 앉아 불을 쬐었다.",
    "다섯 조각이 하나로 합쳐지자\n〈황금 방울〉이 하늘로 떠올라 웅장하게 울렸다.",
    "붉은 달은 천천히 빛을 잃고,\n염소 왕국에는 오랜만에 맑은 새벽이 찾아왔다.",
    "— 그리고 사람들은 새로운 이름을 불렀다.\n〈방울의 챔피언〉, {name}."
  ];
  var BUCKY_EPILOGUE = [
    ["bucky", "해냈구나, {name}. ...사실 OMEGA RAM은 내 첫 제자였단다. 문을 홀로 막다 지쳐 가는 걸 알면서도, 나는 아무것도 못 했지."],
    ["bucky", "그 아이가 마지막에 웃더구나. 네가 그 웃음을 돌려준 거다."],
    ["you", "(방울이 조용히 속삭인다. 이제 쉬어도 된다고.)"],
    ["bucky", "광란은 끝났다. 하지만 세상은 넓단다. 강한 염소는 언제나 더 있지. 자, 다시 한 번 가 볼까?"]
  ];

  /* ---------- 2-B. 스토리 상태(선택 결과) ---------- */
  var STATE_KEY = "goat_story_state_v1", stMem = {};
  function sall() { try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); } catch (e) { return stMem; } }
  function sget(k) { return sall()[k] || 0; }
  function sset(k, v) { stMem[k] = v; try { var o = sall(); o[k] = v; localStorage.setItem(STATE_KEY, JSON.stringify(o)); } catch (e) {} }
  function sadd(k, n) { sset(k, sget(k) + (n || 1)); }
  function endingKind() {
    var bond = sget("bond"), trust = sget("bucky_trust"), kind = sget("kind");
    if (bond >= 3 && trust >= 1 && kind >= 2) return "TRUE";
    if (bond <= 1 && trust < 1) return "SOLO";
    return "GOOD";
  }

  CAST.dash  = { name: "라이벌 대시", role: "질풍의 라이벌", tex: "goat_DASH", color: "#fb923c", pitch: 820 };
  CAST.lamb  = { name: "새끼 염소 콩이", role: "계곡의 꼬마", tex: "npc_goat", hue: 150, color: "#bef264", pitch: 900 };
  CAST.kid   = { name: "꼬마 보리", role: "스톤 시티 주민", tex: "npc_goat", hue: 75, color: "#fde68a", pitch: 880 };
  CAST.moon  = { name: "붉은 달의 속삭임", role: "문 저편의 소리", color: "#f87171", pitch: 110 };

  /* 필드 이벤트: 선택지 형식  ["?", "질문", [ { c:"선택지", s:{점수:1}, r:[이어지는 대사] } ]] */
  var EVENTS = {
    GREEN_VALLEY: [
      { id: "gv_a", x: 800, run: async function () {
          await say([
            ["narr", "길가의 풀이 납작하게 꺾여 있다. 불에 탄 게 아니라, 거대한 무언가에 짓눌린 듯한 흔적이다."],
            ["narr", "덤불 속에서 작은 울음소리가 들린다."],
            ["lamb", "(훌쩍) ...아저씨 아니죠? 붉은 뿔 아저씨 부하 아니죠?", "", "R"],
            ["you", "(방울이 부드럽게 울린다. 아이가 조금 안심한 얼굴로 고개를 든다.)", "", "L"],
            ["lamb", "BRUTUS 아저씨는... 원래 안 그랬어요. 매일 아침 제 풀밭을 지켜 줬는데, 그날 밤 이후로 혼자 바위만 부수면서 울어요.", "", "R"],
            ["?", "어떻게 할까?", [
              { c: "\"내가 아저씨를 데려올게. 약속할게.\"", s: { kind: 1, lamb_help: 1 }, r: [
                ["lamb", "...진짜요? 약속이에요! 저 콩이예요, 꼭 기억해 주세요!"],
                ["narr", "(콩이가 작은 풀잎 하나를 방울에 묶어 주었다.)"] ] },
              { c: "\"위험하니까 집에 가 있어.\"", r: [
                ["lamb", "...네."],
                ["narr", "(콩이는 풀이 죽은 채 멀어졌다.)"] ] }
            ]]
          ]);
      } },
      { id: "gv_b", x: 1550, duel: true, n: 1, run: async function () {
          await say([
            ["narr", "바람이 갑자기 멎는다. 그리고 — 발밑의 먼지가 폭발했다!"],
            ["dash", "느려터졌네! 같은 영감 밑에서 3년을 같이 굴렀는데, 왜 방울은 네 목에 걸려 있지?", "shake", "R"],
            ["you", "대시...!", "", "L"],
            ["dash", "영감이 방울을 줄 때 내가 얼마나... 아니, 됐어. 말은 필요 없지. 박치기로 정하자!"],
            ["?", "대시의 도발에…", [
              { c: "\"좋아. 받아 줄게.\"", r: [["dash", "그래야 내 라이벌이지!"]] },
              { c: "\"지금은 시간이 없어. 이해해 줘.\"", s: { dash_pride: 1 }, r: [["dash", "...도망치는 거냐? 흥, 그럼 억지로라도 끌어낼 수밖에!"]] }
            ]]
          ]);
          skipped = false;
          await vsSplash("you", "dash", "라이벌 DASH", "RIVAL DUEL  ·  CHAPTER 1");
      } },
    ],
    DARK_FOREST: [
      { id: "df_a", x: 800, run: async function () {
          await say([
            ["narr", "숲 한가운데에 거대한 고목이 서 있다. 가지마다 번개 자국이 시커멓게 박혀 있다."],
            ["fern", "저게 숲의 심장, 고목 '에루나'란다. 한때는 한 번 울리면 숲 전체가 반짝였지.", "", "R"],
            ["fern", "VOLT가 저 나무에서 전기를 뽑아 쓰고 있어. ...나무는 아직 살아 있단다."],
            ["narr", "방울이 고목에 반응하듯 맥동한다."],
            ["?", "고목에 손을 얹어 볼까?", [
              { c: "손을 얹는다.", s: { vision: 1 }, r: [
                ["narr", "순간, 눈앞이 하얗게 번쩍였다.", "flash"],
                ["narr", "— 부서지는 황금빛 방울. 그 앞에서 망치를 든 누군가의 그림자. 붉은 달이 그를 내려다본다."],
                ["you", "(방울을 깬 건... 사고가 아니었어?)", "", "L"],
                ["fern", "무엇을 본 거니, 아이야?", "", "R"],
                ["you", "...아직은 잘 모르겠어요.", "", "L"] ] },
              { c: "방울을 움켜쥐고 서둘러 지나간다.", r: [["narr", "(고목이 쓸쓸히 가지를 흔들었다.)"]] }
            ]]
          ]);
      } },
      { id: "df_b", x: 1550, run: async function () {
          sadd("bond", 1);
          await say([
            ["narr", "찌지직 — 가시덩굴 속에서 낯익은 목소리가 신음한다."],
            ["dash", "으윽... 보지 마! 이거 번개 함정이야. 풀려고 하면 감전된다고!", "flash", "R"],
            ["narr", "방울을 덩굴에 갖다 대자, 덩굴이 맥없이 풀려 내렸다."],
            ["dash", "...뭐야, 방울 힘을 쓸 줄 아는 거냐? 건방지게."],
            ["dash", "빚졌다. 한 번만 말해 줄게. 영감 서재에서 낡은 지도를 봤어. 방울 조각 다섯 개가 '문'의 열쇠라고 적혀 있었어."],
            ["dash", "근데 열쇠를 다 모으면 문이 열리는 거잖아? 우리가 지금 하는 게 맞는 건지, 영 찜찜해."],
            ["?", "대시에게", [
              { c: "\"그래도 가 보자. 직접 확인해야 해.\"", s: { bond: 1 }, r: [["dash", "...네가 그렇게 말하면 믿을 수밖에 없잖아. 같이 간다. 아니, 따라간다!"]] },
              { c: "\"그건 네 상상일 뿐이야.\"", r: [["dash", "...그래. 내가 괜한 소리를 했네."]] }
            ]]
          ]);
          sset("key_clue", 1);
      } },
      ],
    STONE_CITY: [
      { id: "sc_a", x: 850, run: async function () {
          await say([
            ["narr", "시장 거리는 텅 비어 있다. 닫힌 상점 문틈으로 수많은 눈이 이쪽을 엿본다."],
            ["kid", "저기... 방울 달린 분? 부탁이 있어요.", "", "R"],
            ["kid", "성문 앞의 TITAN 아저씨는 예전에 우리 가게 앞에서 매일 휘파람을 불어 줬어요. 이걸 전해 주세요. 우리가 같이 만든 '약속의 호루라기'예요."],
            ["?", "호루라기를 받을까?", [
              { c: "받는다. \"꼭 전해 줄게.\"", s: { kind: 1, titan_token: 1 }, r: [["narr", "(작은 나무 호루라기가 방울과 함께 딸랑였다.)"]] },
              { c: "\"그건 네가 직접 전하렴.\"", r: [["kid", "...무서워서 못 가요..."], ["narr", "(아이는 호루라기를 꼭 쥔 채 물러났다.)"]] }
            ]]
          ]);
      } },
      { id: "sc_b", x: 1550, duel: true, n: 2, run: async function () {
          await say([
            ["narr", "성벽 한쪽에 오래된 벽화가 있다. 방울 아래 다섯 염소가 서 있고, 그 뒤에 — 망치를 든 여섯 번째 그림자."],
            ["dash", "역시 여기까지 왔네. 이 벽화, 봤지? '여섯 번째 종지기'.", "", "R"],
            ["dash", "방울을 깬 건 다섯 중 하나가 아니라 이 여섯 번째래. 그리고 영감 서재에 이거랑 똑같은 그림이 걸려 있었어."],
            ["you", "(...버키 장로님이?)", "", "L"],
            ["dash", "확신은 없어. 그러니까 증명해 봐. 네가 진짜 방울의 주인인지! 이번엔 진심으로 간다!", "flash", "R"]
          ]);
          sset("mural", 1);
          skipped = false;
          await vsSplash("you", "dash", "라이벌 DASH", "RIVAL DUEL  ·  CHAPTER 3");
      } },
    ],
    IRON_LAND: [
      { id: "il_a", x: 850, run: async function () {
          await say([
            ["narr", "용광로의 열기 속에서 방울이 낮게 울린다. 베일이 조용히 입을 연다."],
            ["veil", "...옛날 얘기를 해도 될까. 형과 나는 이 공장 지붕 위에서 별을 세곤 했어.", "", "R"]
          ]);
          el.classList.add("sepia");
          await say([
            ["narr", "— 어린 날, 용광로 지붕. 두 그림자가 나란히 앉아 있다."],
            ["PHANTOM", "베일, 나는 이 지붕에서 떨어지는 법을 알아. 너는 나만 따라오면 돼.", "", "R"],
            ["veil", "형이 가면 나도 갈 거야. 어디든.", "", "L"],
            ["PHANTOM", "...그럼 약속하자. 내가 어디로 가든, 네가 부르면 돌아온다고."]
          ]);
          el.classList.remove("sepia");
          await say([
            ["veil", "그게 마지막 약속이었어. 그 뒤로 형은 한 번도 돌아오지 않았지.", "", "R"],
            ["?", "베일에게", [
              { c: "\"내가 형을 데려올게. 약속해.\"", s: { kind: 1, promise_veil: 1 }, r: [["veil", "...약속은 무거운 말이야. 그래도, 고마워."]] },
              { c: "(말없이 어깨를 두드린다.)", r: [["veil", "...그거면 충분해."]] }
            ]]
          ]);
      } },
      { id: "il_b", x: 1550, run: async function () {
          fx("red");
          await say([
            ["narr", "갑자기 소리가 사라졌다. 용광로 불빛이 붉게 일그러지고, 방울이 스스로 울기 시작한다.", "red"],
            ["moon", "방울의 아이야... 벌써 조각이 셋이나 모였구나. 참으로 따뜻한 소리다.", "", "R"],
            ["moon", "물어라. 네 스승이 왜 방울을 부쉈는지."],
            ["?", "붉은 달의 속삭임", [
              { c: "\"...당신은 누구지?\"", s: { moon_talk: 1 }, r: [
                ["moon", "나는 문 저편의 소리. 그리고 — 너희가 두려워한 것."],
                ["moon", "방울은 자물쇠이자 열쇠. 부순 자는 문을 두려워한 자... 아니, 문을 '아는' 자."] ] },
              { c: "(귀를 막고 방울을 움켜쥔다.)", r: [["moon", "후후... 언젠가 듣게 될 것이다. 마지막 조각 곁에서."]] }
            ]]
          ]);
          await say([["narr", "방울이 잠잠해졌다. 하지만 손바닥엔 식은땀이 맺혀 있다."]]);
      } }
    ],
    GOAT_ARENA: [
      { id: "ga_a", x: 900, run: async function () {
          var bond = sget("bond");
          var lines = [["narr", "아레나 입구. 익숙한 실루엣이 기다리고 있다."]];
          if (bond >= 3) lines.push(["dash", "늦었잖아! 같이 가기로 했으니까 제단까지는 내가 안내한다. ...영감 얘기는 안에서 할 거지?", "", "R"]);
          else if (bond >= 1) lines.push(["dash", "...왔구나. 영감을 만나러 가는 거지? 나도 같이 가.", "", "R"]);
          else lines.push(["dash", "...솔직히 말할게. 널 이기고 싶었는데, 이젠 그것보다 진실이 궁금해. 따라와.", "", "R"]);
          lines.push(["you", "(방울이 조용히 맥동한다. 곧 모든 것을 알게 될 것이다.)", "", "L"]);
          await say(lines);
      } },
      { id: "ga_b", x: 1500, run: async function () {
          await say([
            ["narr", "제단으로 가는 길목. 붉은 달빛 아래 후드를 쓴 노인이 서 있다. 장로 버키다.", "red"],
            ["bucky", "...결국 여기까지 왔구나. 대시도 함께인가.", "", "R"],
            ["dash", "영감! 서재의 벽화, 여섯 번째 종지기... 설명해요!", "", "L"],
            ["bucky", "(긴 침묵) ...모두 사실이다. 그 밤, 방울을 부순 건 — 나다.", "shake", "R"],
            ["bucky", "방울은 울릴 때마다 '붉은 달의 문'을 조금씩 열고 있었다. 아무도 몰랐지. 나는 보았다. 문 저편의 것이 이쪽으로 손을 뻗는 모습을."],
            ["bucky", "그래서 부쉈다. 문을 닫으려고. 하지만 조각이 사람들의 마음을 먹을 줄은 몰랐다. BRUTUS도, VOLT도, TITAN도, PHANTOM도... 모두 내 죄다."],
            ["bucky", "OMEGA RAM은 마지막 조각을 품고 문 앞을 홀로 지켰다. 내가 도망친 자리에서."],
            ["bucky", "{name}. 네게 방울을 건넨 이유는 하나다. 두려움 없이 방울을 울릴 수 있는 아이... 조각을 모아 방울을 '자물쇠'로 다시 벼릴 수 있는 사람."],
            ["?", "버키에게", [
              { c: "\"혼자 짊어질 일이 아니었어요.\"", s: { bucky_trust: 1 }, r: [
                ["bucky", "...고맙구나. 정말로."],
                ["dash", "...영감, 이번엔 혼자 결정하지 마요."] ] },
              { c: "\"왜 말해 주지 않았어요!\"", r: [
                ["bucky", "...그래, 화낼 자격이 있다."],
                ["dash", "...나도 화나. 하지만 지금은 문이 먼저야."] ] },
              { c: "(침묵한 채 방울을 움켜쥔다.)", s: { bucky_silent: 1 }, r: [["bucky", "...말은 필요 없다. 보여 다오."]] }
            ]],
            ["bucky", "OMEGA RAM이 기다린다. 가거라. 그리고... 돌아와서 내 잘못을 꾸짖어 다오.", "", "R"],
            ["narr", "붉은 달이 아레나 위로 천천히 떠오른다.", "red"]
          ]);
          sset("confession", 1);
      } }
    ]
  };

  /* 라이벌 결투 후 대사 */
  function rivalPost(n, win) {
    var L = [];
    if (n === 1) {
      L.push(win ? ["dash", "크윽... 졌다. 졌다고! ...아니, 아직 안 졌어. 다음엔 이긴다.", "", "R"]
                 : ["dash", "...봤지? 방울이 없어도 난 이 정도는 해.", "", "R"]);
      L.push(["dash", "근데 너, 방울 쓸 때 표정이 이상해. 마치 누가 속삭이는 것처럼."]);
      L.push(["?", "대시에게", [
        { c: "손을 내밀어 일으켜 준다.", s: { bond: 1 }, r: [["dash", "...칫. 고맙단 말은 안 한다."]] },
        { c: "(말없이 지나친다.)", r: [["dash", "그래, 그렇게 가라. 어차피 나도 내 갈 길 가니까."]] }
      ]]);
      L.push(["dash", "하나만 말해 둘게. 버키 영감, 뭔가 숨기고 있어. 네 방울... 정말 '선물'일까?"]);
    } else {
      L.push(win ? ["dash", "...좋아. 인정할게. 네 박치기엔 거짓이 없어.", "", "R"]
                 : ["dash", "...이겼다! 하지만 이게 끝이 아니야. 네 안에 아직 뭔가 있어.", "", "R"]);
      L.push(["?", "대시에게", [
        { c: "\"함께 가자.\"", s: { bond: 1 }, r: [["dash", "...영감한테 직접 따질 땐 내가 먼저 말한다. 약속이야."]] },
        { c: "\"각자 길로 가자.\"", r: [["dash", "...알겠어. 아레나에서 보자."]] }
      ]]);
    }
    return L;
  }

  var MOON = {
    GREEN_VALLEY: "하나... 작은 방울이 울었다. 문이 한 뼘, 숨을 쉰다.",
    DARK_FOREST: "둘... 숲이 숨을 쉰다. 문이 또 한 뼘 열렸구나.",
    STONE_CITY: "셋... 도시의 성문이 열릴 때, 다른 문도 함께 열린다.",
    IRON_LAND: "넷... 마지막 하나만 남았다. 오라, 방울의 아이. 네 스승이 두려워한 것을 보러."
  };

  function bossPost(rid) {
    var b = BOSS[rid], p = b.post.slice(), last = p.pop(), ex = [];
    if (rid === "GREEN_VALLEY") ex = sget("lamb_help")
      ? [["BRUTUS", "...콩이라는 꼬마가 네 얘기를 하더군. 아저씨를 데려오겠다고 약속했다지? 그 약속, 지켜 준 셈이군."]]
      : [["BRUTUS", "...계곡의 꼬마들에게 사과해야겠군. 한참 겁을 줬어."]];
    if (rid === "DARK_FOREST" && sget("vision")) ex = [["VOLT", "고목이 네게 무언가를 보여 줬나? 그 나무는 오래된 기억을 품고 있지. 방울을 부순 '그림자'의 기억을."]];
    if (rid === "STONE_CITY" && sget("titan_token")) ex = [["TITAN", "...이 호루라기... '보리'의 것이군. 문 앞에서 매일 불어 주겠다고 약속했었지. 잊고 있었다니..."]];
    if (rid === "IRON_LAND" && sget("promise_veil")) ex = [["PHANTOM", "...베일이 그랬나. 부르면 돌아가겠다던 약속. 이번엔 내가 먼저 부르마. ...베일."]];
    if (rid === "GOAT_ARENA") ex = sget("bucky_trust")
      ? [["OMEGA", "버키가 마침내 입을 열었나 보군. 그 늙은이를 용서해 줘서 고맙다."]]
      : [["OMEGA", "스승을 원망하지 마라. 그분도 그저... 두려웠을 뿐이다."]];
    return p.concat(ex, [last]);
  }

  var ENDINGS = {
    TRUE: {
      pages: [
        "마지막 박치기가 울린 순간, 다섯 조각이 하나로 모이며\n〈황금 방울〉이 눈부시게 떠올랐다.",
        "문 저편에서 뻗어 오던 붉은 손이 방울 소리에 닿아 천천히 물러났다.\n이번에 방울은 '열쇠'가 아니라 '자물쇠'로 울렸다.",
        "BRUTUS는 콩이를 어깨에 태우고 계곡을 걸었고,\nVOLT는 고목 에루나의 가지에 새 별을 걸었다.",
        "스톤 시티 성문에는 호루라기 소리가 울려 퍼지고,\n아이언 랜드에서는 형제가 오랜만에 같은 지붕 위에 앉았다.",
        "그리고 아레나 한가운데 — 버키와 OMEGA RAM, 그리고 대시가\n나란히 서서 방울을 올려다보았다.",
        "모두가 함께 방울을 울렸다. 새벽이 왔다.\n〈방울의 챔피언〉은 혼자가 아니었다."
      ],
      epi: [
        ["dash", "자, 챔피언님. 다음 도전자는 나야. 방울 없이도 널 이길 거다!", "", "R"],
        ["you", "(웃으며 박치기 자세를 잡는다.)", "", "L"],
        ["bucky", "허허... 그럼 다시 시작이로구나. 이번에는 모두 함께 말이다.", "", "R"],
        ["OMEGA", "문은 닫혔다. 이제 내가 아닌 '우리'가 지킨다."]
      ],
      c1: "THE TRUE END", c2: "함께 울린 방울", c3: "모든 인연이 하나의 소리가 되었다", c4: "※ 모든 지역은 계속 자유롭게 탐험·대전할 수 있습니다"
    },
    GOOD: {
      pages: ENDING.slice(),
      epi: [
        ["bucky", "해냈구나, {name}. ...방울은 이제 자물쇠다. 내 죄는 아직 남았지만, 문은 닫혔다.", "", "R"],
        ["bucky", "OMEGA RAM은 내 첫 제자였다. 그 아이가 마지막에 웃더구나. 네가 그 웃음을 돌려준 거다."],
        ["you", "(방울이 조용히 속삭인다. 이제 쉬어도 된다고.)", "", "L"],
        ["bucky", "광란은 끝났다. 하지만 세상은 넓단다. 강한 염소는 언제나 더 있지. 자, 다시 한 번 가 볼까?", "", "R"]
      ],
      c1: "THE END", c2: "황금 방울의 챔피언", c3: "플레이해 주셔서 고맙습니다", c4: "※ 라이벌·마음씨·스승과의 관계에 따라 다른 결말이 있습니다 (📖 일지)"
    },
    SOLO: {
      pages: [
        "마지막 박치기가 울리고, 다섯 조각이 하나로 모였다.",
        "방울은 문을 닫았다. 하지만 곁에서 박수 치는 이는 없었다.\n대시는 어디에도 보이지 않았고, 버키의 의자는 비어 있었다.",
        "챔피언은 홀로 새벽을 맞았다.\n방울은 변함없이 맑게 울렸지만, 그 소리는 조금 쓸쓸했다.",
        "— 그래도 문은 닫혔다.\n〈외로운 챔피언〉, {name}. 언젠가 누군가 그 곁에 앉게 될까."
      ],
      epi: [["narr", "(방울이 조용히 울린다. 마치 누군가의 이름을 부르는 것처럼.)"]],
      c1: "THE END", c2: "외로운 챔피언", c3: "다른 선택을 했다면, 다른 새벽이 왔을지도 모른다", c4: "※ 라이벌과 가까워지고, 약한 이들을 돌보고, 스승을 믿어 보세요 (📖 일지)"
    }
  };

  /* ---------- 3. 오디오 (독립 WebAudio) ---------- */
  var AC = null;
  function ac() {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
    } catch (e) { AC = null; }
    return AC;
  }
  function tone(f, dur, type, vol, when, slideTo) {
    var c = ac(); if (!c) return;
    try {
      var t = c.currentTime + (when || 0);
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || "square"; o.frequency.setValueAtTime(f, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol || 0.04, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  /* ---- 염소 울음소리 합성 ("메에에~") ---- */
  function bleatOn() { try { return localStorage.getItem("goat_bleat_off") !== "1"; } catch (e) { return true; } }
  function makeBleat(c, dest, t0, pitch, dur, vol, opt) {
    opt = opt || {}; vol = vol * 3;
    var f0 = 330 * pitch, d = dur;
    var o = c.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(f0 * 0.82, t0);
    o.frequency.linearRampToValueAtTime(f0 * 1.06, t0 + d * 0.22);     // 처음에 살짝 치솟고
    o.frequency.linearRampToValueAtTime(f0 * (opt.drop || 0.9), t0 + d * 0.8);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.62, t0 + d);        // 끝에서 뚝 떨어짐
    // 떨림(vibrato) – 염소 특유의 바들바들
    var vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 26 + Math.random() * 6; vg.gain.value = f0 * 0.05;
    vib.connect(vg); vg.connect(o.frequency);
    // 진폭 떨림(tremolo)
    var am = c.createGain(); am.gain.value = 0.62;
    var lfo = c.createOscillator(), lg = c.createGain(); lfo.type = "square"; lfo.frequency.value = 30 + Math.random() * 8; lg.gain.value = 0.38;
    lfo.connect(lg); lg.connect(am.gain);
    // 모음 'ㅔ' 포먼트 + 비음
    var f1 = c.createBiquadFilter(); f1.type = "bandpass"; f1.frequency.value = 600 * (0.8 + pitch * 0.25); f1.Q.value = 5;
    var f2 = c.createBiquadFilter(); f2.type = "bandpass"; f2.frequency.value = 1900 * (0.85 + pitch * 0.18); f2.Q.value = 7;
    var g1 = c.createGain(); g1.gain.value = 1.0; var g2 = c.createGain(); g2.gain.value = 0.7;
    // 숨소리 노이즈
    var nb = c.createBuffer(1, Math.max(1, (c.sampleRate * d) | 0), c.sampleRate), nd = nb.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.35;
    var ns = c.createBufferSource(); ns.buffer = nb; var nf = c.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 2400; nf.Q.value = 1.2;
    var ng = c.createGain(); ng.gain.value = 0.25;
    var env = c.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(vol, t0 + 0.04);
    env.gain.setValueAtTime(vol, t0 + d * 0.7);
    env.gain.exponentialRampToValueAtTime(0.0004, t0 + d);
    o.connect(am); am.connect(f1); am.connect(f2); f1.connect(g1); f2.connect(g2); g1.connect(env); g2.connect(env);
    ns.connect(nf); nf.connect(ng); ng.connect(env);
    env.connect(dest);
    o.start(t0); vib.start(t0); lfo.start(t0); ns.start(t0);
    o.stop(t0 + d + 0.05); vib.stop(t0 + d + 0.05); lfo.stop(t0 + d + 0.05); ns.stop(t0 + d + 0.05);
  }
  var lastBleat = 0;
  function bleat(pitch, dur, vol, delay, force) {
    if (!bleatOn()) return;
    var now = Date.now(); if (!force && now - lastBleat < 250) return; lastBleat = now;
    var c = ac(); if (!c) return;
    try { makeBleat(c, c.destination, c.currentTime + (delay || 0), pitch || 1, dur || 0.6, vol || 0.09); } catch (e) {}
  }
  function pitchFor(c) { return Math.max(0.5, Math.min(1.9, 0.45 + (c.pitch || 450) / 650)); }
  window.__GOAT_BLEAT__ = { make: makeBleat, play: bleat };

  function blip(pitch) { tone((pitch || 500) * (0.92 + Math.random() * 0.2), 0.05, "square", 0.025); }
  function chime() { [880, 1320, 1760, 2640].forEach(function (f, i) { tone(f, 1.4, "sine", 0.05, i * 0.09); }); }
  function rumble() { tone(70, 0.9, "sawtooth", 0.05, 0, 38); }
  function zap() { tone(1800, 0.25, "sawtooth", 0.04, 0, 120); }
  function fanfare() { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.35, "triangle", 0.05, i * 0.13); }); }

  /* ---------- 4. 스타일 & DOM ---------- */
  var css = [
    "#cine{position:fixed;inset:0;z-index:5000;display:none;background:transparent;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR','Malgun Gothic',sans-serif;color:#fff;user-select:none;-webkit-user-select:none;touch-action:manipulation}",
    "#cine.on{display:block}",
    "#cine .bg{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .6s}",
    "#cine.dim .bg{opacity:.55}#cine.black .bg{opacity:1}",
    "#cine .bar{position:absolute;left:0;right:0;background:#000;height:0;transition:height .55s cubic-bezier(.2,.8,.2,1);z-index:3}",
    "#cine .bar.t{top:0}#cine .bar.b{bottom:0}",
    "#cine.on.lb .bar{height:11vh}",
    "#cine .vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,.65) 100%);pointer-events:none;z-index:2}",
    "#cine .fl{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:9}",
    "#cine .fl.go{animation:cflash .5s ease-out}",
    "#cine .fl.red{background:#ef4444}",
    "@keyframes cflash{0%{opacity:.9}100%{opacity:0}}",
    "#cine .pt{position:absolute;bottom:calc(11vh + 2vh + 25vh);height:34vh;max-width:30vw;display:flex;align-items:flex-end;z-index:4;transition:opacity .25s,transform .25s}",
    "#cine .pt canvas{height:100%;width:auto;max-width:100%;image-rendering:pixelated;filter:drop-shadow(0 4px 10px #000)}",
    "#cine .pt.L{left:6vw}#cine .pt.R{right:6vw}",
    "#cine .pt.dimmed{opacity:.35;transform:scale(.94)}",
    "#cine .pt.hide{opacity:0}",
    "#cine .box{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(11vh + 1.5vh);width:min(92vw,880px);min-height:23vh;background:rgba(10,14,28,.93);border:3px solid #fbbf24;border-radius:12px;padding:calc(2.2vh + 10px) 2.4vw 2.8vh;z-index:5;box-shadow:0 8px 30px rgba(0,0,0,.6)}",
    "#cine .nm{position:absolute;top:-2.6vh;left:18px;padding:3px 14px;border-radius:8px;font-weight:800;font-size:clamp(12px,2.8vh,17px);background:#0b1120;border:2px solid currentColor;letter-spacing:.5px;white-space:nowrap}",
    "#cine .nm small{opacity:.75;font-weight:500;margin-left:8px;font-size:.8em}",
    "#cine .tx{font-size:clamp(14px,3.4vh,21px);line-height:1.55;min-height:3.1em;white-space:pre-wrap;word-break:keep-all}",
    "#cine .nx{position:absolute;right:16px;bottom:8px;font-size:15px;color:#fbbf24;animation:cblink 1s infinite}",
    "@keyframes cblink{50%{opacity:.1}}",
    "#cine .spd{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);right:112px;z-index:8;background:rgba(15,23,42,.75);border:1px solid #94a3b8;color:#e2e8f0;border-radius:8px;padding:6px 12px;font-size:13px}",
    "#cine .skip{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);right:14px;z-index:8;background:rgba(15,23,42,.75);border:1px solid #94a3b8;color:#e2e8f0;border-radius:8px;padding:6px 12px;font-size:13px}",
    "#cine .nar{position:absolute;inset:0;display:none;align-items:center;justify-content:center;text-align:center;padding:0 8vw;z-index:5;font-size:clamp(17px,4.4vh,30px);line-height:1.9;white-space:pre-wrap;color:#f1f5f9;text-shadow:0 0 18px rgba(251,191,36,.5);letter-spacing:.5px}",
    "#cine.nmode .nar{display:flex}#cine.nmode .box,#cine.nmode .pt{display:none}",
    "#cine .card{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:6;padding:0 6vw}",
    "#cine.cmode .card{display:flex}#cine.cmode .box,#cine.cmode .pt,#cine.cmode .nar{display:none}",
    "#cine .card .c1{font-size:clamp(12px,3vh,18px);letter-spacing:6px;color:#fbbf24;opacity:0;animation:cin 1s .1s forwards}",
    "#cine .card .c2{font-size:clamp(30px,10vh,64px);font-weight:900;margin:1vh 0;letter-spacing:3px;color:#fff;text-shadow:0 0 24px rgba(251,191,36,.7),0 4px 0 #7c2d12;opacity:0;animation:cin 1s .5s forwards}",
    "#cine .card .c3{font-size:clamp(12px,3.2vh,19px);color:#cbd5e1;opacity:0;animation:cin 1s 1s forwards}",
    "#cine .card .c4{margin-top:2vh;font-size:clamp(12px,3vh,17px);color:#fbbf24;opacity:0;animation:cin 1s 1.4s forwards}",
    "@keyframes cin{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}",
    "#cine .vs{position:absolute;inset:0;display:none;z-index:6;overflow:hidden}",
    "#cine.vmode .vs{display:block}#cine.vmode .box,#cine.vmode .pt,#cine.vmode .nar,#cine.vmode .card{display:none}",
    "#cine .vs .s1,#cine .vs .s2{position:absolute;top:0;bottom:0;width:62%;background:linear-gradient(100deg,#0c4a6e,#0284c7);}",
    "#cine .vs .s1{left:-62%;transform:skewX(-12deg);animation:vin1 .45s .05s cubic-bezier(.2,.9,.2,1) forwards}",
    "#cine .vs .s2{right:-62%;transform:skewX(-12deg);background:linear-gradient(100deg,#b91c1c,#7f1d1d);animation:vin2 .45s .05s cubic-bezier(.2,.9,.2,1) forwards}",
    "@keyframes vin1{to{left:-6%}}@keyframes vin2{to{right:-6%}}",
    "#cine .vs canvas{position:absolute;bottom:14vh;height:52vh;width:auto;image-rendering:pixelated;opacity:0;animation:cin .5s .45s forwards;filter:drop-shadow(0 6px 14px #000)}",
    "#cine .vs .c1{left:8vw}#cine .vs .c2{right:8vw;transform:scaleX(-1)}",
    "#cine .vs .vt{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font-size:clamp(40px,16vh,120px);font-weight:900;color:#fde047;text-shadow:0 0 30px #f59e0b,0 6px 0 #7c2d12;opacity:0;animation:vpop .5s .55s cubic-bezier(.2,2,.3,1) forwards}",
    "@keyframes vpop{from{opacity:0;transform:translateY(-50%) scale(2.4)}to{opacity:1;transform:translateY(-50%) scale(1)}}",
    "#cine .vs .n1,#cine .vs .n2{position:absolute;bottom:3vh;font-size:clamp(14px,4vh,26px);font-weight:900;text-shadow:0 2px 0 #000;z-index:2}",
    "#cine .vs .n1{left:8vw;color:#bae6fd}#cine .vs .n2{right:8vw;color:#fecaca;text-align:right}",
    "#cine .vs .bn{position:absolute;left:0;right:0;top:14vh;text-align:center;font-size:clamp(12px,3vh,18px);letter-spacing:4px;color:#fbbf24;z-index:2}",
    "@keyframes cshake{0%,100%{transform:translate(0,0)}15%{transform:translate(-8px,5px)}30%{transform:translate(7px,-6px)}45%{transform:translate(-6px,-4px)}60%{transform:translate(5px,6px)}75%{transform:translate(-3px,2px)}}",
    "body.cshake #game-container,body.cshake #cine .pt,body.cshake #cine .box{animation:cshake .5s}",
    "#mood{position:fixed;z-index:1100;pointer-events:none;display:none;overflow:hidden}",
    "#mood canvas{position:absolute;inset:0;width:100%;height:100%}",
    "#mood .mv{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,calc(.35 + var(--bn,0)*.25)) 100%),radial-gradient(ellipse at center,transparent 40%,rgba(185,28,28,calc(var(--bn,0)*.55)) 100%)}",
    "#mood .row{position:absolute;left:2.2%;top:12.2%;display:flex;gap:6px;align-items:center;pointer-events:auto}",
    "#mood .jr{font-size:clamp(10px,2.2vh,14px);font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(30,41,59,.85);border:1px solid #94a3b8;color:#e2e8f0}",
    "#mood .shard{font-size:clamp(10px,2.2vh,14px);font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(15,23,42,.8);border:1px solid #fbbf24;color:#fde68a;white-space:nowrap}",
    "#mood .toast{position:absolute;left:50%;top:24%;transform:translateX(-50%);padding:8px 18px;border-radius:10px;background:rgba(10,14,28,.9);border:2px solid #fbbf24;color:#fff;font-weight:700;font-size:clamp(12px,2.6vh,17px);text-align:center;opacity:0;transition:opacity .4s;white-space:pre-wrap;max-width:90%}",
    "#mood .toast.on{opacity:1}#mood .toast.warn{border-color:#ef4444;color:#fecaca}",
    "#mood .banner{position:absolute;left:0;right:0;top:34%;text-align:center;font-weight:900;font-size:clamp(18px,6vh,40px);letter-spacing:4px;color:#fff;text-shadow:0 0 20px #f59e0b,0 3px 0 #000;opacity:0;transform:scale(.9)}",
    "#mood .banner.on{animation:bnr 2.6s ease-out forwards}",
    "#cine .ch{display:none;flex-direction:column;gap:6px;margin-top:8px}",
    "#cine .chb{text-align:left;padding:8px 12px;border-radius:8px;border:2px solid #fbbf24;background:#1e293b;color:#fff;font-size:clamp(12px,3vh,17px);line-height:1.3}",
    "#cine .chb:active{background:#b45309}",
    "#cine.sepia .bg{background:#4a3417;opacity:.82}",
    "#jrnl{position:fixed;inset:0;z-index:5500;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.75);font-family:-apple-system,'Noto Sans KR',sans-serif}",
    "#jrnl.on{display:flex}",
    "#jrnl .jb{width:min(94vw,520px);max-height:92vh;overflow:auto;background:#0f172a;border:3px solid #fbbf24;border-radius:12px;padding:14px;color:#e2e8f0;font-size:13px;line-height:1.55}",
    "#jrnl h3{margin:0 0 8px;color:#fbbf24;font-size:18px}#jrnl h4{margin:12px 0 4px;color:#fde68a;font-size:14px}",
    "#jrnl .jx{display:block;width:100%;margin-top:12px;padding:10px;border-radius:8px;border:1px solid #64748b;background:#1e293b;color:#fff;font-size:14px}",
    "#jrnl .dim{color:#64748b}#jrnl .ok{color:#86efac}#jrnl .hint{color:#fca5a5;font-size:12px}",
    "@keyframes bnr{0%{opacity:0;transform:scale(.8)}12%{opacity:1;transform:scale(1)}80%{opacity:1}100%{opacity:0;transform:scale(1.05)}}"
  ].join("\n");
  var st = document.createElement("style"); st.id = "story-patch-style"; st.textContent = css; document.head.appendChild(st);

  var el = document.createElement("div"); el.id = "cine";
  el.innerHTML = '<div class="bg"></div><div class="vig"></div><div class="bar t"></div><div class="bar b"></div>' +
    '<div class="pt L hide"></div><div class="pt R hide"></div>' +
    '<div class="nar"></div><div class="card"><div class="c1"></div><div class="c2"></div><div class="c3"></div><div class="c4"></div></div>' +
    '<div class="vs"><div class="s1"></div><div class="s2"></div><div class="bn"></div><canvas class="c1"></canvas><canvas class="c2"></canvas><div class="vt">VS</div><div class="n1"></div><div class="n2"></div></div>' +
    '<div class="box"><div class="nm"></div><div class="tx"></div><div class="ch"></div><div class="nx">▼</div></div>' +
    '<div class="fl"></div><button class="skip" type="button">SKIP ▶▶</button><button class="spd" type="button">⏩ 보통</button>';
  var mood = document.createElement("div"); mood.id = "mood";
  mood.innerHTML = '<canvas></canvas><div class="mv"></div><div class="row"><div class="shard"></div><button class="jr" type="button">📖 일지</button></div><div class="toast"></div><div class="banner"></div>';
  function mount() { document.body.appendChild(mood); document.body.appendChild(el); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  var $ = function (s) { return el.querySelector(s); };

  /* ---------- 5. 포트레이트 ---------- */
  var pcache = {};
  function sprite(texKey) {
    if (pcache[texKey]) return pcache[texKey];
    try {
      var tex = G.textures.get(texKey); if (!tex || texKey === "__MISSING") return null;
      var fr = tex.get(0) || tex.get();
      var w = fr.cutWidth, h = fr.cutHeight;
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      var x = c.getContext("2d"); x.imageSmoothingEnabled = false;
      x.drawImage(fr.source.image, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
      var d = x.getImageData(0, 0, w, h).data, x0 = w, y0 = h, x1 = 0, y1 = 0;
      for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) if (d[(yy * w + xx) * 4 + 3] > 20) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      if (x1 <= x0) { pcache[texKey] = c; return c; }
      var c2 = document.createElement("canvas"); c2.width = x1 - x0 + 1; c2.height = y1 - y0 + 1;
      c2.getContext("2d").drawImage(c, x0, y0, c2.width, c2.height, 0, 0, c2.width, c2.height);
      pcache[texKey] = c2; return c2;
    } catch (e) { return null; }
  }
  function playerTex() {
    try { var sc = G.scene.getScene("StoryScene"); if (sc && sc.playerChar) return "goat_" + sc.playerChar; } catch (e) {}
    var s = save(); return "goat_" + ((s && s.unlockedCharacters && s.unlockedCharacters[0]) || "RAM");
  }
  function castTex(c) { return c.tex === "@player" ? playerTex() : c.tex; }
  function fillPortrait(host, c) {
    host.innerHTML = "";
    if (!c || !c.tex) return false;
    var src = sprite(castTex(c)); if (!src) return false;
    var cv = document.createElement("canvas"); cv.width = src.width; cv.height = src.height;
    cv.getContext("2d").drawImage(src, 0, 0);
    if (c.hue) cv.style.filter = "hue-rotate(" + c.hue + "deg) drop-shadow(0 4px 10px #000)";
    host.appendChild(cv); return true;
  }

  /* ---------- 6. 시네마틱 엔진 ---------- */
  var seq = null, waiter = null, typing = null, skipped = false;
  function advance() { if (waiter) { var w = waiter; waiter = null; w(); } }
  function fx(kind) {
    var f = $(".fl");
    if (kind === "shake") { document.body.classList.remove("cshake"); void document.body.offsetWidth; document.body.classList.add("cshake"); rumble(); setTimeout(function () { document.body.classList.remove("cshake"); }, 600); }
    else if (kind === "flash") { f.className = "fl"; void f.offsetWidth; f.classList.add("go"); zap(); }
    else if (kind === "red") { f.className = "fl red"; void f.offsetWidth; f.classList.add("go"); rumble(); }
    else if (kind === "bell") { f.className = "fl"; void f.offsetWidth; f.classList.add("go"); chime(); }
  }
  function openCine(opt) {
    opt = opt || {};
    skipped = false; BUSY = true;
    el.className = "on lb" + (opt.black ? " black" : " dim");
    el.querySelector(".skip").style.display = opt.noSkip ? "none" : "";
    ac(); syncSpd();
  }
  function closeCine() {
    el.className = ""; BUSY = false; waiter = null;
    document.body.classList.remove("cshake");
  }
  function waitTap(maxMs) {
    return new Promise(function (res) {
      var t = null;
      waiter = function () { if (t) clearTimeout(t); res(); };
      if (maxMs) t = setTimeout(function () { waiter = null; res(); }, maxMs);
    });
  }
  function typeText(node, text, pitch) {
    return new Promise(function (res) {
      var i = 0, full = text.length;
      node.textContent = "";
      var iv = setInterval(function () {
        if (skipped) { clearInterval(iv); typing = null; node.textContent = text; return res(); }
        i += 1; node.textContent = text.slice(0, i);
        if (i % 2 === 0 && /\S/.test(text[i - 1] || "")) blip(pitch);
        if (i >= full) { clearInterval(iv); typing = null; res(); }
      }, speedFast() ? 11 : 28);
      typing = function () { clearInterval(iv); typing = null; node.textContent = text; res(); };
    });
  }
  function speedFast() { try { return localStorage.getItem("goat_story_speed") === "fast"; } catch (e) { return false; } }
  function syncSpd() { var b = el.querySelector(".spd"); if (b) b.textContent = speedFast() ? "⏩ 빠름" : "⏩ 보통"; }
  var chooser = null;
  function choose(opts) {
    return new Promise(function (res) {
      var box = $(".ch"); box.innerHTML = "";
      opts.forEach(function (o, i) {
        var b = document.createElement("button"); b.type = "button"; b.className = "chb"; b.dataset.i = i;
        b.textContent = (i + 1) + ". " + fmt(o.c); box.appendChild(b);
      });
      box.style.display = "flex";
      chooser = function (i) { if (i < 0 || i >= opts.length) return; chooser = null; box.style.display = "none"; res(i); };
    });
  }
  async function say(lines) {
    lines = lines.slice();
    el.classList.remove("nmode", "cmode", "vmode");
    var L = $(".pt.L"), R = $(".pt.R"), nm = $(".nm"), tx = $(".tx"), nx = $(".nx");
    var sideOf = {};
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i], key = ln[0];
      if (skipped && key !== "?" && !ln.keep) continue;
      if (ln.keep) skipped = false;
      if (key === "?") {
        L.classList.add("dimmed"); R.classList.add("dimmed");
        nm.style.display = "none"; tx.style.fontStyle = "italic"; tx.style.color = "#fde68a";
        nx.style.visibility = "hidden";
        await typeText(tx, fmt(ln[1]), 600);
        var idx = await choose(ln[2]), o = ln[2][idx];
        if (o.s) for (var k in o.s) sadd(k, o.s[k]);
        if (o.r && o.r.length) Array.prototype.splice.apply(lines, [i + 1, 0].concat(o.r));
        continue;
      }
      var c = CAST[key] || CAST.narr, side = ln[3];
      if (!side) { side = (key === "you") ? "L" : "R"; }
      if (key === "narr") {
        L.classList.add("dimmed"); R.classList.add("dimmed");
        nm.style.display = "none"; tx.style.fontStyle = "italic"; tx.style.color = "#cbd5e1";
      } else {
        nm.style.display = ""; tx.style.fontStyle = ""; tx.style.color = "#fff";
        var host = side === "L" ? L : R, other = side === "L" ? R : L;
        if (sideOf[side] !== key) { var ok = fillPortrait(host, c); host.classList.toggle("hide", !ok); sideOf[side] = key; }
        host.classList.remove("dimmed"); other.classList.add("dimmed");
        nm.style.color = c.color; nm.style.borderColor = c.color;
        nm.innerHTML = fmt(c.name) + (c.role ? "<small>" + c.role + "</small>" : "");
      }
      nx.style.visibility = "hidden";
      if (ln[2]) fx(ln[2]);
      if (key !== "narr" && key !== "moon" && key !== "kid") bleat(pitchFor(c), key === "bucky" ? 0.75 : 0.5, 0.08, 0, true);
      else if (key === "moon") { tone(60, 0.9, "sawtooth", 0.05, 0, 40); }
      await typeText(tx, fmt(ln[1]), c.pitch);
      nx.style.visibility = "visible";
      if (skipped) continue;
      await waitTap(0);
    }
    L.classList.add("hide"); R.classList.add("hide");
  }
  async function narrate(pages, opt) {
    opt = opt || {};
    el.classList.remove("cmode", "vmode"); el.classList.add("nmode", "black");
    var n = $(".nar");
    for (var i = 0; i < pages.length; i++) {
      if (skipped) break;
      n.style.opacity = 0; n.style.transition = "none"; n.textContent = fmt(pages[i]);
      void n.offsetWidth; n.style.transition = "opacity 1s"; n.style.opacity = 1;
      await waitTap(opt.auto || 0);
      if (skipped) break;
      n.style.transition = "opacity .5s"; n.style.opacity = 0; await sleep(450);
    }
    el.classList.remove("nmode");
  }
  async function card(c1, c2, c3, c4, ms) {
    var cd = $(".card");
    cd.querySelector(".c1").textContent = c1 || ""; cd.querySelector(".c2").textContent = c2 || "";
    cd.querySelector(".c3").textContent = c3 || ""; cd.querySelector(".c4").textContent = c4 || "";
    // 애니메이션 재시작
    cd.style.display = "none"; void cd.offsetWidth; cd.style.display = "";
    el.classList.remove("nmode", "vmode"); el.classList.add("cmode");
    await waitTap(ms || 3600);
    el.classList.remove("cmode");
  }
  async function vsSplash(c1key, c2key, name, banner) {
    var a = CAST[c1key], b = CAST[c2key];
    var v = $(".vs"), cv1 = v.querySelector("canvas.c1"), cv2 = v.querySelector("canvas.c2");
    function put(cv, c) { var s = sprite(castTex(c)); cv.width = s ? s.width : 1; cv.height = s ? s.height : 1; var x = cv.getContext("2d"); x.imageSmoothingEnabled = false; x.clearRect(0, 0, cv.width, cv.height); if (s) x.drawImage(s, 0, 0); cv.style.filter = (c.hue ? "hue-rotate(" + c.hue + "deg) " : "") + "drop-shadow(0 6px 14px #000)"; }
    put(cv1, a); put(cv2, b);
    v.querySelector(".n1").textContent = fmt(a.name);
    v.querySelector(".n2").textContent = name || b.name;
    v.querySelector(".bn").textContent = banner || "";
    // 애니메이션 재시작
    var kids = v.children; for (var i = 0; i < kids.length; i++) { kids[i].style.animation = "none"; void kids[i].offsetWidth; kids[i].style.animation = ""; }
    el.classList.remove("nmode", "cmode"); el.classList.add("vmode");
    fx("shake"); setTimeout(function () { fx("flash"); }, 520);
    bleat(pitchFor(a), 0.7, 0.1, 0.45, true); bleat(pitchFor(b) * 0.9, 0.9, 0.11, 0.95, true);
    await waitTap(2400);
    el.classList.remove("vmode");
  }

  async function runCine(fn, opt) {
    if (BUSY) return;
    openCine(opt);
    try { await fn(); } catch (e) { try { console.error("[story-patch]", e); } catch (_) {} }
    closeCine();
  }

  /* 입력: 탭/클릭/키 */
  el.addEventListener("click", function (e) {
    var cb = e.target.closest && e.target.closest(".chb");
    if (cb && chooser) { chooser(+cb.dataset.i); return; }
    if (e.target.classList.contains("spd")) { try { localStorage.setItem("goat_story_speed", speedFast() ? "normal" : "fast"); } catch (_) {} syncSpd(); return; }
    if (e.target.classList.contains("skip")) { skipped = true; if (typing) typing(); advance(); return; }
    if (typing) { typing(); return; }
    advance();
  });
  el.addEventListener("touchstart", function (e) { e.stopPropagation(); }, { passive: true });
  window.addEventListener("keydown", function (e) {
    if (!el.classList.contains("on")) return;
    var k = e.key;
    if (chooser && /^[1-9]$/.test(k)) { e.preventDefault(); e.stopImmediatePropagation(); chooser(+k - 1); return; }
    if (chooser) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (k === "Enter" || k === " " || k === "j" || k === "J" || k === "e" || k === "E" || k === "Escape") {
      e.preventDefault(); e.stopImmediatePropagation();
      if (k === "Escape") { skipped = true; }
      if (typing) typing(); else advance();
    } else { e.stopImmediatePropagation(); }
  }, true);
  window.addEventListener("keyup", function (e) { if (el.classList.contains("on")) e.stopImmediatePropagation(); }, true);

  /* ---------- 7. 분위기 레이어(파티클/비네트/토스트) ---------- */
  var M = { region: null, on: false, parts: [], bn: 0, lastRect: "", nextBolt: 0, raf: 0 };
  var PCFG = {
    GREEN_VALLEY: { n: 38, col: "255,250,170", sz: [1.5, 3], vx: [10, 25], vy: [-14, -4], glow: 0 },
    DARK_FOREST: { n: 32, col: "190,255,120", sz: [1.5, 3.2], vx: [-8, 8], vy: [-8, 8], glow: 1, blink: 1 },
    STONE_CITY: { n: 46, col: "210,215,225", sz: [1, 2.4], vx: [-30, -8], vy: [6, 22], glow: 0 },
    IRON_LAND: { n: 60, col: "255,140,40", sz: [1.2, 3], vx: [-6, 12], vy: [-60, -20], glow: 1 },
    GOAT_ARENA: { n: 56, col: "255,215,90", sz: [1.4, 3.6], vx: [-14, 14], vy: [-10, 14], glow: 1, blink: 1 }
  };
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function seedParts(r) {
    var c = PCFG[r]; M.parts = [];
    for (var i = 0; i < c.n; i++) M.parts.push({ x: Math.random(), y: Math.random(), s: rnd(c.sz[0], c.sz[1]), vx: rnd(c.vx[0], c.vx[1]), vy: rnd(c.vy[0], c.vy[1]), ph: Math.random() * 6.28 });
  }
  function canvasEl() { return document.querySelector("#game-container canvas"); }
  function placeMood() {
    var cv = canvasEl(); if (!cv) return false;
    var r = cv.getBoundingClientRect(), key = [r.left | 0, r.top | 0, r.width | 0, r.height | 0].join();
    if (key !== M.lastRect) {
      M.lastRect = key;
      mood.style.left = r.left + "px"; mood.style.top = r.top + "px"; mood.style.width = r.width + "px"; mood.style.height = r.height + "px";
      var c = mood.querySelector("canvas"); c.width = Math.max(1, r.width | 0); c.height = Math.max(1, r.height | 0);
    }
    return true;
  }
  var lastT = 0;
  function moodLoop(t) {
    M.raf = requestAnimationFrame(moodLoop);
    var storyActive = false;
    try { storyActive = G && G.scene.isActive("StoryScene"); } catch (e) {}
    if (!storyActive || !M.region) { mood.style.display = "none"; lastT = t; return; }
    if (!placeMood()) return;
    mood.style.display = "block";
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
    var c = mood.querySelector("canvas"), x = c.getContext("2d"), W = c.width, H = c.height, cfg = PCFG[M.region];
    x.clearRect(0, 0, W, H);
    var run = !BUSY;
    for (var i = 0; i < M.parts.length; i++) {
      var p = M.parts[i];
      if (run) {
        p.x += p.vx * dt / 600; p.y += p.vy * dt / 360; p.ph += dt * 2.2;
        if (cfg.blink) { p.x += Math.sin(p.ph) * 0.0006; }
        if (p.x < -0.05) p.x = 1.05; if (p.x > 1.05) p.x = -0.05;
        if (p.y < -0.05) p.y = 1.05; if (p.y > 1.05) p.y = -0.05;
      }
      var a = cfg.blink ? 0.25 + 0.75 * Math.abs(Math.sin(p.ph)) : 0.75;
      var px = p.x * W, py = p.y * H, s = p.s * (H / 540);
      if (cfg.glow) { var g = x.createRadialGradient(px, py, 0, px, py, s * 4); g.addColorStop(0, "rgba(" + cfg.col + "," + a * 0.8 + ")"); g.addColorStop(1, "rgba(" + cfg.col + ",0)"); x.fillStyle = g; x.beginPath(); x.arc(px, py, s * 4, 0, 6.3); x.fill(); }
      x.fillStyle = "rgba(" + cfg.col + "," + a + ")"; x.fillRect(px, py, Math.max(1, s), Math.max(1, s));
    }
    mood.style.setProperty("--bn", M.bn.toFixed(2));
    // 번개 (어둠의 숲)
    if (M.region === "DARK_FOREST" && run && t > M.nextBolt) {
      if (M.nextBolt) {
        try { var sc = G.scene.getScene("StoryScene"); sc.cameras.main.flash(160, 210, 225, 255); } catch (e) {}
        zap(); setTimeout(rumble, 350);
      }
      M.nextBolt = t + rnd(7000, 14000);
    }
  }
  function setShards() { var s = shards(); mood.querySelector(".shard").textContent = "🔔 황금 방울 조각 " + s + " / 5"; }
  var toastT = 0;
  function toast(msg, ms, warn) {
    var n = mood.querySelector(".toast"); n.textContent = msg; n.className = "toast on" + (warn ? " warn" : "");
    clearTimeout(toastT); toastT = setTimeout(function () { n.className = "toast"; }, ms || 3000);
  }
  function banner(msg) {
    var n = mood.querySelector(".banner"); n.textContent = msg; n.classList.remove("on"); void n.offsetWidth; n.classList.add("on");
  }

  /* ---------- 8. 씬 후킹 ---------- */
  function npcLines(npc, regionId, qline) {
    var d = NPC[npc.id], lines = [];
    if (d) {
      var qdone = qline && qline.charAt(0) === "✅";
      var bossDone = done(BOSSQ[regionId]);
      var key = seenGet("npc_" + npc.id) ? "again" : "first";
      if (qdone && d.done) key = "done";
      if (bossDone && d.after) key = "after";
      lines = (d[key] || d.again || d.first).slice();
      if (npc.id === "shadow_watcher" && key === "done" && sget("promise_veil")) lines.push(["veil", "약속, 지켜 줬네. ...이제 형이랑 별 보러 갈 수 있겠어."]);
      if (npc.id === "scout_pip" && key === "done" && sget("lamb_help")) lines.push(["pip", "아, 그리고 콩이가 네 얘기만 해. 풀잎 방울 달고 다니는 걸 봤어, 귀여운 녀석이지?"]);
      if (npc.id === "elder_bucky" && key === "done") lines.push(["narr", "(장로의 시선이 잠시 네 방울에 머물렀다. 무언가 말하려다, 입을 다문다.)"]);
      seenSet("npc_" + npc.id);
    } else {
      lines = npc.dialogue.map(function (t) { return ["bucky", t]; });
    }
    if (qline) { var ql = ["narr", qline]; ql.keep = true; lines.push(ql); }
    return lines;
  }

  function markersFor(scene) {
    try {
      (scene.__mk || []).forEach(function (o) { o.destroy(); }); scene.__mk = [];
      scene.npcs.forEach(function (n) {
        var q = (n.questId || "");
        var d = q && done(q);
        var t = scene.add.text(n.x, n.sprite.y - 165, d ? "✔" : "❗", { fontSize: d ? "26px" : "34px", color: d ? "#4ade80" : "#fde047", stroke: "#000", strokeThickness: 5, fontStyle: "bold" }).setOrigin(0.5).setDepth(18);
        var base = n.sprite.y - 165;
        scene.tweens.add({ targets: t, y: base - 10, duration: 520, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        scene.__mk.push(t);
      });
    } catch (e) {}
  }

  async function chapterIntro(scene, regionId) {
    var ch = CHAPTER[regionId]; if (!ch) return;
    M.region = regionId; seedParts(regionId); M.bn = 0; M.nextBolt = 0; setShards();
    var firstEver = !seenGet("prologue");
    var firstCh = !seenGet("ch_" + regionId);
    if (firstEver || firstCh) {
      await runCine(async function () {
        if (firstEver) {
          seenSet("prologue");
          el.classList.add("black"); el.classList.remove("dim");
          await narrate(PROLOGUE);
          if (!skipped) { await card("GOAT RAMPAGE", "광란의 서막", "작은 방울 하나가 울기 시작했다", "", 3200); }
        }
        skipped = false;
        seenSet("ch_" + regionId);
        el.classList.remove("black"); el.classList.add("dim");
        await card("CHAPTER " + ch.n, ch.title, ch.sub, "🔔 황금 방울 조각 " + shards() + " / 5", 3600);
        skipped = false;
        await say(ch.intro);
      });
      scene.interactCooldown = 800;
    } else {
      var key = regionId + "|" + ((Date.now() / 20000) | 0);
      if (M.lastToast !== key) { M.lastToast = key; banner("CHAPTER " + ch.n + " · " + ch.title); }
    }
  }

  /* ---------- 8-B. 필드 이벤트 / 라이벌 / 일지 ---------- */
  async function playEnding(kd) {
    var E = ENDINGS[kd]; fanfare();
    if (kd === "TRUE") [0.9, 1.2, 0.7, 1.5, 1.0].forEach(function (p, i) { bleat(p, 0.7, 0.07, 0.4 + i * 0.28, true); });
    el.classList.add("black"); el.classList.remove("dim");
    await narrate(E.pages); skipped = false;
    el.classList.remove("black"); el.classList.add("dim");
    await say(E.epi); skipped = false;
    el.classList.add("black"); el.classList.remove("dim");
    sset("ending_" + kd, 1);
    await card(E.c1, E.c2, E.c3, E.c4, 8000);
  }
  function checkEvents(scene) {
    var list = EVENTS[scene.regionId]; if (!list || BUSY || !scene.playerState) return;
    var px = scene.playerState.x;
    for (var i = 0; i < list.length; i++) {
      var ev = list[i];
      if (sget("ev_" + ev.id)) continue;
      if (px >= ev.x) runEvent(scene, ev);
      return;
    }
  }
  async function runEvent(scene, ev) {
    if (BUSY) return;
    if (!ev.duel) sset("ev_" + ev.id, 1);
    await runCine(async function () { await ev.run(scene); });
    scene.interactCooldown = 800;
    if (ev.duel) {
      window.__RIVAL = { ev: ev.id, region: scene.regionId, n: ev.n };
      scene.scene.start("VersusScene", { mode: "CPU", p1Character: scene.playerChar, p2Character: "DASH", regionId: scene.regionId, opponentName: "라이벌 DASH" });
    }
  }
  async function rivalAfter(sc, rv, d) {
    await sleep(900);
    if (!G.scene.isActive("ResultScene") || BUSY) { sset("ev_" + rv.ev, 1); return; }
    await runCine(async function () { await say(rivalPost(rv.n, !!d.isPlayerWin)); });
    sset("ev_" + rv.ev, 1);
    sc.scene.start("StoryScene", { regionId: rv.region });
  }

  var jr = document.createElement("div"); jr.id = "jrnl";
  jr.innerHTML = '<div class="jb"><h3>📖 스토리 일지</h3><div class="jc"></div><button type="button" class="jx">닫기</button></div>';
  document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(jr); });
  if (document.body) document.body.appendChild(jr);
  var CLUES = [
    ["vision", "고목의 환영", "방울을 부수는 망치 든 그림자를 보았다"],
    ["key_clue", "낡은 지도", "방울 조각 다섯 개는 '붉은 달의 문'의 열쇠"],
    ["mural", "스톤 시티의 벽화", "다섯 종지기 뒤의 여섯 번째 그림자"],
    ["moon_talk", "붉은 달의 속삭임", "방울은 자물쇠이자 열쇠"],
    ["confession", "버키의 고백", "방울을 부순 사람은 장로 버키였다"]
  ];
  function renderJournal() {
    var h = "<h4>챕터 진행</h4>";
    ORDER.forEach(function (r) { var c = CHAPTER[r], dn = done(BOSSQ[r]); h += '<div class="' + (dn ? "ok" : "dim") + '">' + (dn ? "✔" : "·") + " CH" + c.n + " " + c.title + (dn ? " — 조각 획득" : "") + "</div>"; });
    h += "<h4>🔔 황금 방울 조각 " + shards() + " / 5</h4><h4>단서</h4>";
    CLUES.forEach(function (c) { h += sget(c[0]) ? '<div class="ok">✔ ' + c[1] + ' — ' + c[2] + "</div>" : '<div class="dim">? ??? (아직 발견하지 못했다)</div>'; });
    h += "<h4>관계</h4><div>라이벌 대시와의 유대 ♥ " + sget("bond") + " / 4</div><div>약한 이들을 돌본 마음씨 ✦ " + sget("kind") + " / 3</div>";
    h += "<div>스승 버키에 대한 신뢰: " + (sget("confession") ? (sget("bucky_trust") ? "믿는다" : "응어리가 남았다") : "아직 모른다") + "</div>";
    var ends = ["TRUE", "GOOD", "SOLO"].filter(function (k) { return sget("ending_" + k); });
    h += "<h4>본 엔딩</h4><div>" + (ends.length ? ends.map(function (k) { return { TRUE: "함께 울린 방울", GOOD: "황금 방울의 챔피언", SOLO: "외로운 챔피언" }[k]; }).join(" / ") : '<span class="dim">없음</span>') + "</div>";
    var rk = ends.slice(); if (!rk.length && done(BOSSQ.GOAT_ARENA)) rk = [endingKind()];
    if (rk.length) { h += "<h4>🎬 엔딩 다시 보기</h4>"; rk.forEach(function (k) { h += '<button type="button" class="jx er" data-k="' + k + '">' + { TRUE: "함께 울린 방울", GOOD: "황금 방울의 챔피언", SOLO: "외로운 챔피언" }[k] + "</button>"; }); }
    h += '<div class="hint" style="margin-top:8px">💡 TRUE END: 라이벌과 가까워지고(♥3+), 약한 이들을 돌보고(✦2+), 스승을 믿어 보세요.</div>';
    jr.querySelector(".jc").innerHTML = h;
  }
  function openJournal() { if (BUSY) return; renderJournal(); jr.classList.add("on"); BUSY = true; }
  function closeJournal() { jr.classList.remove("on"); BUSY = false; }
  jr.addEventListener("click", function (e) {
    var t = e.target;
    if (t.classList.contains("er")) { var k = t.getAttribute("data-k"); closeJournal(); runCine(function () { return playEnding(k); }); return; }
    if (t.classList.contains("jx") || t === jr) closeJournal();
  });
  mood.querySelector(".jr").addEventListener("click", openJournal);

  function hook() {
    var SS = Object.getPrototypeOf(G.scene.getScene("StoryScene"));
    var VS = Object.getPrototypeOf(G.scene.getScene("VersusScene"));
    var RS = Object.getPrototypeOf(G.scene.getScene("ResultScene"));

    /* 캐릭터 교체 버그 수정: init()이 매번 첫 캐릭터로 되돌리던 문제 */
    var sInit = SS.init;
    SS.init = function () {
      var prev = this.playerChar, wasSet = this.__selSet;
      var r = sInit.apply(this, arguments);
      try {
        var unlocked = (save() && save().unlockedCharacters) || [];
        var want = wasSet ? prev : null;
        if (!want) { try { want = localStorage.getItem("goat_story_char"); } catch (e) {} }
        if (want && unlocked.indexOf(want) >= 0) this.playerChar = want;
        this.__selSet = true;
        try { localStorage.setItem("goat_story_char", this.playerChar); } catch (e) {}
      } catch (e) {}
      return r;
    };
    /* StoryScene.create */
    var sCreate = SS.create;
    SS.create = function () {
      var r = sCreate.apply(this, arguments), sc = this;
      try { markersFor(sc); } catch (e) {}
      M.warned = false; window.__RIVAL = null;
      try {
        var rid0 = sc.regionId;
        if (ORDER.some(function (r) { return done(BOSSQ[r]); })) seenSet("prologue");
        if (done(BOSSQ[rid0]) && !seenGet("ch_" + rid0)) {      // 이미 클리어한 지역: 컷신을 조용히 건너뜀
          seenSet("ch_" + rid0); seenSet("bosspre_" + rid0); seenSet("bossdone_" + rid0);
          (EVENTS[rid0] || []).forEach(function (ev) { sset("ev_" + ev.id, 1); });
        }
      } catch (e) {}
      setTimeout(function () { chapterIntro(sc, sc.regionId); }, 120);
      return r;
    };
    /* StoryScene.update : 컷신 중 정지 + 보스 접근 연출 */
    var sUpdate = SS.update;
    SS.update = function (t, d) {
      if (BUSY) return;
      var r = sUpdate.apply(this, arguments);
      try {
        var px = this.playerState && this.playerState.x;
        if (typeof px === "number") {
          var target = Math.max(0, Math.min(1, (px - 1750) / 350));
          M.bn += (target - M.bn) * 0.08;
          if (px > 1850 && !M.warned) {
            M.warned = true; banner("⚠  강대한 기운이 느껴진다  ⚠");
            this.cameras.main.shake(500, 0.006); this.cameras.main.flash(220, 255, 60, 60); rumble(); bleat(0.55, 1.1, 0.12, 0.1, true);
            toast(BOSS[this.regionId] ? "보스 · " + BOSS[this.regionId].vs : "", 3200, true);
          }
          if (px < 1700) M.warned = false;
        }
      } catch (e) {}
      try { checkEvents(this); } catch (e) {}
      return r;
    };
    /* NPC 대화 */
    var sNpc = SS.openNpcDialogue;
    SS.openNpcDialogue = function (npc) {
      if (BUSY) return;
      var scene = this, qline = "";
      try {
        sNpc.call(this, npc);
        var txt = (this.dialogueBody.text || "").split("\n"); qline = txt[txt.length - 1] || "";
        this.dialogueContainer.setVisible(false);
        if (!/^(✅|📜)/.test(qline)) qline = "";
      } catch (e) { qline = ""; }
      var lines = npcLines(npc, this.regionId, qline);
      runCine(function () { return say(lines); }).then(function () {
        scene.interactCooldown = 800; markersFor(scene); setShards();
      });
    };

    /* VersusScene : 조우 연출 */
    var vCreate = VS.create, vUpdate = VS.update;
    VS.create = function () {
      var r = vCreate.apply(this, arguments), sc = this, d = this.sceneData;
      if (d && d.storyContext) {
        var ctx = d.storyContext, isBoss = ctx.isBoss, rid = ctx.regionId;
        BUSY = true;                       // 첫 프레임부터 정지
        setTimeout(function () {
          if (!el.classList.contains("on")) BUSY = false;
          runCine(async function () {
            if (isBoss && BOSS[rid]) {
              var b = BOSS[rid], first = !seenGet("bosspre_" + rid);
              seenSet("bosspre_" + rid);
              el.classList.add("dim");
              await say(first ? b.pre : b.preAgain);
              skipped = false;
              await vsSplash("you", b.id, b.vs, "CHAPTER " + CHAPTER[rid].n + "  ·  BOSS BATTLE");
            } else {
              var cid = d.p2Character, c = CAST[cid] ? cid : "RAM";
              if (!CAST[c]) c = "RAM";
              var champ = ["BRUTUS", "VOLT", "TITAN", "PHANTOM"].indexOf(cid) >= 0;
              if (champ && !seenGet("echo_note")) {
                seenSet("echo_note");
                await say([["narr", "(쓰러뜨린 챔피언의 모습이다. 조각의 파편이 남긴 '광란의 메아리'가 그들을 흉내 내고 있다...)"]]);
              }
              var w = { name: (champ ? "광란의 " : "야생 ") + cid, role: "", tex: "goat_" + cid, color: "#f87171", pitch: (CAST[cid] && CAST[cid].pitch) || 420 };
              CAST["wild_" + cid] = w;
              await say([["wild_" + cid, WILD_LINES[cid] || "덤벼라!", "", "R"]]);
            }
          }, { noSkip: false });
        }, 60);
      }
      return r;
    };
    VS.update = function () { if (BUSY) return; return vUpdate.apply(this, arguments); };

    /* ResultScene : 격파/패배 연출 */
    var rCreate = RS.create;
    RS.create = function () {
      var r = rCreate.apply(this, arguments), sc = this;
      Promise.resolve(r).then(function () {
        var d = sc.resultData; if (!d) return;
        var rv = window.__RIVAL;
        if (rv && !d.storyContext) { window.__RIVAL = null; return rivalAfter(sc, rv, d); }
        if (!d.storyContext) return;
        var rid = d.storyContext.regionId, isBoss = d.storyContext.isBoss, b = BOSS[rid];
        setShards();
        if (d.isPlayerWin && isBoss && b) {
          if (seenGet("bossdone_" + rid)) return;
          return sleep(900).then(function () {
            if (!G.scene.isActive("ResultScene") || BUSY) return;   // 그 사이 화면을 나갔으면 건너뜀
            seenSet("bossdone_" + rid);
            return runCine(async function () {
              el.classList.add("dim");
              await say(bossPost(rid));
              skipped = false;
              if (MOON[rid]) { await say([["moon", MOON[rid], "red"]]); skipped = false; }
              await card("SHARD ACQUIRED", "🔔 " + shards() + " / 5", CHAPTER[rid].title + "의 조각이 방울에 깃들었다", b.next || "", 3800);
              skipped = false;
              if (rid === "GOAT_ARENA") await playEnding(endingKind());
            });
          });
        } else if (!d.isPlayerWin && !d.isDraw && isBoss && b) {
          return sleep(600).then(function () {
            if (!G.scene.isActive("ResultScene") || BUSY) return;
            return runCine(async function () {
              el.classList.add("dim");
              await say([[b.id, b.lose[0], "", "R"]]);
            });
          });
        } else if (d.isPlayerWin && !isBoss) {
          var q = ["야생 염소가 머쓱하게 물러났다.", "쓰러진 야생 염소가 뿔을 번쩍 치켜들었다.", "좋은 승부였다! 야생 염소가 길을 비켰다."];
          toast(q[Math.floor(Math.random() * q.length)], 2800);
        }
      });
      return r;
    };

    moodLoopStart();
  }
  /* 필드 환경음 + 박치기/스페셜 입력 시 울음 */
  var nextAmb = 0;
  setInterval(function () {
    try {
      if (!G || BUSY || !bleatOn()) return;
      if (!G.scene.isActive("StoryScene")) return;
      var t = Date.now();
      if (t < nextAmb) return;
      if (nextAmb) bleat(0.7 + Math.random() * 1.1, 0.5 + Math.random() * 0.4, 0.035, 0, true);
      nextAmb = t + 9000 + Math.random() * 14000;
    } catch (e) {}
  }, 1000);
  window.addEventListener("keydown", function (e) {
    if (BUSY || e.repeat || (e.key !== "k" && e.key !== "K")) return;
    try { if (G.scene.isActive("VersusScene") || G.scene.isActive("StoryScene")) bleat(0.8 + Math.random() * 0.5, 0.45, 0.07); } catch (_) {}
  });
  document.addEventListener("pointerdown", function (e) {
    try {
      var b = e.target.closest && e.target.closest(".v-btn"); if (!b || BUSY) return;
      var t = (b.textContent || "").toUpperCase();
      if (t.indexOf("RAM") >= 0 || t.indexOf("SPECIAL") >= 0) bleat(0.8 + Math.random() * 0.5, 0.45, 0.07);
    } catch (_) {}
  }, true);

  function moodLoopStart() { if (!M.raf) M.raf = requestAnimationFrame(moodLoop); }

  /* ---------- 9. 부팅 ---------- */
  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    G = window.__GOAT_RAMPAGE_GAME__;
    if (G && G.scene && G.scene.getScene("StoryScene") && G.scene.getScene("VersusScene") && G.scene.getScene("ResultScene")) {
      clearInterval(iv);
      try { hook(); } catch (e) { try { console.error("[story-patch] hook 실패", e); } catch (_) {} }
    } else if (tries > 400) clearInterval(iv);
  }, 100);
  window.__GOAT_STORY__ = { sget: sget, sset: sset, endingKind: endingKind, vsSplash: vsSplash, say: say, narrate: narrate, card: card, runCine: runCine, reset: function () { try { localStorage.removeItem(SEEN_KEY); } catch (e) {} seenMem = {}; } };
})();
